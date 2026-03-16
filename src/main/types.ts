import type {
  App,
  BrowserWindow,
  CookiesSetDetails,
  NativeImage,
  WebRequestFilter,
  Session,
  Tray,
} from "electron";

export interface UserDataDirChoiceResult {
  canceled: boolean;
  path?: string;
}

export interface PathRuntime {
  chooseUserDataDir(): Promise<UserDataDirChoiceResult>;
  cleanPartitionsFolders(clientIds?: string[]): boolean;
  getDistDir(): string;
  getDistElectronDir(): string;
  getRecipesArchivesDir(): string;
  getRootDir(): string;
  getUserDataDir(...segments: string[]): string;
  initializeUserDataPath(): void;
  resetUserDataDirPreference(): boolean;
}

export interface InstalledRecipe {
  id: string;
  name?: string;
  version?: string;
  path?: string;
  [key: string]: unknown;
}

export interface RecipeInstallRequest {
  recipeId: string;
  internalVersion?: string;
}

export interface RecipeRequest {
  method?: string;
  url: string;
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface RuntimeOverridesContext {
  app: App;
  paths: PathRuntime;
  windowRegistry: WindowRegistryLike;
}

export interface WindowRegistryLike {
  trackWindow(window: BrowserWindow): void;
  trackTray(tray: Tray): void;
  installWindowTracking(app: App): void;
  installTrayTracking(electronModule: typeof import("electron")): void;
  getMainWindow(): BrowserWindow | null;
  getPrimaryTray(): Tray | null;
  setBadgeCount(count: number): void;
  getBadgeCount(): number;
  getTaskbarIconPath(name: string): string;
  getTrayIconPath(name: string): string;
  createTaskbarIcon(name: string): NativeImage;
  createTrayIcon(name: string): NativeImage;
}

export interface ShellExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ShellExportExcelRequest {
  columns: ShellExcelColumn[];
  data: Record<string, unknown>[];
  filename: string;
}

export interface ShellImportExcelRequestColumn {
  header: string;
  key: string;
}

export interface SessionLoadExtensionRequest {
  partitionName: string;
  extPath: string;
}

export interface SessionSignalStartRequest {
  id: string;
  name: string;
  token: string;
}

export interface SessionSignalStopRequest {
  pid: number;
}

export interface SessionSetCookiesRequest {
  partitionName: string;
  options: CookiesSetDetails;
}

export interface SessionProxyOptions {
  enableProxy: boolean;
  proxyType: string;
  host: string;
  port: number | string;
  username?: string;
  password?: string;
}

export interface SessionSetProxyRequest {
  partitionName: string;
  options: SessionProxyOptions;
}

export interface SessionCheckProxyRequest {
  partitionName: string;
  options: SessionProxyOptions;
}

export interface SessionModifyRequestHeadersRule {
  headers: Record<string, string>;
  requestFilters: WebRequestFilter;
}

export interface SessionModifyRequestHeadersRequest {
  partitionName: string;
  options: SessionModifyRequestHeadersRule[];
}

export interface SessionProxyCredentials {
  username?: string;
  password?: string;
}

export interface SessionResult {
  success: boolean;
  msg: string;
  data?: unknown;
}

export interface SocksBridgeConfig {
  socksHost: string;
  socksPort: number;
  username?: string;
  password?: string;
}

export interface SocksBridgeInstance {
  localPort: number;
  close(): Promise<void>;
}

export interface SessionLike {
  closeAllConnections(): void;
  clearCache(): Promise<void>;
  clearStorageData(options?: Record<string, unknown>): Promise<void>;
  setProxy(config: Record<string, unknown>): Promise<void>;
  loadExtension(path: string, options?: Record<string, unknown>): Promise<unknown>;
  cookies: {
    set(details: CookiesSetDetails): Promise<void>;
  };
  webRequest: Session["webRequest"];
}
