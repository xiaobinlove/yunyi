const WHATSAPP_SEND_MESSAGE_OVERRIDE_SOURCE = String.raw`(() => {
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
  const PATCH_VERSION = "src-runtime-v14";
  const patchLogCache = new Set();
  const webpackModuleCache = new Map();
  let fallbackSendQueue = Promise.resolve();
  const ACTIVE_CHAT_INPUT_SELECTORS = ["#chatActiveIpt"];
  const SIDEBAR_SEARCH_TRIGGER_SELECTORS = [
    '#side div[data-tab="3"][tabindex="0"]',
    '#side [data-tab="3"]',
    'header [data-tab="3"]',
    "header[data-tab=\"2\"] > div > div > div",
  ];
  const SIDEBAR_SEARCH_INPUT_SELECTORS = [
    '#side div.lexical-rich-text-input > div[role="textbox"]',
    '#side [contenteditable="true"][role="textbox"]',
    '#side [contenteditable="true"][data-tab="3"]',
    '#side [contenteditable="true"]',
  ];
  const SIDEBAR_CHAT_ROW_SELECTORS = [
    "#pane-side div[data-id]",
    "#pane-side [data-id]",
    "#pane-side ._ak8o[role=\"gridcell\"]",
    "#pane-side [role=\"gridcell\"]",
    "#side div[data-id]",
    "#side [data-id]",
    "#side a[href]",
  ];
  const SEND_BUTTON_SELECTORS = [
    "footer .x1c4vz4f.x2lah0s.xdl72j9.x1heor9g.xmper1u.x78zum5.xl56j7k.x6s0dn4",
    "footer [data-tab=\"11\"] .xfn3atn.x1pse0pq.x1yxkqql",
    "footer .x6nhntm.x2lah0s.x1lliihq.xk8lq53.x9f619.xt8t1vi.x1xc408v.x129tdwq.x15urzxu.x1vqgdyp.x100vrsf",
    'footer [aria-label="Send"]',
    'footer [aria-label="发送"]',
    'footer [data-icon="send"]',
    'footer span[data-icon="send"]',
  ];
  const CHAT_HEADER_SELECTORS = [
    'header span[dir="auto"]',
    '#main header span[dir="auto"]',
    '#main header [title]',
  ];
  const COMPOSER_SELECTORS = [
    "footer .lexical-rich-text-input .x10l6tqk.x13vifvy.x1ey2m1c.xhtitgo.x47corl.x87ps6o.xh9ts4v.x1k6rcq7.x6prxxf",
    "footer .lexical-rich-text-input .x1hx0egp.x6ikm8r.x1odjw0f.x1k6rcq7.x6prxxf",
    'footer div[contenteditable="true"][role="textbox"]',
    'footer [contenteditable="true"][data-tab]',
    'footer [contenteditable="true"]',
  ];

  console.log(LOG_PREFIX, "boot", PATCH_VERSION);

  function formatError(error) {
    if (!error) {
      return "Unknown error";
    }

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object") {
      return error.stack || error.message || String(error);
    }

    return String(error);
  }

  function logError(stage, error, extra) {
    if (extra === undefined) {
      console.error(LOG_PREFIX, stage, formatError(error));
      return;
    }

    console.error(LOG_PREFIX, stage, formatError(error), extra);
  }

  function logOnce(level, key, ...args) {
    if (patchLogCache.has(key)) {
      return;
    }

    patchLogCache.add(key);
    console[level](...args);
  }

  window.addEventListener("error", (event) => {
    logError("window.error", event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError("unhandledrejection", event.reason);
  });

  function normalizeId(value) {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (!value || typeof value !== "object") {
      return "";
    }

    if (typeof value.user === "string" && typeof value.server === "string") {
      return value.user + "@" + value.server;
    }

    const nestedCandidates = [
      value._serialized,
      value.user,
      value.server,
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
    const explicitServer = contact?.server ?? contact?.wid?.server ?? contact?.id?.server;

    if (
      contact?.isGroup === true ||
      explicitServer === "g.us" ||
      normalizedId.endsWith("@g.us") ||
      /^120363\d{6,}$/.test(normalizedId) ||
      /-\d+$/.test(normalizedId)
    ) {
      return "group";
    }

    if (explicitServer === "c.us" || explicitServer === "lid" || normalizedId.endsWith("@c.us") || normalizedId.endsWith("@lid")) {
      return "chat";
    }

    if (explicitType) {
      return explicitType;
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
      return contactId + "@g.us";
    }

    return contactId.replace(/^\+/, "") + "@c.us";
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

  function isWidLikeTarget(target) {
    if (!target || typeof target !== "object") {
      return false;
    }

    if (typeof target.user === "string" && typeof target.server === "string") {
      return true;
    }

    if (
      target.id &&
      typeof target.id === "object" &&
      typeof target.id.user === "string" &&
      typeof target.id.server === "string"
    ) {
      return true;
    }

    if (
      target.wid &&
      typeof target.wid === "object" &&
      typeof target.wid.user === "string" &&
      typeof target.wid.server === "string"
    ) {
      return true;
    }

    return false;
  }

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

  function resolveSendButton(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    if (element instanceof HTMLButtonElement) {
      return element;
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

    console.log(LOG_PREFIX, "fallback composer", toLogString({
      chatId,
      composerTextLength: composerText.length,
      activeChatId: getActiveChatId(),
      header: getHeaderChatLabel(),
      routePhone: getCurrentPhoneQuery(),
    }));

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
        console.log(LOG_PREFIX, "fallback sendConfirmed", toLogString({
          method: "button",
          ...sendConfirmed,
        }));
        return {
          fallback: true,
          method: "button",
          chatId,
        };
      }

      throw new Error("WhatsApp text fallback send button did not clear composer");
    }

    console.warn(LOG_PREFIX, "fallback sendButton.miss", toLogString({
      chatId,
      sendIconCount: document.querySelectorAll('footer [data-icon="send"], footer span[data-icon="send"]').length,
      footerText: normalizeComposerText(document.querySelector("footer")?.textContent || "").slice(0, 120),
    }));

    if (composer instanceof HTMLElement) {
      focusComposer(composer);
      pressEnter(composer);
      const sendConfirmed = await waitForComposerToClear(chatId, composerText, 3000);
      if (sendConfirmed) {
        console.log(LOG_PREFIX, "fallback sendConfirmed", toLogString({
          method: "enter",
          ...sendConfirmed,
        }));
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
})();`;

export function getWhatsAppSendMessageOverrideSource(): string {
  return WHATSAPP_SEND_MESSAGE_OVERRIDE_SOURCE;
}
