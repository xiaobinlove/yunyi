export const WHATSAPP_SEND_MESSAGE_OVERRIDE_INTRO_AND_IDENTIFIERS = String.raw`
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

    if (
      explicitServer === "c.us" ||
      explicitServer === "lid" ||
      normalizedId.endsWith("@c.us") ||
      normalizedId.endsWith("@lid")
    ) {
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
`;
