export interface RecipeLegacyGuestEffectMapItem {
  channel: string;
  currentSurface: string;
  nextSurface: string;
  responsibility: string;
}

export const RECIPE_LEGACY_GUEST_EFFECT_MAP: readonly RecipeLegacyGuestEffectMapItem[] = [
  {
    channel: "inject-js-unsafe",
    currentSurface: 'ge() -> webview.executeJavaScript("use strict"... )',
    nextSurface: "createRecipeGuestEffectAdapter({ onInjectJsUnsafe })",
    responsibility: "Keep JS execution against the live webview in a host-owned adapter",
  },
  {
    channel: "set-client-account",
    currentSurface: "ge() -> b.updateAccount(...)",
    nextSurface: "createRecipeGuestEffectAdapter({ onSetClientAccount })",
    responsibility: "Update account state outside bridge/controller",
  },
  {
    channel: "set-unread-count",
    currentSurface: "ge() -> b.updateUnread(...)",
    nextSurface: "createRecipeGuestEffectAdapter({ onSetUnreadCount })",
    responsibility: "Update unread counters outside bridge/controller",
  },
  {
    channel: "set-online-state",
    currentSurface: "ge() -> b.setOnline(...)",
    nextSurface: "createRecipeGuestEffectAdapter({ onSetOnlineState })",
    responsibility: "Update online state outside bridge/controller",
  },
  {
    channel: "set-contact",
    currentSurface: "ge() -> h.setActive(...) / h.setInactive(...)",
    nextSurface: "createRecipeGuestEffectAdapter({ onSetContact })",
    responsibility: "Switch active contact state outside bridge/controller",
  },
  {
    channel: "set-contact-list",
    currentSurface: "ge() -> h.setMassSendContactList(...)",
    nextSurface: "createRecipeGuestEffectAdapter({ onSetContactList })",
    responsibility: "Update mass-send contact list outside bridge/controller",
  },
  {
    channel: "message-changed",
    currentSurface: 'ge() -> emit("send-ws-message", ...)',
    nextSurface: "createRecipeGuestEffectAdapter({ onMessageChanged })",
    responsibility: "Forward message change events outside bridge/controller",
  },
  {
    channel: "message-send-success",
    currentSurface: 'ge() -> emit("send-ws-message", ...)',
    nextSurface: "createRecipeGuestEffectAdapter({ onMessageSendSuccess })",
    responsibility: "Forward send-success events outside bridge/controller",
  },
];
