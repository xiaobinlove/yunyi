# yunyi-fangyi

这是一个以 Electron 编译产物为主的项目仓库。当前的改造策略不是直接重写整个应用，而是先建立一层可维护的 TypeScript 主进程 runtime，把关键能力从压缩 bundle 中逐步接管出来。

## Directory overview

- `dist-electron/`: Electron 主进程与 preload 编译产物
- `dist/`: 渲染进程编译产物和内置 recipes
- `src/main/`: 新的可维护 TypeScript 主进程层
- `src/main/database/`: SQLite 抽象、实体和仓储层
- `build/main/`: `src/main` 的编译输出
- `recipes/archives/`: 开发态运行时需要的 recipe 归档目录
- `scripts/`: 维护脚本
- `readable/`: bundle 可读副本，不参与运行
- `capture/`: 截图覆盖层页面资源

## Common commands

```bash
npm run prepare:recipes
npm run readable
npm run typecheck
npm run build:main
npm start
```

## Current maintainable runtime coverage

当前已经由 `src/main` 接管的能力：

- `path` IPC
- `recipes` IPC
- `window` IPC
- `session` IPC
- `shell` IPC
- `screenshot` IPC and overlay service (P0, translation removed)
- window / tray registry
- database directory bootstrap
- primary database schema migration bootstrap
- local app.db translation table bootstrap
- renderer SQLite sync bridge
- main database repositories (`client` / `contact` / `contact_setting` / `quick_reply`)
- task repositories (`mass_send_task` / `mass_group_task`)
- renderer bridge hot paths for `client`, `contact`, `contact_setting`, `quick_reply`, and task-table create/delete/status flows

应用启动链路现在是：

1. `src/main/bootstrap.ts` 初始化运行环境
2. 编译到 `build/main/bootstrap.js`
3. Electron 从 `build/main/bootstrap.js` 启动
4. 新 runtime 加载 legacy `dist-electron/main.js`
5. 在运行时重新注册可维护模块，覆盖遗留 IPC

## Current optimization work

### 1. Prepare development recipes automatically

项目未打包运行时，主进程会从 `recipes/archives` 读取 `apps.json` 和 `*.tar.gz`。
仓库原本只有 `dist/recipes`，所以增加了：

- `scripts/prepare-dev-recipes.js`
- `npm run prepare:recipes`

### 2. Generate readable bundle copies

当前仓库没有原始 Vue/Electron 源码，调试时直接看压缩文件成本很高，所以增加了：

- `scripts/generate-readable-bundles.js`
- `npm run readable`

### 3. Introduce a maintainable TypeScript main-process layer

新的 `src/main` 已经把高耦合逻辑拆成 `database`、`runtime`、`services`、`ipc`、`window` 五层，后续迁移应继续沿这套结构推进，而不是回到直接修改 bundle。

## Maintenance guidance

- 优先修改 `src/main` 和 `scripts`，不要直接手改大段压缩 bundle。
- 涉及主库读写时，优先复用 `src/main/database` 里的 SQLite 抽象和仓储，而不是在新代码里继续散写 SQL。
- 改主进程逻辑前先跑 `npm run readable` 定位遗留实现，再在 `src/main` 做兼容接管。
- 每次迁移新模块后，至少执行 `npm run typecheck` 和 `npm start` 做回归。
