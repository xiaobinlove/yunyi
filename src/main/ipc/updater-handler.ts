import { ipcMain } from "electron";
import { UpdaterService } from "../services/updater-service";

type UpdaterMethod = "check" | "download";

function createUpdaterHandler(updaterService: UpdaterService) {
  return (method: UpdaterMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "check":
        return updaterService.check();
      case "download":
        return updaterService.download();
      default:
        console.warn("updater handle event not found:", method, args);
        return null;
    }
  };
}

export function registerUpdaterHandler(updaterService: UpdaterService): void {
  const handler = createUpdaterHandler(updaterService);
  ipcMain.removeHandler("updater");
  ipcMain.handle("updater", (_event, method: string, ...args: unknown[]) => handler(method, ...args));
}
