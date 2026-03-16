# Architecture

## Current strategy

这个仓库目前没有原始的 Electron/Vue 源码，只有编译产物，所以架构治理采用的是“外层接管，逐步替换”的路线，而不是一次性重写。

## Layers

### 1. Legacy bundle layer

- `dist-electron/main.js`
- `dist-electron/preload.js`
- `dist/assets/*.js`

这部分仍然承担现有业务能力，但不再作为后续演进的主要编辑面。

### 2. Maintainable TypeScript runtime layer

- `src/main/bootstrap.ts`
- `src/main/register-runtime-overrides.ts`
- `src/main/runtime/*.ts`
- `src/main/ipc/*.ts`
- `src/main/services/*.ts`
- `src/main/lifecycle/*.ts`
- `src/main/window/*.ts`
- `build/main/**/*.js`

这部分是新的可维护层，职责是：

- 初始化运行时环境
- 接管关键 IPC handler
- 把路径、recipes、session、shell、updater、退出生命周期等逻辑抽成模块
- 提供共享基础设施，例如 HTTP client
- 为下一步迁移留稳定边界

### 3. Tooling layer

- `scripts/prepare-dev-recipes.js`
- `scripts/generate-readable-bundles.js`
- `tsconfig.main.json`

这部分负责让当前逆向仓库可启动、可分析、可继续迁移。

## Current migrated modules

- `path` IPC
- `recipes` IPC
- `window` IPC
- `session` IPC
- `shell` IPC
- `updater` IPC and event bridge
- recipe request bridge
- app quit acknowledgement (`app-quit-ok`)
- main window close handshake coordinator
- shared runtime HTTP client
- window / tray registry
- database directory bootstrap
- SOCKS5 bridge for session proxying

这些能力已经从压缩 bundle 中抽离成独立模块，并通过运行时覆盖旧实现。

## Main process structure

- `runtime/`: 路径、数据库目录等运行环境准备
- `services/`: 可复用业务能力，如 recipes、session、shell、HTTP client、updater
- `ipc/`: IPC 协议适配层，只负责参数分发和兼容旧接口
- `lifecycle/`: 应用退出等主进程生命周期控制
- `window/`: 主窗口、托盘、徽标等桌面行为控制
- `bootstrap.ts`: 启动入口，先建立新 runtime，再加载 legacy bundle

## Remaining legacy entrypoints

当前主进程仍剩 1 个遗留入口需要继续接管：

1. `screenshot`

其中：

- `screenshot` 依赖缺失的 `capture.html` / overlay 资源，继续迁移前需要先补全资源或重建覆盖层页面。

## Explicit dependencies restored

当前已经把以下此前只存在于 legacy bundle 内部的依赖重新显式化：

- `electron-updater`

这一步的目标不是立刻替换所有 legacy 逻辑，而是把真实运行依赖重新放回 `package.json` 和 `src/main`，恢复可升级、可追踪、可测试的工程状态。

## Principles

- 新逻辑优先放在 `src/main`，不要继续把变更直接写进压缩 bundle。
- 每接管一块能力，就保证 IPC 接口兼容，再移除对旧实现的依赖。
- `readable/` 只用于分析，不作为运行时代码。
- 所有新增主进程代码默认使用 TypeScript，并先过 `npm run typecheck`。
- 如果仓库缺失运行资源或第三方依赖，先显式记录阻塞，再继续迁移其余可稳定接管的边界。
