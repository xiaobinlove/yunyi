export const WHATSAPP_SEND_MESSAGE_OVERRIDE_WID_AND_BOOTSTRAP = String.raw`
  function patchWidFactory() {
    try {
      const util = safeRead(() => window.WPP?.util, "WPP.util");
      const contact = safeRead(() => window.WPP?.contact, "WPP.contact");
      const whatsapp = safeRead(() => window.WPP?.whatsapp, "WPP.whatsapp");
      const widFactory = safeRead(() => whatsapp?.WidFactory, "WPP.whatsapp.WidFactory");
      const globalWidFactory = safeRead(() => window.WidFactory, "window.WidFactory");
      const whatsappFunctions = safeRead(() => whatsapp?.functions, "WPP.whatsapp.functions");
      const webpackCreateWidModule = getWebpackModule(
        "webpack.createWidModule",
        (moduleExports) =>
          typeof moduleExports.createWid === "function" &&
          String(moduleExports.createWid).includes("createWidFromWidLike")
      );
      const webpackAssertWidModule = getWebpackModule(
        "webpack.assertWidModule",
        (moduleExports) =>
          typeof moduleExports.assertWid === "function" && typeof moduleExports.InvalidWid === "function"
      );
      const webpackPnLidModule = getWebpackModule(
        "webpack.pnLidModule",
        (moduleExports) =>
          typeof moduleExports.getPnLidEntry === "function" &&
          typeof moduleExports.InvalidWidForGetPnLidEntry === "function"
      );
      let patched = false;

      if (
        patchMethod(util, "createWid", "util.createWid", (originalCreateWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "util.createWid", { value, normalizedValue });
            }
            return originalCreateWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(webpackCreateWidModule, "createWid", "webpack.createWid", (originalCreateWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "webpack.createWid", { value, normalizedValue });
            }
            return originalCreateWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(webpackAssertWidModule, "assertWid", "webpack.assertWid", (originalAssertWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "webpack.assertWid", { value, normalizedValue });
            }
            return originalAssertWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(webpackPnLidModule, "getPnLidEntry", "webpack.getPnLidEntry", (originalGetPnLidEntry) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "webpack.getPnLidEntry", { value, normalizedValue });
            }
            return originalGetPnLidEntry.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(contact, "get", "contact.get", (originalGetContact) =>
          function(value, ...args) {
            const normalizedValue = normalizeLookupTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "contact.get", { value, normalizedValue });
            }
            return originalGetContact.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(contact, "getPnLidEntry", "contact.getPnLidEntry", (originalGetPnLidEntry) =>
          function(value, ...args) {
            const normalizedValue = normalizeLookupTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "contact.getPnLidEntry", { value, normalizedValue });
            }
            return originalGetPnLidEntry.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(contact, "queryExists", "contact.queryExists", (originalQueryExists) =>
          function(value, ...args) {
            const normalizedValue = normalizeLookupTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "contact.queryExists", { value, normalizedValue });
            }
            return originalQueryExists.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(widFactory, "createWid", "createWid", (originalCreateWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeId(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "createWid", { value, normalizedValue });
            }
            return originalCreateWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(widFactory, "createUserWid", "createUserWid", (originalCreateUserWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeId(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "createUserWid", { value, normalizedValue });
            }
            return originalCreateUserWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(widFactory, "createUserWidOrThrow", "createUserWidOrThrow", (originalCreateUserWidOrThrow) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "createUserWidOrThrow", { value, normalizedValue });
            }
            return originalCreateUserWidOrThrow.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(whatsapp, "assertWid", "assertWid", (originalAssertWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "assertWid", { value, normalizedValue });
            }
            return originalAssertWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(globalWidFactory, "createWid", "window.WidFactory.createWid", (originalCreateWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "window.WidFactory.createWid", { value, normalizedValue });
            }
            return originalCreateWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(globalWidFactory, "createUserWid", "window.WidFactory.createUserWid", (originalCreateUserWid) =>
          function(value, ...args) {
            const normalizedValue = normalizeChatTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "window.WidFactory.createUserWid", { value, normalizedValue });
            }
            return originalCreateUserWid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(
          globalWidFactory,
          "createUserWidOrThrow",
          "window.WidFactory.createUserWidOrThrow",
          (originalCreateUserWidOrThrow) =>
            function(value, ...args) {
              const normalizedValue = normalizeChatTarget(value) || value;
              if (normalizedValue !== value) {
                console.log(LOG_PREFIX, "window.WidFactory.createUserWidOrThrow", {
                  value,
                  normalizedValue,
                });
              }
              return originalCreateUserWidOrThrow.call(this, normalizedValue, ...args);
            }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(whatsappFunctions, "getCurrentLid", "functions.getCurrentLid", (originalGetCurrentLid) =>
          function(value, ...args) {
            const normalizedValue = normalizeLookupTarget(value) || value;
            if (normalizedValue !== value) {
              console.log(LOG_PREFIX, "functions.getCurrentLid", { value, normalizedValue });
            }
            return originalGetCurrentLid.call(this, normalizedValue, ...args);
          }
        )
      ) {
        patched = true;
      }

      return (
        patched ||
        (webpackCreateWidModule
          ? typeof webpackCreateWidModule.createWid !== "function" ||
            webpackCreateWidModule.createWid.__yunyiWhatsappWrapped
          : false) &&
          (webpackAssertWidModule
            ? typeof webpackAssertWidModule.assertWid !== "function" ||
              webpackAssertWidModule.assertWid.__yunyiWhatsappWrapped
            : false) &&
          (webpackPnLidModule
            ? typeof webpackPnLidModule.getPnLidEntry !== "function" ||
              webpackPnLidModule.getPnLidEntry.__yunyiWhatsappWrapped
            : false) &&
        (util ? typeof util.createWid !== "function" || util.createWid.__yunyiWhatsappWrapped : false) &&
          (contact
            ? (typeof contact.get !== "function" || contact.get.__yunyiWhatsappWrapped) &&
              (typeof contact.getPnLidEntry !== "function" || contact.getPnLidEntry.__yunyiWhatsappWrapped) &&
              (typeof contact.queryExists !== "function" || contact.queryExists.__yunyiWhatsappWrapped)
            : false) &&
        (widFactory
          ? (typeof widFactory.createWid !== "function" || widFactory.createWid.__yunyiWhatsappWrapped) &&
            (typeof widFactory.createUserWid !== "function" || widFactory.createUserWid.__yunyiWhatsappWrapped) &&
            (typeof widFactory.createUserWidOrThrow !== "function" ||
              widFactory.createUserWidOrThrow.__yunyiWhatsappWrapped)
          : false) &&
          (globalWidFactory
            ? (typeof globalWidFactory.createWid !== "function" ||
                globalWidFactory.createWid.__yunyiWhatsappWrapped) &&
              (typeof globalWidFactory.createUserWid !== "function" ||
                globalWidFactory.createUserWid.__yunyiWhatsappWrapped) &&
              (typeof globalWidFactory.createUserWidOrThrow !== "function" ||
                globalWidFactory.createUserWidOrThrow.__yunyiWhatsappWrapped)
            : false) &&
          (whatsappFunctions
            ? typeof whatsappFunctions.getCurrentLid !== "function" ||
              whatsappFunctions.getCurrentLid.__yunyiWhatsappWrapped
            : false) &&
          (whatsapp
            ? typeof whatsapp.assertWid !== "function" || whatsapp.assertWid.__yunyiWhatsappWrapped
            : false)
      );
    } catch (error) {
      logOnce("error", "patchWidFactory:error", LOG_PREFIX, "patchWidFactory", formatError(error));
      return false;
    }
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
      const fileName = options.fileName || "upload." + guessExtension(mimeType);
      return new File([value], fileName, { type: mimeType });
    }

    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      const mimeType = options.mimeType || "application/octet-stream";
      const fileName = options.fileName || "upload." + guessExtension(mimeType);
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
      const fileName = options.fileName || "upload." + guessExtension(mimeType);
      return new File([blob], fileName, { type: mimeType });
    }

    const mimeType = getMimeType(trimmed, options.mimeType);
    const base64 = trimmed.startsWith("data:") ? trimmed.split(",")[1] || "" : trimmed;
    const fileName = options.fileName || "upload." + guessExtension(mimeType);

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
    try {
      if (!window.ferdium || typeof window.ferdium.initCustomEvent !== "function") {
        return false;
      }

      if (window.ferdium.initCustomEvent.__yunyiWhatsappWrapped) {
        return true;
      }

      return patchMethod(window.ferdium, "initCustomEvent", "initCustomEvent", (originalInitCustomEvent) =>
        function(customEvent) {
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

          return originalInitCustomEvent.call(this, nextCustomEvent);
        }
      );
    } catch (error) {
      logError("patchInitCustomEvent", error);
      return false;
    }
  }

  function patchAll() {
    try {
      const initCustomEventPatched = patchInitCustomEvent();
      const chatPatched = patchWppChat();
      const widPatched = patchWidFactory();
      return {
        initCustomEventPatched,
        chatPatched,
        widPatched,
        sendReady: initCustomEventPatched || chatPatched,
      };
    } catch (error) {
      logError("patchAll", error);
      return {
        initCustomEventPatched: false,
        chatPatched: false,
        widPatched: false,
        sendReady: false,
      };
    }
  }

  const initialState = patchAll();
  if (initialState.sendReady && initialState.widPatched) {
    return;
  }

  const timer = window.setInterval(() => {
    const state = patchAll();
    if (state.sendReady && state.widPatched) {
      window.clearInterval(timer);
    }
  }, 200);

  window.setTimeout(() => {
    window.clearInterval(timer);
  }, 30000);
`;
