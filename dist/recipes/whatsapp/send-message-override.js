(() => {
  const patchKey = "__yunyiWhatsappSendMessageOverride";
  if (window[patchKey]) {
    return;
  }
  window[patchKey] = true;

  const MIME_EXTENSION_MAP = {
    "audio/ogg": "ogg",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "text/x-vcard": "vcf",
    "text/vcard": "vcf",
  };

  function toChatId(contact) {
    const rawContactId =
      typeof contact === "string" ? contact : contact?.contactId ?? contact?.id ?? "";
    const chatType = typeof contact === "object" ? contact?.type : "chat";
    const contactId = String(rawContactId || "").trim();

    if (!contactId) {
      throw new Error("Missing WhatsApp contactId");
    }

    if (contactId.includes("@")) {
      return contactId;
    }

    if (chatType === "group" || /-\d+$/.test(contactId)) {
      return `${contactId}@g.us`;
    }

    return `${contactId.replace(/^\+/, "")}@c.us`;
  }

  function getMimeType(input, fallbackMimeType) {
    if (typeof input === "string") {
      const dataUrlMatch = input.match(/^data:([^;]+);base64,/i);
      if (dataUrlMatch?.[1]) {
        return dataUrlMatch[1];
      }
    }

    return fallbackMimeType || "application/octet-stream";
  }

  function guessExtension(mimeType) {
    return MIME_EXTENSION_MAP[mimeType] || mimeType.split("/")[1] || "bin";
  }

  function decodeBase64(base64) {
    const normalized = base64.replace(/\s+/g, "");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  async function toFile(value, options = {}) {
    if (value instanceof File) {
      return value;
    }

    if (value instanceof Blob) {
      const mimeType = value.type || options.mimeType || "application/octet-stream";
      const fileName = options.fileName || `upload.${guessExtension(mimeType)}`;
      return new File([value], fileName, { type: mimeType });
    }

    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      const mimeType = options.mimeType || "application/octet-stream";
      const fileName = options.fileName || `upload.${guessExtension(mimeType)}`;
      return new File([bytes], fileName, { type: mimeType });
    }

    if (typeof value !== "string" || !value.trim()) {
      throw new Error("Invalid WhatsApp file payload");
    }

    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) {
      const response = await fetch(trimmed);
      const blob = await response.blob();
      const mimeType = blob.type || options.mimeType || "application/octet-stream";
      const fileName = options.fileName || `upload.${guessExtension(mimeType)}`;
      return new File([blob], fileName, { type: mimeType });
    }

    const mimeType = getMimeType(trimmed, options.mimeType);
    const base64 = trimmed.startsWith("data:") ? trimmed.split(",")[1] || "" : trimmed;
    const fileName = options.fileName || `upload.${guessExtension(mimeType)}`;

    return new File([decodeBase64(base64)], fileName, { type: mimeType });
  }

  function getTextContent(content) {
    if (typeof content === "string") {
      return content;
    }

    return String(content?.text ?? content?.body ?? content?.content ?? "");
  }

  function getFilePayload(content) {
    if (content && typeof content === "object") {
      return {
        value: content.file ?? content.data ?? content.base64 ?? content.url ?? content.content,
        fileName: content.fileName ?? content.name,
        mimeType: content.fileType ?? content.mimeType ?? content.type,
        caption: content.caption ?? content.text ?? content.body ?? "",
      };
    }

    return {
      value: content,
      fileName: undefined,
      mimeType: undefined,
      caption: "",
    };
  }

  async function sendText(contact, content) {
    const chatId = toChatId(contact);
    const text = getTextContent(content);
    return window.WPP.chat.sendTextMessage(chatId, text);
  }

  async function sendImage(contact, content) {
    const chatId = toChatId(contact);
    const payload = getFilePayload(content);
    const file = await toFile(payload.value, {
      fileName: payload.fileName,
      mimeType: payload.mimeType,
    });

    return window.WPP.chat.sendFileMessage(chatId, file, {
      type: "image",
      caption: payload.caption || undefined,
    });
  }

  async function sendAudio(contact, content) {
    const chatId = toChatId(contact);
    const payload = getFilePayload(content);
    const file = await toFile(payload.value, {
      fileName: payload.fileName || "voice.ogg",
      mimeType: payload.mimeType || "audio/ogg",
    });

    return window.WPP.chat.sendFileMessage(chatId, file, {
      type: "audio",
      isPtt: true,
      mimetype: file.type || payload.mimeType || "audio/ogg",
      filename: file.name || payload.fileName || "voice.ogg",
    });
  }

  async function sendCard(contact, content) {
    const chatId = toChatId(contact);
    const card = typeof content === "string" ? JSON.parse(content) : content || {};
    const contactId = String(card.id || card.contactId || "").trim();
    const name = String(card.name || card.nickname || card.displayName || "").trim();

    if (!contactId) {
      throw new Error("Missing WhatsApp card contact id");
    }

    return window.WPP.chat.sendVCardContactMessage(chatId, {
      id: toChatId(contactId),
      name,
    });
  }

  function patchInitCustomEvent() {
    if (!window.ferdium || typeof window.ferdium.initCustomEvent !== "function") {
      return false;
    }

    if (window.ferdium.initCustomEvent.__yunyiWhatsappWrapped) {
      return true;
    }

    const originalInitCustomEvent = window.ferdium.initCustomEvent.bind(window.ferdium);

    const wrappedInitCustomEvent = (customEvent) => {
      const nextCustomEvent = {
        ...customEvent,
        sendMessage: {
          ...(customEvent?.sendMessage || {}),
          text: sendText,
          image: sendImage,
          audio: sendAudio,
          card: sendCard,
        },
      };

      return originalInitCustomEvent(nextCustomEvent);
    };

    wrappedInitCustomEvent.__yunyiWhatsappWrapped = true;
    window.ferdium.initCustomEvent = wrappedInitCustomEvent;
    return true;
  }

  if (patchInitCustomEvent()) {
    return;
  }

  const timer = window.setInterval(() => {
    if (patchInitCustomEvent()) {
      window.clearInterval(timer);
    }
  }, 200);

  window.setTimeout(() => {
    window.clearInterval(timer);
  }, 30000);
})();
