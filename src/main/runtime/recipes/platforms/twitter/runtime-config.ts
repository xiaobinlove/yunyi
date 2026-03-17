import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const TWITTER_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const TWITTER_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: 'button[data-testid="SideNav_AccountSwitcher_Button"]',
  main: '[data-testid="dm-message-list"] ul',
  friendListDown: '[data-testid="dm-inbox-panel"]',
  otherfriendLists: '[data-testid="AppTabBar_DirectMessage_Link"]',
  allMsg: '[data-testid*="message-text-"] .text-body .text-body',
  ipt: '[data-testid="dm-composer-form"] [data-testid="dm-composer-textarea"]',
  sendBtn: '[data-testid="dm-composer-form"] [data-testid="dm-composer-send-button"]',
  chatDelay: 500,
} as const;

export function buildTwitterRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: '[data-testid="dm-message-list"] ul',
      chatRoot: '[data-testid="dm-message-list"] ul',
      sidebarRoot: '[data-testid="dm-inbox-panel"]',
      messageItems: '[data-testid*="message-text-"] .text-body .text-body',
      composer: '[data-testid="dm-composer-form"] [data-testid="dm-composer-textarea"]',
    },
    observer: {
      subtree: false,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: TWITTER_CAPABILITIES,
    legacyConfig: {
      ...TWITTER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
