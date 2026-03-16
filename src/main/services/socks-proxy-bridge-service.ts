import http from "node:http";
import net from "node:net";
import type { AddressInfo } from "node:net";
import type { SocksBridgeConfig, SocksBridgeInstance } from "../types";

const SOCKS_VERSION = 0x05;
const SOCKS_AUTH_NONE = 0x00;
const SOCKS_AUTH_USERPASS = 0x02;
const SOCKS_AUTH_NO_ACCEPTABLE = 0xff;
const SOCKS_COMMAND_CONNECT = 0x01;
const SOCKS_ADDRESS_IPV4 = 0x01;
const SOCKS_ADDRESS_DOMAIN = 0x03;
const SOCKS_ADDRESS_IPV6 = 0x04;

class BufferedSocketReader {
  private buffer = Buffer.alloc(0);

  constructor(private readonly socket: net.Socket) {}

  async readExact(length: number): Promise<Buffer> {
    if (this.buffer.length >= length) {
      const chunk = this.buffer.subarray(0, length);
      this.buffer = this.buffer.subarray(length);
      return chunk;
    }

    return new Promise<Buffer>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        if (this.buffer.length >= length) {
          cleanup();
          const result = this.buffer.subarray(0, length);
          this.buffer = this.buffer.subarray(length);
          resolve(result);
        }
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error("Socket closed before handshake completed"));
      };
      const cleanup = () => {
        this.socket.off("data", onData);
        this.socket.off("error", onError);
        this.socket.off("close", onClose);
        this.socket.off("end", onClose);
      };

      this.socket.on("data", onData);
      this.socket.once("error", onError);
      this.socket.once("close", onClose);
      this.socket.once("end", onClose);
    });
  }

  release(): void {
    if (this.buffer.length > 0) {
      this.socket.unshift(this.buffer);
      this.buffer = Buffer.alloc(0);
    }
  }
}

function encodeDestinationHost(host: string): Buffer {
  const ipVersion = net.isIP(host);
  if (ipVersion === 4) {
    return Buffer.concat([Buffer.from([SOCKS_ADDRESS_IPV4]), Buffer.from(host.split(".").map((segment) => Number(segment))) ]);
  }

  if (ipVersion === 6) {
    const normalized = host.replace(/^\[/, "").replace(/\]$/, "");
    const groups = normalized.split(":");
    const expanded: string[] = [];
    const emptyIndex = groups.indexOf("");

    if (emptyIndex >= 0) {
      const head = groups.slice(0, emptyIndex);
      const tail = groups.slice(emptyIndex + 1);
      const missing = 8 - (head.filter(Boolean).length + tail.filter(Boolean).length);
      expanded.push(...head.filter(Boolean), ...Array.from({ length: missing }, () => "0"), ...tail.filter(Boolean));
    } else {
      expanded.push(...groups);
    }

    const bytes = Buffer.alloc(16);
    expanded.slice(0, 8).forEach((group, index) => {
      bytes.writeUInt16BE(parseInt(group || "0", 16), index * 2);
    });
    return Buffer.concat([Buffer.from([SOCKS_ADDRESS_IPV6]), bytes]);
  }

  const domain = Buffer.from(host);
  return Buffer.concat([Buffer.from([SOCKS_ADDRESS_DOMAIN, domain.length]), domain]);
}

function parseConnectTarget(rawUrl: string): { host: string; port: number } | null {
  if (!rawUrl) {
    return null;
  }

  if (rawUrl.startsWith("[")) {
    const bracketIndex = rawUrl.indexOf("]");
    if (bracketIndex === -1) {
      return null;
    }
    const host = rawUrl.slice(1, bracketIndex);
    const portText = rawUrl.slice(bracketIndex + 2);
    const port = Number(portText);
    if (!host || Number.isNaN(port)) {
      return null;
    }
    return { host, port };
  }

  const separatorIndex = rawUrl.lastIndexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  const host = rawUrl.slice(0, separatorIndex);
  const port = Number(rawUrl.slice(separatorIndex + 1));
  if (!host || Number.isNaN(port)) {
    return null;
  }

  return { host, port };
}

async function connectSocket(config: SocksBridgeConfig, destination: { host: string; port: number }): Promise<net.Socket> {
  const socket = net.createConnection({ host: config.socksHost, port: config.socksPort });
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  const reader = new BufferedSocketReader(socket);
  const hasAuth = Boolean(config.username || config.password);
  socket.write(
    hasAuth
      ? Buffer.from([SOCKS_VERSION, 0x02, SOCKS_AUTH_NONE, SOCKS_AUTH_USERPASS])
      : Buffer.from([SOCKS_VERSION, 0x01, SOCKS_AUTH_NONE])
  );

  const authResponse = await reader.readExact(2);
  if (authResponse[0] !== SOCKS_VERSION || authResponse[1] === SOCKS_AUTH_NO_ACCEPTABLE) {
    socket.destroy();
    throw new Error("SOCKS proxy rejected all authentication methods");
  }

  if (authResponse[1] === SOCKS_AUTH_USERPASS) {
    const username = Buffer.from(config.username ?? "");
    const password = Buffer.from(config.password ?? "");
    if (username.length > 255 || password.length > 255) {
      socket.destroy();
      throw new Error("SOCKS credentials are too long");
    }

    socket.write(Buffer.concat([Buffer.from([0x01, username.length]), username, Buffer.from([password.length]), password]));
    const userPassResponse = await reader.readExact(2);
    if (userPassResponse[1] !== 0x00) {
      socket.destroy();
      throw new Error("SOCKS proxy authentication failed");
    }
  }

  const destinationHost = encodeDestinationHost(destination.host);
  const destinationPort = Buffer.alloc(2);
  destinationPort.writeUInt16BE(destination.port, 0);
  socket.write(Buffer.concat([Buffer.from([SOCKS_VERSION, SOCKS_COMMAND_CONNECT, 0x00]), destinationHost, destinationPort]));

  const connectResponse = await reader.readExact(4);
  if (connectResponse[1] !== 0x00) {
    socket.destroy();
    throw new Error(`SOCKS proxy connect failed with status ${connectResponse[1]}`);
  }

  switch (connectResponse[3]) {
    case SOCKS_ADDRESS_IPV4:
      await reader.readExact(6);
      break;
    case SOCKS_ADDRESS_DOMAIN: {
      const lengthBuffer = await reader.readExact(1);
      const domainLength = lengthBuffer.at(0) ?? 0;
      await reader.readExact(domainLength + 2);
      break;
    }
    case SOCKS_ADDRESS_IPV6:
      await reader.readExact(18);
      break;
    default:
      socket.destroy();
      throw new Error(`Unsupported SOCKS address type ${connectResponse[3]}`);
  }

  reader.release();
  return socket;
}

export class SocksProxyBridgeService {
  private lastCheckedPort = 12000;

  async create(config: SocksBridgeConfig): Promise<SocksBridgeInstance> {
    const localPort = await this.findAvailablePort();
    const server = http.createServer();

    server.on("connect", async (request, clientSocket, head) => {
      const target = parseConnectTarget(request.url ?? "");
      if (!target) {
        clientSocket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        clientSocket.end();
        return;
      }

      try {
        const upstream = await connectSocket(config, target);
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length > 0) {
          upstream.write(head);
        }
        upstream.on("error", () => clientSocket.destroy());
        clientSocket.on("error", () => upstream.destroy());
        upstream.pipe(clientSocket);
        clientSocket.pipe(upstream);
      } catch (error) {
        console.log("[SOCKS5 Proxy Error]", error);
        clientSocket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        clientSocket.end();
      }
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(localPort, "127.0.0.1", () => resolve());
      server.once("error", reject);
    });

    const address = server.address() as AddressInfo | null;
    console.log(`[SOCKS5 Proxy Success]: http://127.0.0.1:${address?.port ?? localPort}`);

    return {
      localPort,
      close: async () => {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      },
    };
  }

  private async findAvailablePort(start = 12000, end = 17000): Promise<number> {
    if (this.lastCheckedPort < start || this.lastCheckedPort > end) {
      this.lastCheckedPort = start;
    }

    for (let port = this.lastCheckedPort; port <= end; port += 1) {
      if (await this.checkPortAvailable(port)) {
        this.lastCheckedPort = port + 1;
        return port;
      }
    }

    throw new Error("No available port found for SOCKS bridge");
  }

  private checkPortAvailable(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      const timeout = setTimeout(() => {
        probe.close();
        resolve(false);
      }, 1000);

      probe.once("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });

      probe.once("listening", () => {
        clearTimeout(timeout);
        probe.close(() => resolve(true));
      });

      probe.listen(port, "127.0.0.1");
    });
  }
}
