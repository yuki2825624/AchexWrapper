export class EventEmitter {
    #events = [];

    on(name, callback) {
        this.#events.push({ name, callback });
    }

    once(name, callback) {
        this.#events.push({
            name,
            callback: () => {
                callback();
                this.off(name, callback);
            }
        });
    }

    off(name, callback) {
        const index = this.#events.findIndex((event) => event.name === name && event.callback === callback);
        if (index !== -1) this.#events.splice(index, 1);
    }

    emit(name, data) {
        for (const event of this.#events) {
            if (event.name !== name) continue;
            event.callback(data);
        }
    }
}

export class Achex {
    /** @type {WebSocket} */
    #ws;

    #requests = [];

    #interval;

    constructor(instance, options = {}) {
        const { autoRelaunch = true } = options;
        this.options = { autoRelaunch };
        this.instance = instance;
        this.ping = -1;
        this.events = new EventEmitter();
        this.#reload();
    }

    #reload() {
        this.startTime = Date.now();
        this.#ws = new WebSocket(`wss://cloud.achex.ca/${this.instance}`);

        this.#ws.addEventListener("open", () => {
            this.events.emit("open", {});
        });

        this.#ws.addEventListener("message", ({ data }) => {
            if (typeof data !== "string") return;
            const packet = JSON.parse(data);

            if ("FROM" in packet) {
                if ("toS" in packet) {
                    const { FROM: name, sID: id } = packet;
                    const session = new AchexSession(this, id, name);
                    this.events.emit("data", { data: packet, session });
                }
                if ("toH" in packet) {
                    const { toH: name } = packet;
                    const channel = new AchexChannel(this, name);
                    this.events.emit("data", { data: packet, channel });
                }
            }
            else {
                this.events.emit("data", { data: packet });
                const request = this.#requests.shift();
                request(packet);
            }
            
            if ("joinedHub" in packet) {
                const { joinedHub: channelName, user: sessionName, sID: sessionId } = packet;
                const session = new AchexSession(this, sessionId, sessionName, false);
                const channel = new AchexChannel(this, channelName);
                this.events.emit("sessionJoinChannel", { channel, session });
            }

            if ("leftHub" in packet) {
                const { joinedHub: channelName, user: sessionName, sID: sessionId } = packet;
                const session = new AchexSession(this, sessionId, sessionName, false);
                const channel = new AchexChannel(this, channelName);
                this.events.emit("sessionLeaveChannel", { channel, session });
            }
        });

        this.#ws.addEventListener("close", () => {
            this.events.emit("close", {});
            clearInterval(this.#interval);
            if (this.options.autoRelaunch) {
                this.#reload();
            }
        });

        this.#ws.addEventListener("error", () => {
            this.events.emit("error", {});
            clearInterval(this.#interval);
            if (this.options.autoRelaunch) {
                this.#reload();
            }
        });

        if (!this.#interval) {
            let currentInterval = 0;
            this.#interval = setInterval(() => {
                if (currentInterval % 5 === 0) {
                    this.#updatePing();
                }

                currentInterval += 1;
            }, 1000);
        }
    }

    async #updatePing() {
        const startTime = Date.now();
        await this._request({ "echo": "ping" });
        this.ping = Date.now() - startTime;
    }

    _send(object) {
        this.#ws.send(JSON.stringify(object));
    }

    _request(object, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                reject(new Error(`Request response timeout: ${JSON.stringify(object)}`));
            }, timeout);

            this.#requests.push((packet) => {
                clearTimeout(id);
                resolve(packet);
            });

            this.#ws.send(JSON.stringify(object));
        });
    }

    async auth(name) {
        const { auth, SID: sessionId } = await this._request({ "auth": name, "passwd": "qwerty" });
        if (auth !== "OK") throw Error("Failed to authenticate the session.");
        this.session = new AchexSession(this, sessionId, name, true);
        return this.session;
    }

    close() {
        this.#ws.close();
        this.ping = -1;
    }
}

export class AchexSession {
    #original;

    constructor(achex, id, name, original) {
        /** @type {Achex} */
        this.achex = achex;
        this.id = id;
        this.name = name;
        this.#original = original;
    }

    async join(channelName) {
        if (!this.#original) throw Error("The session is not original.");
        const { joinHub } = await this.achex._request({ "joinHub": channelName });
        if (joinHub !== "OK") throw Error("Failed to join channel.");
        this.channel = new AchexChannel(this.achex, channelName);
        this.channel.send({ "joinedHub": channelName, "user": this.name, "sID": this.id });
        return this.channel;
    }

    async leave() {
        if (!this.#original) throw Error("The session is not original.");
        if (!this.channel) throw Error("The session does not belong to the channel.");
        const { leaveHub } = await this.achex._request({ "joinHub": this.channel.name });
        if (leaveHub !== "Ok") throw Error("Failed to leave channel.");
        this.channel = void 0;
    }

    send(session, data) {
        if (!this.#original) throw Error("The session is not original.");
        if (typeof session === "string") {
            this.achex._send({ "to": session, ...data });
        }
        if (typeof session === "number") {
            this.achex._send({ "toS": session, ...data });
        }
    }
}

export class AchexChannel {
    constructor(achex, name) {
        /** @type {Achex} */
        this.achex = achex;
        this.name = name;
    }

    send(data) {
        this.achex._send({ "toH": this.name, ...data });
    }
}