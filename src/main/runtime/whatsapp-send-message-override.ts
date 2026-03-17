import { buildWhatsAppSendMessageOverrideSource } from "./whatsapp-send-message-override-parts";

const WHATSAPP_SEND_MESSAGE_OVERRIDE_SOURCE = buildWhatsAppSendMessageOverrideSource();

export function getWhatsAppSendMessageOverrideSource(): string {
  return WHATSAPP_SEND_MESSAGE_OVERRIDE_SOURCE;
}
