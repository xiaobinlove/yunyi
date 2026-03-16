import path from "node:path";
import * as electron from "electron";
import { app } from "electron";
import { ensureLegacyDatabaseDirs } from "./runtime/database";
import paths from "./runtime/paths";
import { registerRuntimeOverrides } from "./register-runtime-overrides";
import { WindowRegistry } from "./window/window-registry";

const windowRegistry = new WindowRegistry();
windowRegistry.installTrayTracking(electron);
windowRegistry.installWindowTracking(app);

process.env.APP_ROOT = paths.getRootDir();
paths.initializeUserDataPath();
ensureLegacyDatabaseDirs(paths);

require(path.join(paths.getDistElectronDir(), "main.js"));

app.whenReady().then(() => {
  registerRuntimeOverrides({ app, paths, windowRegistry });
});
