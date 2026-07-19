# parti-tic-tac-toe

发布到 [Parti](https://github.com/glink25/Parti) 房间市场的经典双人井字棋联机房间。

前两位玩家分别执 X / O，轮流落子，连成一线获胜，支持平局判定与重开。

## 房间包结构

- `parti.room.json` — 房间 manifest
- `index.html` — 房间 UI（沙箱 iframe）
- `room.worker.js` — 房间权威逻辑（房主 Web Worker）

## 发布到房间市场

每次推送到 `main`（或推送 `v*` tag），GitHub Actions 会自动打包 `parti.room.zip`
并发布/更新 latest release（含 `parti.room.zip` 与 `parti.room.json` 两个规范资产）。

登记 issue：`[parti-room] glink25/parti-tic-tac-toe`（见 glink25/Parti issue 区）

发布规范详见 Parti 文档 [room-market.md](https://github.com/glink25/Parti/blob/main/docs/room-market.md)。

自动触发
