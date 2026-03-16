import path from "node:path";
import { exec, spawn } from "node:child_process";
import { app, BrowserWindow, session, type App, type Session } from "electron";
import { SocksProxyBridgeService } from "./socks-proxy-bridge-service";
import type {
  PathRuntime,
  SessionCheckProxyRequest,
  SessionLike,
  SessionLoadExtensionRequest,
  SessionModifyRequestHeadersRequest,
  SessionProxyCredentials,
  SessionResult,
  SessionSetCookiesRequest,
  SessionSetProxyRequest,
  SessionSignalStartRequest,
  SessionSignalStopRequest,
  SocksBridgeInstance,
} from "../types";

const CLEAR_STORAGE_OPTIONS = {
  storages: ["filesystem", "shadercache", "websql", "serviceworkers", "cachestorage"],
  quotas: ["temporary", "syncable"],
} as const;

export class SessionService {
  private readonly proxyCredentials = new WeakMap<Session, SessionProxyCredentials>();
  private readonly socksBridges = new Map<string, SocksBridgeInstance>();
  private loginListenerInstalled = false;

  constructor(
    private readonly app: App,
    private readonly paths: PathRuntime,
    private readonly socksProxyBridgeService = new SocksProxyBridgeService()
  ) {}

  installLoginListener(): void {
    if (this.loginListenerInstalled) {
      return;
    }

    this.app.removeAllListeners("login");
    this.app.on("login", (event, webContents, _authenticationResponseDetails, authInfo, callback) => {
      const currentSession = webContents?.session;
      const credentials = currentSession ? this.proxyCredentials.get(currentSession) : undefined;
      if (authInfo.isProxy && credentials) {
        event.preventDefault();
        callback(credentials.username ?? "", credentials.password ?? "");
      }
    });
    this.loginListenerInstalled = true;
  }

  async loadExtension({ partitionName, extPath }: SessionLoadExtensionRequest): Promise<SessionResult> {
    try {
      const currentSession = session.fromPartition(partitionName);
      const extensionPath = path.join(this.paths.getRootDir(), extPath);
      await currentSession.loadExtension(extensionPath, { allowFileAccess: true });
      return { success: true, msg: `loadExtensionForPartition success ${partitionName}` };
    } catch (error) {
      return { success: false, msg: `loadExtensionForPartition ${error}` };
    }
  }

  startSignal(request: SessionSignalStartRequest): SessionResult {
    if (process.platform !== "win32") {
      return { success: false, msg: "仅支持Windows系统启动 Signal！" };
    }

    const executablePath = path.join(this.paths.getRootDir(), "extensions", "signal", "Signal.exe");
    const args = [
      `--signalClientId=${request.id}`,
      `--signalName=${request.name}`,
      `--clientToken=${request.token}`,
    ];

    try {
      const child = spawn(executablePath, args, { stdio: "inherit" });
      return { success: true, data: child.pid, msg: "Signal 启动成功" };
    } catch {
      return { success: false, msg: "Signal 启动失败" };
    }
  }

  stopSignal({ pid }: SessionSignalStopRequest): void {
    exec(`taskkill /PID ${pid} /T /F`, () => {
      console.log("closed PID:", pid);
    });
  }

  async setCookies({ partitionName, options }: SessionSetCookiesRequest): Promise<SessionResult> {
    try {
      await session.fromPartition(partitionName).cookies.set(options);
      return { success: true, msg: `setCookiesForPartition success ${partitionName}` };
    } catch (error) {
      return { success: false, msg: `setCookiesForPartition ${error}` };
    }
  }

  async setProxy({ partitionName, options }: SessionSetProxyRequest): Promise<SessionResult> {
    const currentSession = session.fromPartition(partitionName);
    const proxyType = options.proxyType.toLowerCase();

    await this.resetProxyState(partitionName, currentSession);

    if (!options.enableProxy) {
      await currentSession.setProxy({ mode: "system" });
      this.proxyCredentials.delete(currentSession);
      return { success: true, msg: "成功清除网页代理！" };
    }

    if (proxyType === "socks5") {
      const bridge = await this.socksProxyBridgeService.create({
        socksHost: options.host,
        socksPort: Number(options.port),
        username: options.username,
        password: options.password,
      });
      this.socksBridges.set(partitionName, bridge);
      await currentSession.setProxy({
        proxyRules: `http=127.0.0.1:${bridge.localPort};https=127.0.0.1:${bridge.localPort}`,
        proxyBypassRules: "<-loopback>",
      });
    } else {
      await currentSession.setProxy({
        proxyRules: `${proxyType}://${options.host}:${options.port}`,
        proxyBypassRules: "<-loopback>",
      });
      this.proxyCredentials.set(currentSession, {
        username: options.username,
        password: options.password,
      });
    }

    return { success: true, msg: "成功设置网页代理！" };
  }

  async checkProxy(request: SessionCheckProxyRequest): Promise<Record<string, unknown>> {
    const currentSession = session.fromPartition(request.partitionName);
    if (request.partitionName.startsWith("temp:")) {
      await this.setProxy(request);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const probeWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        session: currentSession,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    try {
      await probeWindow.loadURL("about:blank");
      return await probeWindow.webContents.executeJavaScript(`
        fetch("https://ipinfo.io/json")
          .then((response) => response.json())
          .then((data) => ({ success: true, ...data, msg: "" }))
          .catch((error) => ({ success: false, msg: error.message === "Failed to fetch" ? "Fail" : error.message }));
      `);
    } catch (error) {
      return { success: false, msg: `连接失败${(error as Error).message}` };
    } finally {
      probeWindow.destroy();
    }
  }

  async modifyRequestHeaders({ partitionName, options }: SessionModifyRequestHeadersRequest): Promise<void> {
    const currentSession = session.fromPartition(partitionName);
    for (const option of options) {
      currentSession.webRequest.onBeforeSendHeaders(option.requestFilters, (details, callback) => {
        for (const [header, value] of Object.entries(option.headers)) {
          details.requestHeaders[header] = value;
        }
        callback({ requestHeaders: details.requestHeaders });
      });
    }
  }

  closeAllConnections(partitionName: string): void {
    session.fromPartition(partitionName).closeAllConnections();
  }

  async clearCache(partitionName: string): Promise<void> {
    const currentSession = session.fromPartition(partitionName) as SessionLike;
    await currentSession.clearCache();
    await currentSession.clearStorageData(CLEAR_STORAGE_OPTIONS as unknown as Record<string, unknown>);
  }

  private async resetProxyState(partitionName: string, currentSession: Session): Promise<void> {
    await currentSession.clearCache();
    currentSession.closeAllConnections();

    const bridge = this.socksBridges.get(partitionName);
    if (bridge) {
      await bridge.close();
      this.socksBridges.delete(partitionName);
    }
  }
}
