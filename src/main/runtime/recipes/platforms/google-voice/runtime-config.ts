import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const GOOGLE_VOICE_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const GOOGLE_VOICE_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: ".gb_B.gb_0a.gb_1",
  main: ".messages-container ul.list",
  friendList: ".md-virtual-repeat-scroller,.gvMessagingView-conversationList",
  otherfriendLists:
    '.gvThreadDetails-fullViewButtonText,.gvOmnibar-root.gvPageRoot,.cdk-overlay-pane #contact-list',
  allMsg: ".subject-content-container.bubble",
  ipt: ".message-input-container .message-input",
  sendBtn:
    ".gvThreadDetails-messageEntryContainer button.gv-icon-button.mat-mdc-tooltip-trigger.mdc-icon-button.mat-mdc-icon-button.mat-primary.mat-mdc-button-base",
  position: "beforeend",
  initChatDelay: 3000,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildGoogleVoiceRecipeRuntimeConfig(
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: ".messages-container ul.list",
      chatRoot: ".messages-container ul.list",
      sidebarRoot: ".md-virtual-repeat-scroller,.gvMessagingView-conversationList",
      messageItems: ".subject-content-container.bubble",
      composer: ".message-input-container .message-input",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 3000,
      liveScanDelayMs: 500,
    },
    capabilities: GOOGLE_VOICE_CAPABILITIES,
    legacyConfig: {
      ...GOOGLE_VOICE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
