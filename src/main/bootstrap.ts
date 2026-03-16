import path from "node:path";
import * as electron from "electron";
import { app } from "electron";
import paths from "./runtime/paths";
import { registerRuntimeOverrides } from "./register-runtime-overrides";
import { DatabaseService } from "./services/database-service";
import { WindowRegistry } from "./window/window-registry";

const windowRegistry = new WindowRegistry();
const databaseService = new DatabaseService(paths);

windowRegistry.installTrayTracking(electron);
windowRegistry.installWindowTracking(app);

process.env.APP_ROOT = paths.getRootDir();
paths.initializeUserDataPath();
databaseService.ensureAllDatabases();

require(path.join(paths.getDistElectronDir(), "main.js"));

app.whenReady().then(() => {
  registerRuntimeOverrides({ app, paths, windowRegistry });
});
