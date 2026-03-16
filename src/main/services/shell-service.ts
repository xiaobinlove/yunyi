import path from "node:path";
import fs from "fs-extra";
import * as XLSX from "xlsx";
import { dialog, shell } from "electron";
import type {
  ShellExportExcelRequest,
  ShellImportExcelRequestColumn,
  WindowRegistryLike,
} from "../types";

function getPublicAssetRoot(): string {
  return process.env.VITE_PUBLIC ?? "";
}

export class ShellService {
  constructor(private readonly windowRegistry: WindowRegistryLike) {}

  openExternal(url: string): Promise<void> {
    return shell.openExternal(url);
  }

  async download(target: string, defaultPath?: string): Promise<void> {
    const mainWindow = this.windowRegistry.getMainWindow();
    if (!mainWindow) {
      throw new Error("Main window is not available for download");
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "保存文件",
      defaultPath,
    });

    if (canceled || !filePath) {
      return;
    }

    if (target.startsWith("http")) {
      mainWindow.webContents.downloadURL(target);
      mainWindow.webContents.session.once("will-download", (_event, item) => {
        item.setSavePath(filePath);
        item.once("done", (_doneEvent, state) => {
          if (state === "completed") {
            shell.showItemInFolder(filePath);
            shell.beep();
          }
        });
      });
      return;
    }

    fs.copySync(path.join(getPublicAssetRoot(), target), filePath);
    shell.showItemInFolder(filePath);
    shell.beep();
  }

  async exportExcel(request: ShellExportExcelRequest): Promise<void> {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "保存文件",
      defaultPath: request.filename,
      filters: [{ name: "Excel 文件", extensions: ["xlsx"] }],
    });

    if (canceled || !filePath) {
      return;
    }

    const rows = request.data.map((row) => {
      const normalizedRow: Record<string, unknown> = {};
      for (const column of request.columns) {
        normalizedRow[column.header] = row[column.key];
      }
      return normalizedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: request.columns.map((column) => column.header),
    });
    (worksheet as XLSX.WorkSheet & { "!cols"?: Array<{ wch?: number }> })["!cols"] = request.columns.map((column) => ({
      wch: column.width,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    fs.writeFileSync(filePath, buffer);
    shell.showItemInFolder(filePath);
    shell.beep();
  }

  async importExcel(columns: ShellImportExcelRequestColumn[]): Promise<Record<string, string>[]> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "选择文件",
      filters: [{ name: "Excel 文件", extensions: ["xlsx"] }],
    });

    if (canceled || filePaths.length === 0) {
      return [];
    }

    const sourcePath = filePaths[0];
    if (!sourcePath) {
      return [];
    }

    const workbook = XLSX.read(fs.readFileSync(sourcePath), { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return [];
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return [];
    }

    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1 });
    const headers = rows[0] ?? [];

    return rows.slice(1).map((row) => {
      const normalizedRow: Record<string, string> = {};
      headers.forEach((header, index) => {
        const match = columns.find((column) => column.header === String(header));
        if (match) {
          normalizedRow[match.key] = String(row[index] ?? "");
        }
      });
      return normalizedRow;
    });
  }
}
