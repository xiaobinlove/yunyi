import path from "node:path";
import { nativeImage, type App, type BrowserWindow, type NativeImage, type Tray } from "electron";
import type { WindowRegistryLike } from "../types";

export class WindowRegistry implements WindowRegistryLike {
  private readonly windows = new Set<BrowserWindow>();
  private readonly trays = new Set<Tray>();
  private badgeCount = 0;
  private trackingInstalled = false;

  trackWindow(window: BrowserWindow): void {
    this.windows.add(window);
    window.on("closed", () => {
      this.windows.delete(window);
    });
  }

  trackTray(tray: Tray): void {
    this.trays.add(tray);
    const trayEmitter = tray as NodeJS.EventEmitter;
    trayEmitter.on("destroyed", () => {
      this.trays.delete(tray);
    });
  }

  installWindowTracking(app: App): void {
    if (this.trackingInstalled) {
      return;
    }

    app.on("browser-window-created", (_event, window) => {
      this.trackWindow(window);
    });

    this.trackingInstalled = true;
  }

  installTrayTracking(electronModule: typeof import("electron")): void {
    const descriptor = Object.getOwnPropertyDescriptor(electronModule, "Tray");
    const OriginalTray = electronModule.Tray;

    if (!descriptor || typeof OriginalTray !== "function" || (OriginalTray as { __runtimeTracked?: boolean }).__runtimeTracked) {
      return;
    }

    if (!descriptor.configurable) {
      return;
    }

    const registry = this;
    class TrackingTray extends OriginalTray {
      constructor(...args: ConstructorParameters<typeof OriginalTray>) {
        super(...args);
        registry.trackTray(this);
      }
    }

    Object.defineProperty(TrackingTray, "__runtimeTracked", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(electronModule as object, "Tray", {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() {
        return TrackingTray;
      },
    });
  }

  getMainWindow(): BrowserWindow | null {
    const aliveWindows = [...this.windows].filter((window) => !window.isDestroyed());
    if (aliveWindows.length === 0) {
      return null;
    }

    return aliveWindows.find((window) => window.isFocused()) ?? aliveWindows[0] ?? null;
  }

  getPrimaryTray(): Tray | null {
    const aliveTrays = [...this.trays].filter(
      (tray) => !(typeof (tray as Tray & { isDestroyed?: () => boolean }).isDestroyed === "function" && (tray as Tray & { isDestroyed: () => boolean }).isDestroyed())
    );
    return aliveTrays[0] ?? null;
  }

  setBadgeCount(count: number): void {
    this.badgeCount = count;
  }

  getBadgeCount(): number {
    return this.badgeCount;
  }

  getTaskbarIconPath(name: string): string {
    return path.join(
      process.env.VITE_PUBLIC ?? "",
      "taskbar",
      process.platform,
      `${name}.${process.platform === "win32" ? "ico" : "png"}`
    );
  }

  getTrayIconPath(name: string): string {
    return path.join(process.env.VITE_PUBLIC ?? "", "tray", process.platform, `${name}.png`);
  }

  createTaskbarIcon(name: string): NativeImage {
    return nativeImage.createFromPath(this.getTaskbarIconPath(name));
  }

  createTrayIcon(name: string): NativeImage {
    return nativeImage.createFromPath(this.getTrayIconPath(name));
  }
}
