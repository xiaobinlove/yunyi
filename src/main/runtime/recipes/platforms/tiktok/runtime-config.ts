import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const TIKTOK_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const TIKTOK_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: 'button[data-e2e="message-button"],[class*="-DivMessageIconContainer"]',
  main: '[class*="-DivChatMainContent"]',
  friendList: '[class*="-DivListContent"]',
  otherfriendLists: '[class*="-DivChatBox"]',
  allMsg: '[class*="-PText"]',
  ipt: ".public-DraftEditor-content",
  sendBtn: '[class*="-StyledSendButton"],[data-e2e="message-send"],[data-e2e="comment-post"]',
  chatDelay: 500,
  isObserverSubTree: true,
} as const;

export function buildTikTokRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: '[class*="-DivChatMainContent"]',
      chatRoot: '[class*="-DivChatMainContent"]',
      sidebarRoot: '[class*="-DivListContent"]',
      messageItems: '[class*="-PText"]',
      composer: ".public-DraftEditor-content",
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: TIKTOK_CAPABILITIES,
    legacyConfig: {
      ...TIKTOK_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
