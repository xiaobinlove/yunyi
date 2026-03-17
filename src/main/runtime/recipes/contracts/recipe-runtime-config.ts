export interface RecipeCapabilities {
  liveTranslation: boolean;
  historyTranslation: boolean;
  originalEcho: boolean;
  messageSend: boolean;
  contactSync: boolean;
  unreadSync: boolean;
  massSend: boolean;
}

export interface RecipeSelectorProfile {
  appRoot: string;
  chatRoot: string;
  sidebarRoot: string;
  messageItems: string;
  composer?: string;
}

export interface RecipeObserverConfig {
  subtree: boolean;
  historyScanDelayMs: number;
  liveScanDelayMs: number;
}

export interface RecipeRuntimeConfig {
  selectors: RecipeSelectorProfile;
  observer: RecipeObserverConfig;
  capabilities: RecipeCapabilities;
  legacyConfig?: Record<string, unknown>;
}
