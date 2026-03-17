export type MessageDirection = "incoming" | "outgoing" | "system";

export type MessagePartKind = "body" | "quote" | "meta";

export interface MessagePart {
  kind: MessagePartKind;
  text: string;
  translate: boolean;
}

export interface MessageEnvelope {
  id: string;
  chatId: string;
  direction: MessageDirection;
  timestamp?: number;
  isHistory: boolean;
  parts: MessagePart[];
  rawMeta?: Record<string, unknown>;
}
