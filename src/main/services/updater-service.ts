import type { BrowserWindow } from "electron";
import { autoUpdater, type AppUpdater } from "electron-updater";
import type { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from "electron-updater";
import type { WindowRegistryLike } from "../types";

interface UpdaterPayload {
  version?: string;
  releaseName?: string | null;
  releaseNotes?: string | Array<unknown> | null;
  percent?: number;
  transferred?: number;
  total?: number;
  speed?: number;
  message?: string;
  stack?: string;
}

export class UpdaterService {
  private readonly updater: AppUpdater = autoUpdater;
  private listenersBound = false;

  constructor(private readonly windowRegistry: WindowRegistryLike) {
    this.configure();
    this.bindEvents();
  }

  async check(): Promise<unknown> {
    return this.updater.checkForUpdates();
  }

  async download(): Promise<unknown> {
    return this.updater.downloadUpdate();
  }

  private configure(): void {
    this.updater.autoDownload = false;
    this.updater.autoInstallOnAppQuit = true;
  }

  private bindEvents(): void {
    if (this.listenersBound) {
      return;
    }

    this.updater.on("checking-for-update", () => {
      this.send("updater:checking");
    });

    this.updater.on("update-available", (info: UpdateInfo) => {
      this.send("updater:available", {
        version: info.version,
        releaseName: info.releaseName,
        releaseNotes: info.releaseNotes,
      });
    });

    this.updater.on("update-not-available", () => {
      this.send("updater:not-available");
    });

    this.updater.on("download-progress", (info: ProgressInfo) => {
      this.send("updater:download-progress", {
        percent: info.percent,
        transferred: info.transferred,
        total: info.total,
        speed: info.bytesPerSecond,
      });
    });

    this.updater.on("update-downloaded", (_info: UpdateDownloadedEvent) => {
      this.send("updater:downloaded");
      this.updater.quitAndInstall();
    });

    this.updater.on("error", (error: Error) => {
      this.send("updater:error", {
        message: error.message,
        stack: error.stack,
      });
    });

    this.listenersBound = true;
  }

  private send(channel: string, payload?: UpdaterPayload): void {
    const mainWindow = this.windowRegistry.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    this.sendToWindow(mainWindow, channel, payload);
  }

  private sendToWindow(window: BrowserWindow, channel: string, payload?: UpdaterPayload): void {
    if (window.webContents.isDestroyed()) {
      return;
    }

    window.webContents.send("main-process-message", channel, payload);
  }
}
