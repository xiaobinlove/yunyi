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
  const LOG_PREFIX = "[yunyi-whatsapp-send]";

  console.log(LOG_PREFIX, "boot");

  function normalizeId(value) {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (!value || typeof value !== "object") {
      return "";
    }

    const nestedCandidates = [
      value._serialized,
      value.user,
      value.phoneNumber,
      value.contactId,
      value.contactID,
      value.id,
      value.wid,
      value.jid,
      value.remote,
      value.chatId,
      value.participant,
      value.contact,
      value.value,
    ];

    for (const candidate of nestedCandidates) {
      const normalized = normalizeId(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return "";
  }

  function detectChatType(contact, normalizedId) {
    const explicitType =
      contact?.type ?? contact?.contactType ?? contact?.chatType ?? contact?.messageType;

    if (explicitType) {
      return explicitType;
    }

    if (contact?.isGroup === true || normalizedId.endsWith("@g.us") || /-\d+$/.test(normalizedId)) {
      return "group";
    }

    return "chat";
  }

  function normalizeCardPayload(card) {
    if (!card || typeof card !== "object") {
      return card;
    }

    const contactId = normalizeId(card.id || card.contactId || card);

    return {
      ...card,
      id: contactId || card.id,
      contactId: contactId || card.contactId,
      name: String(card.name || card.nickname || card.displayName || "").trim(),
    };
  }

  function toChatId(contact) {
    const contactId =
      typeof contact === "string" ? contact.trim() : normalizeId(contact?.contactId ?? contact?.id ?? contact);
    const chatType = typeof contact === "object" ? detectChatType(contact, contactId) : "chat";

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

  function normalizeChatTarget(target) {
    const normalizedId = normalizeId(target);
    if (!normalizedId) {
      return target;
    }

    if (normalizedId.includes("@")) {
      return normalizedId;
    }

    return toChatId(target);
  }

  function patchWppChat() {
    const chat = window.WPP?.chat;
    let patched = false;

    if (!chat) {
      return false;
    }

    if (typeof chat.sendTextMessage === "function" && !chat.sendTextMessage.__yunyiWhatsappWrapped) {
      const originalSendTextMessage = chat.sendTextMessage.bind(chat);
      const wrappedSendTextMessage = (target, ...args) => {
        const chatId = toChatId(target);
        console.log(LOG_PREFIX, "sendTextMessage", { target, chatId });
        return originalSendTextMessage(chatId, ...args);
      };

      wrappedSendTextMessage.__yunyiWhatsappWrapped = true;
      chat.sendTextMessage = wrappedSendTextMessage;
      patched = true;
      console.log(LOG_PREFIX, "patched sendTextMessage");
    }

    if (typeof chat.sendFileMessage === "function" && !chat.sendFileMessage.__yunyiWhatsappWrapped) {
      const originalSendFileMessage = chat.sendFileMessage.bind(chat);
      const wrappedSendFileMessage = (target, ...args) => {
        const chatId = toChatId(target);
        console.log(LOG_PREFIX, "sendFileMessage", { target, chatId });
        return originalSendFileMessage(chatId, ...args);
      };

      wrappedSendFileMessage.__yunyiWhatsappWrapped = true;
      chat.sendFileMessage = wrappedSendFileMessage;
      patched = true;
      console.log(LOG_PREFIX, "patched sendFileMessage");
    }

    if (
      typeof chat.sendVCardContactMessage === "function" &&
      !chat.sendVCardContactMessage.__yunyiWhatsappWrapped
    ) {
      const originalSendVCardContactMessage = chat.sendVCardContactMessage.bind(chat);
      const wrappedSendVCardContactMessage = (target, card, ...args) => {
        const chatId = toChatId(target);
        const normalizedCard = normalizeCardPayload(card);
        console.log(LOG_PREFIX, "sendVCardContactMessage", { target, chatId, card: normalizedCard });
        return originalSendVCardContactMessage(chatId, normalizedCard, ...args);
      };

      wrappedSendVCardContactMessage.__yunyiWhatsappWrapped = true;
      chat.sendVCardContactMessage = wrappedSendVCardContactMessage;
      patched = true;
      console.log(LOG_PREFIX, "patched sendVCardContactMessage");
    }

    if (typeof chat.sendRawMessage === "function" && !chat.sendRawMessage.__yunyiWhatsappWrapped) {
      const originalSendRawMessage = chat.sendRawMessage.bind(chat);
      const wrappedSendRawMessage = (target, ...args) => {
        const chatId = normalizeChatTarget(target);
        if (chatId !== target) {
          console.log(LOG_PREFIX, "sendRawMessage", { target, chatId });
        }
        return originalSendRawMessage(chatId, ...args);
      };

      wrappedSendRawMessage.__yunyiWhatsappWrapped = true;
      chat.sendRawMessage = wrappedSendRawMessage;
      patched = true;
      console.log(LOG_PREFIX, "patched sendRawMessage");
    }

    if (typeof chat.find === "function" && !chat.find.__yunyiWhatsappWrapped) {
      const originalFind = chat.find.bind(chat);
      const wrappedFind = (target, ...args) => {
        const chatId = normalizeChatTarget(target);
        if (chatId !== target) {
          console.log(LOG_PREFIX, "chat.find", { target, chatId });
        }
        return originalFind(chatId, ...args);
      };

      wrappedFind.__yunyiWhatsappWrapped = true;
      chat.find = wrappedFind;
      patched = true;
      console.log(LOG_PREFIX, "patched chat.find");
    }

    if (typeof chat.get === "function" && !chat.get.__yunyiWhatsappWrapped) {
      const originalGet = chat.get.bind(chat);
      const wrappedGet = (target, ...args) => {
        const chatId = normalizeChatTarget(target);
        if (chatId !== target) {
          console.log(LOG_PREFIX, "chat.get", { target, chatId });
        }
        return originalGet(chatId, ...args);
      };

      wrappedGet.__yunyiWhatsappWrapped = true;
      chat.get = wrappedGet;
      patched = true;
      console.log(LOG_PREFIX, "patched chat.get");
    }

    const requiredMethods = [
      "sendTextMessage",
      "sendFileMessage",
      "sendVCardContactMessage",
      "sendRawMessage",
      "find",
      "get",
    ];

    return (
      patched ||
      requiredMethods.every(
        (methodName) =>
          typeof chat[methodName] !== "function" || chat[methodName].__yunyiWhatsappWrapped
      )
    );
  }

  function patchWidFactory() {
    const widFactory = window.WPP?.whatsapp?.WidFactory;
    const whatsapp = window.WPP?.whatsapp;
    let patched = false;

    if (widFactory && typeof widFactory.createWid === "function" && !widFactory.createWid.__yunyiWhatsappWrapped) {
      const originalCreateWid = widFactory.createWid.bind(widFactory);
      const wrappedCreateWid = (value, ...args) => {
        const normalizedValue = normalizeId(value) || value;
        if (normalizedValue !== value) {
          console.log(LOG_PREFIX, "createWid", { value, normalizedValue });
        }
        return originalCreateWid(normalizedValue, ...args);
      };

      wrappedCreateWid.__yunyiWhatsappWrapped = true;
      widFactory.createWid = wrappedCreateWid;
      patched = true;
      console.log(LOG_PREFIX, "patched createWid");
    }

    if (
      widFactory &&
      typeof widFactory.createUserWid === "function" &&
      !widFactory.createUserWid.__yunyiWhatsappWrapped
    ) {
      const originalCreateUserWid = widFactory.createUserWid.bind(widFactory);
      const wrappedCreateUserWid = (value, ...args) => {
        const normalizedValue = normalizeId(value) || value;
        if (normalizedValue !== value) {
          console.log(LOG_PREFIX, "createUserWid", { value, normalizedValue });
        }
        return originalCreateUserWid(normalizedValue, ...args);
      };

      wrappedCreateUserWid.__yunyiWhatsappWrapped = true;
      widFactory.createUserWid = wrappedCreateUserWid;
      patched = true;
      console.log(LOG_PREFIX, "patched createUserWid");
    }

    if (whatsapp && typeof whatsapp.assertWid === "function" && !whatsapp.assertWid.__yunyiWhatsappWrapped) {
      const originalAssertWid = whatsapp.assertWid.bind(whatsapp);
      const wrappedAssertWid = (value, ...args) => {
        const normalizedValue = normalizeId(value) || value;
        if (normalizedValue !== value) {
          console.log(LOG_PREFIX, "assertWid", { value, normalizedValue });
        }
        return originalAssertWid(normalizedValue, ...args);
      };

      wrappedAssertWid.__yunyiWhatsappWrapped = true;
      whatsapp.assertWid = wrappedAssertWid;
      patched = true;
      console.log(LOG_PREFIX, "patched assertWid");
    }

    return (
      patched ||
      (widFactory
        ? (typeof widFactory.createWid !== "function" || widFactory.createWid.__yunyiWhatsappWrapped) &&
          (typeof widFactory.createUserWid !== "function" || widFactory.createUserWid.__yunyiWhatsappWrapped)
        : false) &&
        (whatsapp
          ? typeof whatsapp.assertWid !== "function" || whatsapp.assertWid.__yunyiWhatsappWrapped
          : false)
    );
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
    const card = normalizeCardPayload(typeof content === "string" ? JSON.parse(content) : content || {});
    const contactId = normalizeId(card.id || card.contactId || card);
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
      console.log(LOG_PREFIX, "wrap initCustomEvent", { customEvent });
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
    console.log(LOG_PREFIX, "patched initCustomEvent");
    return true;
  }

  function patchAll() {
    const initCustomEventPatched = patchInitCustomEvent();
    const chatPatched = patchWppChat();
    const widPatched = patchWidFactory();
    return { initCustomEventPatched, chatPatched, widPatched };
  }

  const initialState = patchAll();
  if (
    initialState.initCustomEventPatched &&
    initialState.chatPatched &&
    initialState.widPatched
  ) {
    return;
  }

  const timer = window.setInterval(() => {
    const state = patchAll();
    if (state.initCustomEventPatched && state.chatPatched && state.widPatched) {
      window.clearInterval(timer);
    }
  }, 200);

  window.setTimeout(() => {
    window.clearInterval(timer);
  }, 30000);
})();
