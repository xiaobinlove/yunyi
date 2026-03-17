import type { RecipeCapabilities, RecipeInitPayload, RecipeRuntimeConfig } from "../../contracts";

const TEAMS_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

export const TEAMS_LEGACY_RUNTIME_CONFIG_OVERRIDES = {
  userLogged: "#idna-me-control-avatar-trigger",
  main: 'div[data-tid="chat-list-layout"]',
  friendList: "#chat-pane-list",
  allMsg: '#chat-pane-list div[data-tid="chat-pane-item"] .fui-Primitive.f1oy3dpc.fqtknz5.fyvcxda',
  ipt: 'div[data-tid="chat-pane-compose-message-footer"] div[data-tid="ckeditor"]',
  sendBtn:
    'div[data-tid="chat-pane-compose-message-footer"] button[data-tid="sendMessageCommands-send"],div[data-tid="chat-pane-compose-message-footer"] button[data-tid="newMessageCommands-send"]',
  chatDelay: 1000,
  isNeedInitChat: true,
  isObserverSubTree: true,
  CSP: true,
} as const;

export function buildTeamsRecipeRuntimeConfig(_payload: RecipeInitPayload): RecipeRuntimeConfig {
  return {
    selectors: {
      appRoot: 'div[data-tid="chat-list-layout"]',
      chatRoot: "#chat-pane-list",
      sidebarRoot: "#chat-pane-list",
      messageItems: '#chat-pane-list div[data-tid="chat-pane-item"] .fui-Primitive.f1oy3dpc.fqtknz5.fyvcxda',
      composer: 'div[data-tid="chat-pane-compose-message-footer"] div[data-tid="ckeditor"]',
    },
    observer: { subtree: true, historyScanDelayMs: 1000, liveScanDelayMs: 1000 },
    capabilities: TEAMS_CAPABILITIES,
    legacyConfig: { ...TEAMS_LEGACY_RUNTIME_CONFIG_OVERRIDES },
  };
}
