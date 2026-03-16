import { ipcMain } from "electron";
import { ShellService } from "../services/shell-service";
import type { ShellExportExcelRequest, ShellImportExcelRequestColumn } from "../types";

type ShellMethod = "openExternal" | "download" | "exportExcel" | "importExcel";

function createShellHandler(shellService: ShellService) {
  return (method: ShellMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "openExternal":
        return shellService.openExternal(String(args[0] ?? ""));
      case "download":
        return shellService.download(String(args[0] ?? ""), typeof args[1] === "string" ? args[1] : undefined);
      case "exportExcel":
        return shellService.exportExcel(JSON.parse(String(args[0] ?? "{}")) as ShellExportExcelRequest);
      case "importExcel":
        return shellService.importExcel(JSON.parse(String(args[0] ?? "[]")) as ShellImportExcelRequestColumn[]);
      default:
        console.warn("shell handle event not found:", method, args);
        return null;
    }
  };
}

export function registerShellHandler(shellService: ShellService): void {
  const handler = createShellHandler(shellService);
  ipcMain.removeHandler("shell");
  ipcMain.handle("shell", (_event, method: string, ...args: unknown[]) => handler(method, ...args));
}
