export type If<Value extends boolean, TrueResult, FalseResult = void> =
    Value extends true ? TrueResult :
    Value extends false ? FalseResult :
    TrueResult | FalseResult;

export class EventEmitter<EventTypes> {
    private constructor();
    on<K extends keyof EventTypes>(key: K, callback: (arg: AchexEventTypes[K]) => void): (arg: AchexEventTypes[K]) => void;
    once<K extends keyof EventTypes>(key: K, callback: (arg: AchexEventTypes[K]) => void): (arg: AchexEventTypes[K]) => void;
    off<K extends keyof EventTypes>(key: K, callback: (arg: AchexEventTypes[K]) => void): void;
    emit<K extends keyof EventTypes>(key: K, arg: AchexEventTypes[K]): void;
}

export class Achex {
    constructor(instance: string, options?: AchexOptions);
    readonly instance: string;
    readonly options: AchexOptions;
    readonly startTime: number;
    readonly ping: number;
    readonly events: EventEmitter<AchexEventTypes>;
    readonly session: AchexSession | undefined;
    _send(object: string | number | boolean | object): void;
    _request(object: string | number | boolean | object, timeout?: number): Promise<object>;
    auth(name: string): Promise<AchexSession>;
    close(): void;
}

export interface AchexOptions {
    autoRelaunch?: boolean;
}

export class AchexSession {
    private constructor();
    readonly achex: Achex;
    readonly id: number;
    readonly name: string;
    readonly channel: AchexChannel | undefined;
    join(channelName: string): Promise<AchexChannel>;
    leave(): Promise<void>;
    send(sessionName: string, data: string | number | boolean | object): void;
    send(sessionId: number, data: string | number | boolean | object): void;
}

export class AchexChannel {
    private constructor();
    readonly achex: Achex;
    readonly name: string;
    send(data: string | number | boolean | object): Promise<void>;
}

export interface AchexEventTypes {
    open: AchexOpenEvent;
    close: AchexCloseEvent;
    error: AchexErrorEvent;
    data: AchexDataEvent;
    sessionJoinChannel: AchexSessionJoinChannelEvent;
    sessionLeaveChannel: AchexSessionLeaveChannelEvent;
}

export class AchexOpenEvent {
    private constructor();
}

export class AchexCloseEvent {
    private constructor();
}

export class AchexErrorEvent {
    private constructor();
}

export class AchexDataEvent {
    private constructor();
    readonly data: object;
    readonly channel?: AchexChannel;
    readonly session?: AchexSession;
}

export class AchexSessionJoinChannelEvent {
    private constructor();
    readonly channel: AchexChannel;
    readonly sessionId: string;
    readonly sessionName: string;
}

export class AchexSessionLeaveChannelEvent {
    private constructor();
    readonly channel: AchexChannel;
    readonly sessionId: string;
    readonly sessionName: string;
}