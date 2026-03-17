export const WHATSAPP_SEND_MESSAGE_OVERRIDE_SEND_AND_CHAT_PATCH = String.raw`
  function resolveSendButton(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    return (
      element.closest("button") ||
      element.closest("[role=\"button\"]") ||
      element.closest("[tabindex]") ||
      (element instanceof HTMLElement ? element : null)
    );
  }

  function describeSendButton(button) {
    if (!(button instanceof HTMLElement)) {
      return null;
    }

    return {
      tagName: button.tagName,
      ariaLabel: button.getAttribute("aria-label") || "",
      dataIcon: button.getAttribute("data-icon") || "",
      text: normalizeComposerText(button.textContent || "").slice(0, 60),
    };
  }

  async function waitForSendButton(timeoutMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      for (const selector of SEND_BUTTON_SELECTORS) {
        const element = document.querySelector(selector);
        const button = resolveSendButton(element);
        if (!(button instanceof HTMLElement)) {
          continue;
        }

        const labelText = [
          button.getAttribute("aria-label") || "",
          button.getAttribute("data-icon") || "",
          button.textContent || "",
          element?.getAttribute?.("data-icon") || "",
        ]
          .join(" ")
          .toLowerCase();

        if (
          labelText.includes("send") ||
          labelText.includes("发送") ||
          button.querySelector('[data-icon="send"], span[data-icon="send"]')
        ) {
          console.log(LOG_PREFIX, "fallback sendButton", toLogString(describeSendButton(button)));
          return button;
        }
      }

      await sleep(100);
    }

    return null;
  }

  async function waitForComposerToClear(chatId, previousText, timeoutMs) {
    const startedAt = Date.now();
    const previousNormalized = normalizeComposerText(previousText);

    while (Date.now() - startedAt < timeoutMs) {
      const composer = findFirstElement(COMPOSER_SELECTORS);
      const currentText = normalizeComposerText(readElementValue(composer));

      if (!currentText) {
        return {
          chatId,
          composerCleared: true,
          currentTextLength: 0,
        };
      }

      if (currentText !== previousNormalized && currentText.length < previousNormalized.length) {
        return {
          chatId,
          composerCleared: true,
          currentTextLength: currentText.length,
        };
      }

      await sleep(120);
    }

    return null;
  }

  async function fallbackSendTextMessage(chatId, text) {
    const normalizedText = String(text ?? "");
    console.warn(LOG_PREFIX, "fallback sendTextMessage", {
      chatId,
      textLength: normalizedText.length,
    });

    const activation = await activateChatForFallback(chatId);
    console.log(LOG_PREFIX, "fallback activeChat", toLogString(activation));

    await sleep(300);

    const composer = await waitForElement(COMPOSER_SELECTORS, 4000);
    if (!(composer instanceof HTMLElement)) {
      throw new Error("WhatsApp text fallback could not find composer");
    }

    clearComposer(composer);
    await sleep(80);
    insertTextIntoComposer(composer, normalizedText);
    await sleep(180);

    const composerText = normalizeComposerText(composer.textContent);
    if (!composerText) {
      throw new Error("WhatsApp text fallback composer stayed empty");
    }

    console.log(
      LOG_PREFIX,
      "fallback composer",
      toLogString({
        chatId,
        composerTextLength: composerText.length,
        activeChatId: getActiveChatId(),
        header: getHeaderChatLabel(),
        routePhone: getCurrentPhoneQuery(),
      })
    );

    if (getActiveChatId() && getActiveChatId() !== chatId && !matchesDirectMessageContext(chatId)) {
      throw new Error(
        "WhatsApp text fallback active chat mismatch for " +
          chatId +
          ": " +
          (getActiveChatId() || "<none>")
      );
    }

    const sendButton = await waitForSendButton(2000);
    if (sendButton instanceof HTMLElement) {
      dispatchMouseClick(sendButton);
      const sendConfirmed = await waitForComposerToClear(chatId, composerText, 3000);
      if (sendConfirmed) {
        console.log(
          LOG_PREFIX,
          "fallback sendConfirmed",
          toLogString({
            method: "button",
            ...sendConfirmed,
          })
        );
        return {
          fallback: true,
          method: "button",
          chatId,
        };
      }

      throw new Error("WhatsApp text fallback send button did not clear composer");
    }

    console.warn(
      LOG_PREFIX,
      "fallback sendButton.miss",
      toLogString({
        chatId,
        sendIconCount: document.querySelectorAll('footer [data-icon="send"], footer span[data-icon="send"]').length,
        footerText: normalizeComposerText(document.querySelector("footer")?.textContent || "").slice(0, 120),
      })
    );

    if (composer instanceof HTMLElement) {
      focusComposer(composer);
      pressEnter(composer);
      const sendConfirmed = await waitForComposerToClear(chatId, composerText, 3000);
      if (sendConfirmed) {
        console.log(
          LOG_PREFIX,
          "fallback sendConfirmed",
          toLogString({
            method: "enter",
            ...sendConfirmed,
          })
        );
        return {
          fallback: true,
          method: "enter",
          chatId,
        };
      }

      throw new Error("WhatsApp text fallback enter did not clear composer");
    }

    throw new Error("WhatsApp text fallback could not find send controls");
  }

  function describeValue(value) {
    if (value === null) {
      return "null";
    }

    if (value === undefined) {
      return "undefined";
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    const normalized = normalizeId(value);
    if (normalized) {
      return normalized;
    }

    try {
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }

  function safeRead(readValue, label) {
    try {
      return readValue();
    } catch (error) {
      logOnce("warn", label + ":read-failed", LOG_PREFIX, "skip " + label, formatError(error));
      return null;
    }
  }

  function getWebpackModule(cacheKey, predicate) {
    if (webpackModuleCache.has(cacheKey)) {
      return webpackModuleCache.get(cacheKey);
    }

    const search = safeRead(() => window.WPP?.webpack?.search, "WPP.webpack.search");
    if (typeof search !== "function") {
      return null;
    }

    try {
      const moduleExports = search((moduleExports) => {
        try {
          return Boolean(moduleExports && predicate(moduleExports));
        } catch (_error) {
          return false;
        }
      });

      if (moduleExports) {
        webpackModuleCache.set(cacheKey, moduleExports);
        return moduleExports;
      }
    } catch (error) {
      logOnce("warn", cacheKey + ":search-failed", LOG_PREFIX, "skip " + cacheKey, formatError(error));
    }

    return null;
  }

  function describeDescriptor(descriptor) {
    if (!descriptor) {
      return "missing";
    }

    if ("value" in descriptor) {
      return "value(configurable=" + Boolean(descriptor.configurable) + ", writable=" + Boolean(descriptor.writable) + ")";
    }

    return (
      "accessor(configurable=" +
      Boolean(descriptor.configurable) +
      ", getter=" +
      Boolean(descriptor.get) +
      ", setter=" +
      Boolean(descriptor.set) +
      ")"
    );
  }

  function findDescriptorOwner(target, key) {
    let owner = target;
    while (owner) {
      const descriptor = Object.getOwnPropertyDescriptor(owner, key);
      if (descriptor) {
        return { owner, descriptor };
      }
      owner = Object.getPrototypeOf(owner);
    }

    return null;
  }

  function markWrapped(fn) {
    try {
      Object.defineProperty(fn, "__yunyiWhatsappWrapped", {
        value: true,
        configurable: true,
      });
    } catch (_error) {
      fn.__yunyiWhatsappWrapped = true;
    }

    return fn;
  }

  function installWrappedMethod(target, methodName, wrappedMethod, label) {
    const resolved = findDescriptorOwner(target, methodName);

    try {
      if (!resolved) {
        if (!Object.isExtensible(target)) {
          logOnce("warn", label + ":not-extensible", LOG_PREFIX, "skip " + label, "target not extensible");
          return false;
        }

        Object.defineProperty(target, methodName, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: wrappedMethod,
        });
        return true;
      }

      const { owner, descriptor } = resolved;

      if ("value" in descriptor) {
        if (owner === target) {
          if (!descriptor.writable && !descriptor.configurable) {
            logOnce(
              "warn",
              label + ":readonly",
              LOG_PREFIX,
              "skip " + label,
              describeDescriptor(descriptor)
            );
            return false;
          }

          Object.defineProperty(target, methodName, {
            ...descriptor,
            value: wrappedMethod,
          });
          return true;
        }

        if (Object.isExtensible(target)) {
          Object.defineProperty(target, methodName, {
            configurable: true,
            enumerable: descriptor.enumerable ?? true,
            writable: true,
            value: wrappedMethod,
          });
          return true;
        }

        if (!descriptor.configurable) {
          logOnce(
            "warn",
            label + ":prototype-readonly",
            LOG_PREFIX,
            "skip " + label,
            describeDescriptor(descriptor)
          );
          return false;
        }

        Object.defineProperty(owner, methodName, {
          ...descriptor,
          value: wrappedMethod,
        });
        return true;
      }

      if (owner !== target && Object.isExtensible(target)) {
        Object.defineProperty(target, methodName, {
          configurable: true,
          enumerable: descriptor.enumerable ?? true,
          writable: true,
          value: wrappedMethod,
        });
        return true;
      }

      if (!descriptor.configurable) {
        logOnce(
          "warn",
          label + ":accessor-readonly",
          LOG_PREFIX,
          "skip " + label,
          describeDescriptor(descriptor)
        );
        return false;
      }

      Object.defineProperty(owner, methodName, {
        configurable: true,
        enumerable: descriptor.enumerable ?? true,
        get() {
          return wrappedMethod;
        },
        set: descriptor.set,
      });
      return true;
    } catch (error) {
      logOnce(
        "error",
        label + ":define-error",
        LOG_PREFIX,
        label,
        formatError(error),
        resolved ? describeDescriptor(resolved.descriptor) : "missing"
      );
      return false;
    }
  }

  function patchMethod(target, methodName, label, createWrapped) {
    if (!target) {
      return false;
    }

    let originalMethod;
    try {
      originalMethod = target[methodName];
    } catch (error) {
      logOnce("error", label + ":read-error", LOG_PREFIX, label, formatError(error));
      return false;
    }

    if (typeof originalMethod !== "function") {
      return false;
    }

    if (originalMethod.__yunyiWhatsappWrapped) {
      return true;
    }

    const wrappedMethod = markWrapped(createWrapped(originalMethod));
    const patched = installWrappedMethod(target, methodName, wrappedMethod, label);

    if (patched) {
      console.log(LOG_PREFIX, "patched " + label);
    }

    return patched;
  }

  function patchWppChat() {
    try {
      const chat = window.WPP?.chat;
      let patched = false;

      if (!chat) {
        return false;
      }

      if (
        patchMethod(chat, "sendTextMessage", "sendTextMessage", (originalSendTextMessage) =>
          async function(target, ...args) {
            const chatId = toChatId(target);
            const text = args[0];
            patchWidFactory();
            console.log(
              LOG_PREFIX,
              "sendTextMessage target=" + describeValue(target) + " chatId=" + describeValue(chatId)
            );
            try {
              return await originalSendTextMessage.call(this, chatId, ...args);
            } catch (error) {
              logError("sendTextMessage.reject", error, {
                target: describeValue(target),
                chatId: describeValue(chatId),
              });

              if (
                formatError(error).includes("enqueue") &&
                (typeof text === "string" || typeof text === "number")
              ) {
                return enqueueFallbackSend(chatId, () => fallbackSendTextMessage(chatId, text));
              }

              throw error;
            }
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(chat, "sendFileMessage", "sendFileMessage", (originalSendFileMessage) =>
          function(target, ...args) {
            const chatId = toChatId(target);
            patchWidFactory();
            console.log(
              LOG_PREFIX,
              "sendFileMessage target=" + describeValue(target) + " chatId=" + describeValue(chatId)
            );
            return asRejectedPromise(
              originalSendFileMessage.call(this, chatId, ...args),
              (error) => {
                logError("sendFileMessage.reject", error, {
                  target: describeValue(target),
                  chatId: describeValue(chatId),
                });
              }
            );
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(chat, "sendVCardContactMessage", "sendVCardContactMessage", (originalSendVCardContactMessage) =>
          function(target, card, ...args) {
            const chatId = toChatId(target);
            const normalizedCard = normalizeCardPayload(card);
            patchWidFactory();
            console.log(
              LOG_PREFIX,
              "sendVCardContactMessage target=" +
                describeValue(target) +
                " chatId=" +
                describeValue(chatId) +
                " cardId=" +
                describeValue(normalizedCard?.id || normalizedCard?.contactId)
            );
            return asRejectedPromise(
              originalSendVCardContactMessage.call(this, chatId, normalizedCard, ...args),
              (error) => {
                logError("sendVCardContactMessage.reject", error, {
                  target: describeValue(target),
                  chatId: describeValue(chatId),
                  cardId: describeValue(normalizedCard?.id || normalizedCard?.contactId),
                });
              }
            );
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(chat, "sendRawMessage", "sendRawMessage", (originalSendRawMessage) =>
          function(target, ...args) {
            const chatId = normalizeChatTarget(target);
            patchWidFactory();
            if (chatId !== target) {
              console.log(
                LOG_PREFIX,
                "sendRawMessage target=" + describeValue(target) + " chatId=" + describeValue(chatId)
              );
            }
            return asRejectedPromise(
              originalSendRawMessage.call(this, chatId, ...args),
              (error) => {
                logError("sendRawMessage.reject", error, {
                  target: describeValue(target),
                  chatId: describeValue(chatId),
                });
              }
            );
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(chat, "find", "chat.find", (originalFind) =>
          function(target, ...args) {
            const chatId = normalizeLookupTarget(target);
            if (chatId !== target) {
              console.log(LOG_PREFIX, "chat.find target=" + describeValue(target) + " chatId=" + describeValue(chatId));
            }
            return originalFind.call(this, chatId, ...args);
          }
        )
      ) {
        patched = true;
      }

      if (
        patchMethod(chat, "get", "chat.get", (originalGet) =>
          function(target, ...args) {
            const chatId = normalizeLookupTarget(target);
            if (chatId !== target) {
              console.log(LOG_PREFIX, "chat.get target=" + describeValue(target) + " chatId=" + describeValue(chatId));
            }
            return originalGet.call(this, chatId, ...args);
          }
        )
      ) {
        patched = true;
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
    } catch (error) {
      logError("patchWppChat", error);
      return false;
    }
  }
`;
