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
- legacy renderer migration map
- host shadow runtime composition
- host hookup spec
- guest effect adapter skeleton
- shadow hookup pilot spec

## Not in scope yet

- 不替换当前 `dist/assets/index-CQ23iY6_.js` 里的执行逻辑
- 不直接改现有 `initialize-recipe` 行为
- 不接管现有页面状态管理

## Planned migration order

1. 把现有 webview 生命周期和 guest bridge 事件接到 controller
2. 把 `ready -> initialize-recipe -> dom-ready fallback` 时序迁到 orchestrator
3. 把 recipe 初始化状态迁到 session store
4. 再把原本散落在 bundle 里的 UI 逻辑迁出来
5. 最后才删除旧 bundle 侧并行逻辑

## Legacy bundle mapping

- 当前旧逻辑来源： [readable/dist/assets/index-CQ23iY6_.js](/Users/bin/Documents/souce-code/云译翻译/readable/dist/assets/index-CQ23iY6_.js)
- 迁移映射清单： [legacy-renderer-migration-map.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/legacy-renderer-migration-map.ts)

## Host hookup shape

- 组合入口： [create-recipe-renderer-shadow-runtime.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/create-recipe-renderer-shadow-runtime.ts)
- 当前用途：先给现有组件提供影子接线入口，不替换现有 handler
- host 接线规范： [legacy-renderer-host-hookup-spec.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/legacy-renderer-host-hookup-spec.ts)

## Guest effect split

- adapter 入口： [create-recipe-guest-effect-adapter.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/create-recipe-guest-effect-adapter.ts)
- 旧 `ge()` 副作用映射： [legacy-renderer-guest-effect-map.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/legacy-renderer-guest-effect-map.ts)

## Shadow Hookup Pilot

- pilot spec： [recipe-shadow-hookup-pilot-spec.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/recipe-shadow-hookup-pilot-spec.ts)
- pilot checklist： [recipe-shadow-hookup-pilot-checklist.ts](/Users/bin/Documents/souce-code/云译翻译/src/renderer/recipes/core/recipe-shadow-hookup-pilot-checklist.ts)
