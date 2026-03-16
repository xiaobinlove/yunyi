const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_LIMIT = 2;
const RETRYABLE_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"]);

export interface HttpClientRequestOptions {
  method?: string;
  url: string;
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retryLimit?: number;
}

function normalizeMethod(method?: string): string {
  return (method ?? "POST").toUpperCase();
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const code = Reflect.get(error, "code");
    if (typeof code === "string") {
      return code;
    }

    const cause = Reflect.get(error, "cause");
    if (cause && typeof cause === "object") {
      const causeCode = Reflect.get(cause, "code");
      if (typeof causeCode === "string") {
        return causeCode;
      }
    }

    const name = Reflect.get(error, "name");
    if (name === "AbortError") {
      return "ETIMEDOUT";
    }
  }

  return "";
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return {
      code: response.ok ? 200 : response.status,
      msg: rawText,
    };
  }
}

export class HttpClient {
  async requestJson(options: HttpClientRequestOptions): Promise<unknown> {
    return this.requestJsonWithRetry(options, 0);
  }

  async get(url: string, options: Omit<HttpClientRequestOptions, "url" | "method"> = {}): Promise<unknown> {
    return this.requestJson({ ...options, url, method: "GET" });
  }

  async post(url: string, options: Omit<HttpClientRequestOptions, "url" | "method"> = {}): Promise<unknown> {
    return this.requestJson({ ...options, url, method: "POST" });
  }

  async put(url: string, options: Omit<HttpClientRequestOptions, "url" | "method"> = {}): Promise<unknown> {
    return this.requestJson({ ...options, url, method: "PUT" });
  }

  async delete(url: string, options: Omit<HttpClientRequestOptions, "url" | "method"> = {}): Promise<unknown> {
    return this.requestJson({ ...options, url, method: "DELETE" });
  }

  private async requestJsonWithRetry(options: HttpClientRequestOptions, attempt: number): Promise<unknown> {
    const method = normalizeMethod(options.method);
    const retryLimit = options.retryLimit ?? DEFAULT_RETRY_LIMIT;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(options.url, {
        method,
        headers: {
          Authorization: options.token ? `Bearer ${options.token}` : "",
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
        body: method === "GET" || options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      return await parseJsonResponse(response);
    } catch (error) {
      const code = getErrorCode(error);
      if (attempt < retryLimit && RETRYABLE_ERROR_CODES.has(code)) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return this.requestJsonWithRetry(options, attempt + 1);
      }

      return {
        code: 500,
        msg: code || (error instanceof Error && error.message ? error.message : "网络连接失败"),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
