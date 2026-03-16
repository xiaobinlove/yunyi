import path from "node:path";
import * as electron from "electron";
import { app, session } from "electron";
import { registerDatabaseSyncHandler } from "./ipc/database-sync-handler";
import paths from "./runtime/paths";
import { registerRuntimeOverrides } from "./register-runtime-overrides";
import { DatabaseService } from "./services/database-service";
import { RendererDatabaseBridgeService } from "./services/renderer-database-bridge-service";
import { WindowRegistry } from "./window/window-registry";

const windowRegistry = new WindowRegistry();
const databaseService = new DatabaseService(paths);
const rendererDatabaseBridgeService = new RendererDatabaseBridgeService();
const rendererDatabaseBridgePreload = path.join(paths.getRootDir(), "build", "main", "preload.js");

windowRegistry.installTrayTracking(electron);
windowRegistry.installWindowTracking(app);
registerDatabaseSyncHandler(rendererDatabaseBridgeService);

app.on("ready", () => {
  const currentPreloads = session.defaultSession.getPreloads();
  if (!currentPreloads.includes(rendererDatabaseBridgePreload)) {
    session.defaultSession.setPreloads([...currentPreloads, rendererDatabaseBridgePreload]);
  }
});

process.env.APP_ROOT = paths.getRootDir();
paths.initializeUserDataPath();
databaseService.ensureAllDatabases();

require(path.join(paths.getDistElectronDir(), "main.js"));

app.whenReady().then(() => {
  registerRuntimeOverrides({ app, paths, windowRegistry });
});
