# WebSocketWrapper
WebSocket Wrapper in Achex  
achex: https://achex.ca/

# 特徴 / Feature
従来のAchexがモジュール化されたことにより、Achexの機能が扱いやすくなります。

# 使用例 / Usage

- `test`チャンネルに参加する
```js
const achex = new Achex("<instance>");
const session = await achex.auth("user_name");
await session.join("test");
```

- 現在のチャンネルから退出する
```js
const session = achex.session;
if (session) {
    session.leave();
}
```

- 現在のチャンネルにメッセージを送信する
```js
const channel = achex.channel;
if (channel) {
    channel.send({ "message": "hello!" });
}
```

- 現在のチャンネルに送信されたメッセージをコンソールに出力する
```js
achex.events.on("data", (ev) => {
    const { channel, data } = ev;
    if (!channel) return;
    console.log(data); // { "message": "hello!" };
});
```

- チャンネルに参加したユーザー名をコンソールに出力する
```js
achex.events.on("sessionJoinChannel", (ev) => {
    const { channel, session } = ev;
    console.log(`${session.name} joined ${channel.name} channel.`);
});
```

# ライセンス / License
© 2025 yuki2825624 All Rights Reserved.

> **MIT LICENSE** | <https://mit-license.org/>