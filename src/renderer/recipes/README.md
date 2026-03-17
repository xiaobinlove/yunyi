# Renderer Recipe Bridge

`src/renderer/recipes/` 现在是 renderer 侧的旁路骨架层，还没有接管当前线上页面逻辑。

这层的目标只有两个：

- 把 webview recipe bridge 的事件面、session 状态、controller 职责显式化
- 为后续把现有 renderer bundle 逐步迁入源码层提供稳定入口

## Current scope

- typed bridge contract
- session store skeleton
- controller skeleton
- webview mirror binder skeleton
- initialize timing orchestrator skeleton

## Not in scope yet

- 不替换当前 `dist/assets/index-CQ23iY6_.js` 里的执行逻辑
- 不直接改现有 `initialize-recipe` 行为
- 不接管现有页面状态管理

## Planned migration order

1. 把现有 webview 生命周期和 guest bridge 事件接到 controller
2. 把 `ready -> initialize-recipe -> dom-ready fallback` 时序迁到 orchestrator
3. 把 recipe 初始化状态迁到 session store
4. 再把原本散落在 bundle 里的 UI 逻辑迁出来
