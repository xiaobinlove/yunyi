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
- `src/main/database/*.ts`
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
- primary database schema migration bootstrap
- local app.db monthly translation table bootstrap
- renderer SQLite sync bridge via preload
- main database repository layer (`client` / `contact` / `contact_setting` / `quick_reply`)
- SOCKS5 bridge for session proxying
- screenshot IPC and overlay service (P0)

这些能力已经从压缩 bundle 中抽离成独立模块，并通过运行时覆盖旧实现。

## Main process structure

- `runtime/`: 路径、数据库目录等运行环境准备
- `database/`: SQLite 抽象、实体定义和主库仓储
- `services/`: 可复用业务能力，如 database、recipes、session、shell、HTTP client、updater
- `ipc/`: IPC 协议适配层，只负责参数分发和兼容旧接口
- `lifecycle/`: 应用退出等主进程生命周期控制
- `window/`: 主窗口、托盘、徽标等桌面行为控制
- `bootstrap.ts`: 启动入口，先建立新 runtime，再加载 legacy bundle

## Remaining legacy entrypoints

当前主进程的外围入口已经基本完成接管，剩余工作主要集中在两个方向：一是继续补齐已迁移模块的能力细节，二是把仍在渲染 bundle 内部的数据库 CRUD 逐步抽离出来。

当前数据库模块的状态：

- `src/main/services/database-service.ts` 已接管主进程数据库启动、schema 升级和 `app.db` 月表引导。
- `bootstrap.ts` 会先初始化数据库，再加载 legacy `dist-electron/main.js`。
- `src/main/database/` 已提供共享 SQLite 抽象，以及 `client`、`contact`、`contact_setting`、`quick_reply` 四组主库仓储。
- 渲染层的 `qt.initialize/select/insert/update` 仍在 `dist/assets` bundle 内，但 `better-sqlite3` 已通过 `src/main/preload.ts` 和 `database-sync` 桥接到主进程；其中 `contact` / `contact_setting` 的关键特殊分支已经改走仓储，其余通用 SQL 可继续按同样方式逐步收口。

当前截图模块的状态：

- `screenshot` 已迁移到 `src/main`，当前仅保留基础截图能力：overlay 窗口、选区保存、Esc 退出和快捷键恢复。
- `capture/capture.html` 与 `capture/capture.js` 是新的截图覆盖层资源。
- 截图翻译相关实现已移除，仅保留兼容 IPC 壳以避免遗留调用报错。

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
