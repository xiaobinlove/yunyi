import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const FACEBOOK_BUSINESS_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const FACEBOOK_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: '[data-pagelet="BizInboxDetailViewHeaderSectionWrapper"] ._4ik4._4ik5',
  main: 'div[data-pagelet="BizInboxDetailSectionWrapper"]',
  friendList: '[data-pagelet="BizP13NInboxUinifiedThreadListView"]',
  otherfriendLists: '[role="tablist"],nav ul._6no_>div>div:nth-child(5)',
  allMsg:
    ".x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq,.x78zum5.xdt5ytf.x2lwn1j.xeuugli.x1r8uery.x1ikap7u",
  ipt:
    'div[data-pagelet="BizInboxDetailSectionWrapper"] textarea,div[data-pagelet="BizInboxDetailSectionWrapper"] [role="textbox"]',
  sendBtn: ".xv54qhq.xwib8y2.xf7dkkf.x1obq294.x5a5i1n.xde0f50.x15x8krk.xt0psk2.xjpr12u",
  chatDelay: 500,
  initChatDelay: 2000,
  isNeedInitChat: true,
  isObserverSubTree: true,
} as const;

export function buildFacebookBusinessRecipeRuntimeConfig(
  _payload: RecipeInitPayload,
): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: 'div[data-pagelet="BizInboxDetailSectionWrapper"]',
      chatRoot: 'div[data-pagelet="BizInboxDetailSectionWrapper"]',
      sidebarRoot: '[data-pagelet="BizP13NInboxUinifiedThreadListView"]',
      messageItems:
        ".x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq,.x78zum5.xdt5ytf.x2lwn1j.xeuugli.x1r8uery.x1ikap7u",
      composer:
        'div[data-pagelet="BizInboxDetailSectionWrapper"] textarea,div[data-pagelet="BizInboxDetailSectionWrapper"] [role="textbox"]',
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 2000,
      liveScanDelayMs: 500,
    },
    capabilities: FACEBOOK_BUSINESS_CAPABILITIES,
    legacyConfig: {
      ...FACEBOOK_BUSINESS_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
