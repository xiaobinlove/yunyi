import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const MESSENGER_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const MESSENGER_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged:
    'div[role="navigation"] .x1qjc9v5.x9f619.xdl72j9.x2lwn1j.xeuugli.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62',
  main: 'div[data-pagelet="MWInboxDetail"] div[role="main"] .xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1hl2dhg.x16tdsg8.x1vvkbs.xxymvpz.x1dyh7pn',
  friendList:
    'div[role="navigation"] .x1qjc9v5.x9f619.xdl72j9.x2lwn1j.xeuugli.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62',
  otherfriendLists:
    'div[data-pagelet="MWJewelDropdownContent"],div[role="complementary"] div[data-pagelet="RightRail"],div[data-pagelet="ProfileActions"] div[aria-label="发消息"]',
  allMsg: ".xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw",
  ipt: 'div[data-pagelet="MWComposer"]',
  sendBtn:
    '.xuk3077.x78zum5.x6prxxf.xz9dl7a.xsag5q8 .x1i64zmx.x1emribx.x1y1aw1k.x1sxyh0.xwib8y2.xurb0ha,div[aria-label="按 Enter 键发送"],div[aria-label="Send"]',
  chatDelay: 500,
  isNeedInitChat: true,
  initChatDelay: 1000,
  isObserverSubTree: true,
} as const;

export function buildMessengerRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot:
        'div[data-pagelet="MWInboxDetail"] div[role="main"] .xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1hl2dhg.x16tdsg8.x1vvkbs.xxymvpz.x1dyh7pn',
      chatRoot:
        'div[data-pagelet="MWInboxDetail"] div[role="main"] .xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1hl2dhg.x16tdsg8.x1vvkbs.xxymvpz.x1dyh7pn',
      sidebarRoot:
        'div[role="navigation"] .x1qjc9v5.x9f619.xdl72j9.x2lwn1j.xeuugli.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62',
      messageItems: ".xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw",
      composer: 'div[data-pagelet="MWComposer"]',
    },
    observer: {
      subtree: true,
      historyScanDelayMs: 500,
      liveScanDelayMs: 500,
    },
    capabilities: MESSENGER_CAPABILITIES,
    legacyConfig: {
      ...MESSENGER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
    },
  };
}
