import type { MessageEnvelope } from "./message-envelope";
import type { TranslationResult } from "./translation-result";

export interface RuntimeCtx {
  appId?: string;
  clientId?: string;
  raw?: Record<string, unknown>;
}

export interface ChatInfo {
  id: string;
  name: string;
  group: boolean;
  rawMeta?: Record<string, unknown>;
}

export interface SendTextInput {
  chatId: string;
  text: string;
  rawTarget?: unknown;
}

export interface SendTextResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface RecipeRuntimeMethods {
  getActiveChatId?(ctx: RuntimeCtx): string | null;
  getChatInfo?(ctx: RuntimeCtx, node?: unknown): ChatInfo | null;
  extractMessage?(ctx: RuntimeCtx, node: unknown): MessageEnvelope | null;
  isHistoryMessage?(ctx: RuntimeCtx, node: unknown): boolean;
  isOwnMessage?(ctx: RuntimeCtx, node: unknown): boolean;
  needsTranslate?(ctx: RuntimeCtx, message: MessageEnvelope): boolean;
  renderTranslation?(ctx: RuntimeCtx, message: MessageEnvelope, result: TranslationResult): void;
  renderOriginalEcho?(ctx: RuntimeCtx, message: MessageEnvelope, result: TranslationResult): void;
  sendText?(ctx: RuntimeCtx, input: SendTextInput): Promise<SendTextResult>;
}
