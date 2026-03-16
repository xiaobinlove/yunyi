import { ipcMain } from "electron";
import { SessionService } from "../services/session-service";
import type {
  SessionCheckProxyRequest,
  SessionLoadExtensionRequest,
  SessionModifyRequestHeadersRequest,
  SessionSetCookiesRequest,
  SessionSetProxyRequest,
  SessionSignalStartRequest,
  SessionSignalStopRequest,
} from "../types";

type SessionMethod =
  | "loadExtension"
  | "startSignal"
  | "stopSignal"
  | "setCookies"
  | "setProxy"
  | "checkProxy"
  | "modifyRequestHeaders"
  | "closeAllConnections"
  | "clearCache";

function createSessionHandleHandler(sessionService: SessionService) {
  return (method: SessionMethod | string, ...args: unknown[]) => {
    switch (method) {
      case "loadExtension":
        return sessionService.loadExtension(args[0] as SessionLoadExtensionRequest);
      case "startSignal":
        return sessionService.startSignal(args[0] as SessionSignalStartRequest);
      case "stopSignal":
        return sessionService.stopSignal(args[0] as SessionSignalStopRequest);
      case "setCookies":
        return sessionService.setCookies(args[0] as SessionSetCookiesRequest);
      case "setProxy":
        return sessionService.setProxy(args[0] as SessionSetProxyRequest);
      case "checkProxy":
        return sessionService.checkProxy(args[0] as SessionCheckProxyRequest);
      case "modifyRequestHeaders":
        return sessionService.modifyRequestHeaders(args[0] as SessionModifyRequestHeadersRequest);
      default:
        console.warn("session handle event not found:", method, args);
        return null;
    }
  };
}

function createSessionEventHandler(sessionService: SessionService) {
  return (method: SessionMethod | string, partitionName: string) => {
    switch (method) {
      case "closeAllConnections":
        sessionService.closeAllConnections(partitionName);
        break;
      case "clearCache":
        void sessionService.clearCache(partitionName);
        break;
      default:
        console.warn("session on event not found:", method, partitionName);
        break;
    }
  };
}

export function registerSessionHandler(sessionService: SessionService): void {
  const handleHandler = createSessionHandleHandler(sessionService);
  const eventHandler = createSessionEventHandler(sessionService);

  ipcMain.removeHandler("session");
  ipcMain.handle("session", (_event, method: string, ...args: unknown[]) => handleHandler(method, ...args));
  ipcMain.removeAllListeners("session");
  ipcMain.on("session", (_event, method: string, partitionName: string) => eventHandler(method, partitionName));

  sessionService.installLoginListener();
}
