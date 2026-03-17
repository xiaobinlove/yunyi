export const WHATSAPP_SEND_MESSAGE_OVERRIDE_DOM_FALLBACK_CORE = String.raw`
  function normalizeLookupTarget(target) {
    if (isWidLikeTarget(target)) {
      return target;
    }

    return normalizeChatTarget(target);
  }

  function asRejectedPromise(result, onRejected) {
    return Promise.resolve(result).catch((error) => {
      onRejected(error);
      throw error;
    });
  }

  function sleep(duration) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });
  }

  function findFirstElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    return null;
  }

  async function waitForElement(selectors, timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const element = findFirstElement(selectors);
      if (element) {
        return element;
      }
      await sleep(100);
    }

    return null;
  }

  async function waitForAnyElement(selectors, timeoutMs) {
    return waitForElement(selectors, timeoutMs);
  }

  function readElementValue(element) {
    if (!element || typeof element !== "object") {
      return "";
    }

    if ("value" in element && typeof element.value === "string" && element.value.trim()) {
      return element.value.trim();
    }

    if (typeof element.getAttribute === "function") {
      const attributeValue = element.getAttribute("value");
      if (attributeValue && attributeValue.trim()) {
        return attributeValue.trim();
      }
    }

    return String(element.textContent || "").trim();
  }

  function getRawChatId(chatId) {
    const normalizedChatId = normalizeChatTarget(chatId);
    if (typeof normalizedChatId !== "string") {
      return "";
    }

    return normalizedChatId.split("@")[0] || normalizedChatId;
  }

  function getChatMatchTokens(chatId) {
    const normalizedChatId = normalizeChatTarget(chatId);
    const rawChatId = getRawChatId(normalizedChatId);
    const normalizedRawChatId = rawChatId.replace(/^\+/, "");
    const digitsOnly = normalizedRawChatId.replace(/[^\d]/g, "");
    const tokens = new Set();

    [normalizedChatId, rawChatId, normalizedRawChatId, digitsOnly].forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        tokens.add(value.trim());
      }
    });

    return Array.from(tokens);
  }

  function getChatSearchQueries(chatId) {
    const rawChatId = getRawChatId(chatId).replace(/^\+/, "");
    const digitsOnly = rawChatId.replace(/[^\d]/g, "");
    const queries = new Set();

    [rawChatId, digitsOnly].forEach((value) => {
      if (value) {
        queries.add(value);
      }
    });

    return Array.from(queries);
  }

  function getDigitsOnly(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  function isDirectMessageChat(chatId) {
    return typeof chatId === "string" && (chatId.endsWith("@c.us") || chatId.endsWith("@lid"));
  }

  function getHeaderChatLabel() {
    const labels = [];
    CHAT_HEADER_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        const text = readElementValue(node);
        if (text) {
          labels.push(text);
        }
      });
    });

    return labels.join(" ").trim();
  }

  function getCurrentPhoneQuery() {
    try {
      return new URL(window.location.href).searchParams.get("phone") || "";
    } catch (_error) {
      return "";
    }
  }

  function matchesDirectMessageContext(chatId) {
    if (!isDirectMessageChat(chatId)) {
      return false;
    }

    const targetDigits = getDigitsOnly(getRawChatId(chatId));
    if (!targetDigits) {
      return false;
    }

    const activeChatDigits = getDigitsOnly(getActiveChatId());
    if (activeChatDigits && activeChatDigits === targetDigits) {
      return true;
    }

    const routePhone = getDigitsOnly(getCurrentPhoneQuery());
    if (routePhone && routePhone === targetDigits && (!activeChatDigits || activeChatDigits === targetDigits)) {
      return true;
    }

    return false;
  }

  function readSearchableText(element) {
    if (!(element instanceof Element)) {
      return "";
    }

    const fragments = [];
    const candidates = [
      element,
      element.closest("[data-id]"),
      element.closest("[role=\"gridcell\"]"),
      element.closest("a[href]"),
    ];

    candidates.forEach((candidate) => {
      if (!(candidate instanceof Element)) {
        return;
      }

      fragments.push(candidate.textContent || "");

      [
        "data-id",
        "data-pre-plain-text",
        "title",
        "aria-label",
        "href",
        "value",
      ].forEach((attributeName) => {
        const attributeValue = candidate.getAttribute(attributeName);
        if (attributeValue) {
          fragments.push(attributeValue);
        }
      });
    });

    return fragments
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function describeSidebarRow(row) {
    if (!(row instanceof Element)) {
      return null;
    }

    const rowElement = row.closest("[data-id]") || row.closest("[role=\"gridcell\"]") || row;
    const text = readSearchableText(rowElement);

    return {
      dataId: rowElement.getAttribute("data-id") || "",
      title: rowElement.getAttribute("title") || "",
      textPreview: text.slice(0, 120),
    };
  }

  function getSidebarStateSnapshot() {
    return {
      hasSide: Boolean(document.querySelector("#side")),
      hasPaneSide: Boolean(document.querySelector("#pane-side")),
      rowCount: getSidebarChatRows().length,
      hasSearchTrigger: Boolean(findFirstElement(SIDEBAR_SEARCH_TRIGGER_SELECTORS)),
      hasSearchInput: Boolean(findFirstElement(SIDEBAR_SEARCH_INPUT_SELECTORS)),
    };
  }

  function getSidebarChatRows() {
    const rows = [];
    const seen = new Set();

    SIDEBAR_CHAT_ROW_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }

        const clickableNode =
          node.closest("[data-id]") ||
          node.closest("a[href]") ||
          node.closest("[role=\"gridcell\"]") ||
          node.closest("[tabindex]") ||
          node;

        if (!(clickableNode instanceof HTMLElement)) {
          return;
        }

        if (seen.has(clickableNode)) {
          return;
        }

        seen.add(clickableNode);
        rows.push(clickableNode);
      });
    });

    return rows;
  }

  function findSidebarChatRow(chatId) {
    const tokens = getChatMatchTokens(chatId).map((token) => token.toLowerCase());

    if (!tokens.length) {
      return null;
    }

    const rows = getSidebarChatRows();
    for (const row of rows) {
      const searchableText = readSearchableText(row);
      if (!searchableText) {
        continue;
      }

      if (tokens.some((token) => searchableText.includes(token))) {
        return row;
      }
    }

    return null;
  }

  async function waitForSidebarChatRow(chatId, timeoutMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const row = findSidebarChatRow(chatId);
      if (row) {
        return row;
      }
      await sleep(100);
    }

    return null;
  }

  function dispatchMouseClick(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    try {
      element.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    } catch (_error) {}

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0,
      buttons: 1,
    };

    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((eventName) => {
      const EventCtor =
        eventName.startsWith("pointer") && typeof PointerEvent === "function"
          ? PointerEvent
          : MouseEvent;

      try {
        element.dispatchEvent(new EventCtor(eventName, eventOptions));
      } catch (_error) {}
    });

    try {
      element.click();
    } catch (_error) {}
  }

  function focusEditable(element) {
    if (typeof element.click === "function") {
      element.click();
    }

    if (typeof element.focus === "function") {
      element.focus();
    }
  }

  function getActiveChatId() {
    const activeChatInput = findFirstElement(ACTIVE_CHAT_INPUT_SELECTORS);
    const rawValue = readElementValue(activeChatInput);

    if (!rawValue) {
      return "";
    }

    if (rawValue.includes("@")) {
      return rawValue;
    }

    const isGroupValue =
      activeChatInput?.getAttribute?.("data-isgroup") ??
      activeChatInput?.dataset?.isgroup ??
      "";

    return toChatId({
      contactId: rawValue,
      isGroup: isGroupValue === "1" || isGroupValue === "true",
    });
  }

  async function waitForActiveChat(chatId, timeoutMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const activeChatId = getActiveChatId();
      if (activeChatId === chatId) {
        return activeChatId;
      }
      await sleep(100);
    }

    return "";
  }

  async function tryActivateChatByHash(chatId) {
    const chatHashCandidates = ["/" + encodeURIComponent(chatId), encodeURIComponent(chatId)];

    for (const nextHash of chatHashCandidates) {
      try {
        if (window.location.hash !== "#" + nextHash) {
          window.location.hash = nextHash;
        }
      } catch (error) {
        logError("fallback navigate.hash", error, { chatId, nextHash });
      }

      const activeChatId = await waitForActiveChat(chatId, 1500);
      if (activeChatId === chatId) {
        return {
          method: "hash",
          activeChatId,
          hash: nextHash,
        };
      }
    }

    return null;
  }

  async function tryActivateChatByDirectUrl(chatId) {
    if (!isDirectMessageChat(chatId)) {
      return null;
    }

    const phone = getRawChatId(chatId).replace(/[^\d]/g, "");
    if (!phone) {
      return null;
    }

    try {
      const targetUrl = new URL(window.location.href);
      targetUrl.pathname = "/send";
      targetUrl.search = new URLSearchParams({
        phone,
        text: "",
        type: "phone_number",
        app_absent: "0",
      }).toString();

      console.log(LOG_PREFIX, "fallback directUrl", {
        chatId,
        phone,
        href: targetUrl.toString(),
      });

      window.location.assign(targetUrl.toString());
    } catch (error) {
      logError("fallback directUrl.assign", error, { chatId, phone });
      return null;
    }

    const activeChatId = await waitForActiveChat(chatId, 9000);
    if (activeChatId === chatId) {
      return {
        method: "direct-url",
        activeChatId,
        phone,
      };
    }

    console.warn(LOG_PREFIX, "fallback directUrl.inactive", {
      chatId,
      phone,
      activeChatId: getActiveChatId(),
      routePhone: getCurrentPhoneQuery(),
      header: getHeaderChatLabel(),
    });
    return null;
  }

  async function tryActivateChatBySidebarRow(chatId) {
    await waitForAnyElement(["#side", "#pane-side"], 4000);

    const row = await waitForSidebarChatRow(chatId, 4000);
    if (!(row instanceof HTMLElement)) {
      console.warn(LOG_PREFIX, "fallback sidebarRow.miss", {
        chatId,
        tokens: getChatMatchTokens(chatId),
        sidebar: getSidebarStateSnapshot(),
      });
      return null;
    }

    console.log(LOG_PREFIX, "fallback sidebarRow", {
      chatId,
      row: describeSidebarRow(row),
    });
    dispatchMouseClick(row);
    const activeChatId = await waitForActiveChat(chatId, 2500);
    if (activeChatId === chatId) {
      return {
        method: "sidebar-row",
        activeChatId,
        row: describeSidebarRow(row),
      };
    }

    console.warn(LOG_PREFIX, "fallback sidebarRow.inactive", {
      chatId,
      activeChatId,
      row: describeSidebarRow(row),
    });
    return null;
  }

  async function ensureSidebarSearchInput() {
    await waitForAnyElement(["#side", "#pane-side"], 4000);

    let searchInput = await waitForElement(SIDEBAR_SEARCH_INPUT_SELECTORS, 1200);
    if (searchInput) {
      return searchInput;
    }

    const triggers = [];
    SIDEBAR_SEARCH_TRIGGER_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (node instanceof HTMLElement && !triggers.includes(node)) {
          triggers.push(node);
        }
      });
    });

    if (!triggers.length) {
      console.warn(LOG_PREFIX, "fallback searchInput.miss", {
        sidebar: getSidebarStateSnapshot(),
      });
      return null;
    }

    for (const trigger of triggers) {
      dispatchMouseClick(trigger);
      await sleep(250);
      searchInput = await waitForElement(SIDEBAR_SEARCH_INPUT_SELECTORS, 1200);
      if (searchInput) {
        return searchInput;
      }
    }

    console.warn(LOG_PREFIX, "fallback searchInput.unavailable", {
      sidebar: getSidebarStateSnapshot(),
    });
    return null;
  }

  function normalizeComposerText(value) {
    return String(value || "")
      .replace(/\u200b/g, "")
      .replace(/\r/g, "")
      .trim();
  }

  function focusComposer(composer) {
    focusEditable(composer);
  }

  function setComposerSelection(composer, collapseToEnd) {
    const selection = window.getSelection();
    if (!selection) {
      throw new Error("Selection API is unavailable");
    }

    const range = document.createRange();
    range.selectNodeContents(composer);
    range.collapse(Boolean(collapseToEnd));
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function clearEditableField(element) {
    focusEditable(element);

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = "";
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    setComposerSelection(element, false);

    let cleared = false;

    try {
      cleared = document.execCommand("delete", false);
    } catch (_error) {}

    if (!cleared) {
      element.textContent = "";
    }

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "deleteContentBackward",
      })
    );
  }

  function insertTextIntoEditableField(element, text) {
    const normalizedText = String(text ?? "");
    focusEditable(element);

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const selectionStart = element.selectionStart ?? element.value.length;
      const selectionEnd = element.selectionEnd ?? element.value.length;
      element.setRangeText(normalizedText, selectionStart, selectionEnd, "end");
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: normalizedText,
          inputType: "insertText",
        })
      );
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    setComposerSelection(element, true);

    let inserted = false;

    try {
      inserted = document.execCommand("insertText", false, normalizedText);
    } catch (_error) {}

    if (!inserted) {
      const selection = setComposerSelection(element, true);
      const range = selection.getRangeAt(0);
      const fragment = document.createDocumentFragment();
      const lines = normalizedText.split("\n");

      lines.forEach((line, index) => {
        if (index > 0) {
          fragment.appendChild(document.createElement("br"));
        }
        if (line) {
          fragment.appendChild(document.createTextNode(line));
        }
      });

      range.deleteContents();
      range.insertNode(fragment);
      setComposerSelection(element, true);
    }

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: normalizedText,
        inputType: "insertText",
      })
    );
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clearComposer(composer) {
    clearEditableField(composer);
  }

  function insertTextIntoComposer(composer, text) {
    insertTextIntoEditableField(composer, text);
  }

  async function tryActivateChatBySidebarSearch(chatId) {
    const searchInput = await ensureSidebarSearchInput();
    if (
      !(
        searchInput instanceof HTMLElement ||
        searchInput instanceof HTMLInputElement ||
        searchInput instanceof HTMLTextAreaElement
      )
    ) {
      return null;
    }

    const searchQueries = getChatSearchQueries(chatId);
    for (const query of searchQueries) {
      console.log(LOG_PREFIX, "fallback sidebarSearch.query", {
        chatId,
        query,
      });

      try {
        clearEditableField(searchInput);
        await sleep(80);
        insertTextIntoEditableField(searchInput, query);
        await sleep(250);
      } catch (error) {
        logError("fallback sidebarSearch.input", error, { chatId, query });
        continue;
      }

      const row = await waitForSidebarChatRow(chatId, 2500);
      if (!(row instanceof HTMLElement)) {
        console.warn(LOG_PREFIX, "fallback sidebarSearch.noRow", {
          chatId,
          query,
          sidebar: getSidebarStateSnapshot(),
        });
        continue;
      }

      console.log(LOG_PREFIX, "fallback sidebarSearch", {
        chatId,
        query,
        row: describeSidebarRow(row),
      });

      dispatchMouseClick(row);
      const activeChatId = await waitForActiveChat(chatId, 3500);
      if (activeChatId === chatId) {
        try {
          clearEditableField(searchInput);
        } catch (_error) {}

        return {
          method: "sidebar-search",
          activeChatId,
          query,
          row: describeSidebarRow(row),
        };
      }

      console.warn(LOG_PREFIX, "fallback sidebarSearch.inactive", {
        chatId,
        query,
        activeChatId,
        row: describeSidebarRow(row),
      });
    }

    return null;
  }

  async function activateChatForFallback(chatId) {
    const initialActiveChatId = getActiveChatId();
    if (initialActiveChatId === chatId) {
      return {
        method: "already-active",
        activeChatId: initialActiveChatId,
      };
    }

    const hashActivation = await tryActivateChatByHash(chatId);
    if (hashActivation) {
      return hashActivation;
    }

    const directUrlActivation = await tryActivateChatByDirectUrl(chatId);
    if (directUrlActivation) {
      return directUrlActivation;
    }

    const sidebarRowActivation = await tryActivateChatBySidebarRow(chatId);
    if (sidebarRowActivation) {
      return sidebarRowActivation;
    }

    const sidebarSearchActivation = await tryActivateChatBySidebarSearch(chatId);
    if (sidebarSearchActivation) {
      return sidebarSearchActivation;
    }

    if (typeof window.WPP?.chat?.openChatAt === "function") {
      try {
        await window.WPP.chat.openChatAt(chatId);
        const activeChatId = await waitForActiveChat(chatId, 1500);
        if (activeChatId === chatId) {
          return {
            method: "openChatAt",
            activeChatId,
          };
        }
      } catch (error) {
        logError("fallback openChatAt", error, { chatId });
      }
    }

    if (typeof window.WPP?.chat?.openChatBottom === "function") {
      try {
        await window.WPP.chat.openChatBottom(chatId);
        const activeChatId = await waitForActiveChat(chatId, 1500);
        if (activeChatId === chatId) {
          return {
            method: "openChatBottom",
            activeChatId,
          };
        }
      } catch (error) {
        logError("fallback openChatBottom", error, { chatId });
      }
    }

    throw new Error(
      "WhatsApp text fallback could not activate chat " +
        chatId +
        " from " +
        (initialActiveChatId || "<none>")
    );
  }

  function pressEnter(element) {
    const keyboardEventOptions = {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      which: 13,
      keyCode: 13,
    };

    element.dispatchEvent(new KeyboardEvent("keydown", keyboardEventOptions));
    element.dispatchEvent(new KeyboardEvent("keypress", keyboardEventOptions));
    element.dispatchEvent(new KeyboardEvent("keyup", keyboardEventOptions));
  }

  function toLogString(value) {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }

  function enqueueFallbackSend(chatId, runTask) {
    const queuedTask = fallbackSendQueue
      .catch(() => undefined)
      .then(async () => {
        console.log(LOG_PREFIX, "fallback queue.start", toLogString({ chatId }));
        try {
          return await runTask();
        } finally {
          console.log(LOG_PREFIX, "fallback queue.end", toLogString({ chatId }));
        }
      });

    fallbackSendQueue = queuedTask.catch(() => undefined);
    return queuedTask;
  }
`;
