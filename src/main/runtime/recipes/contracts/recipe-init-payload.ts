export interface RecipeDescriptor {
  id: string;
  path: string;
  config?: Record<string, unknown>;
}

export interface RecipeTranslationSettings extends Record<string, unknown> {
  enableReverseTrans?: boolean;
  prompts?: Record<string, unknown>;
}

export interface RecipeServerConfig extends Record<string, unknown> {}

export interface RecipeChannelInfo extends Record<string, unknown> {}

export interface RecipeLanguageInfo extends Record<string, unknown> {}

export interface RecipeWindowSetting extends Record<string, unknown> {
  showDevice?: boolean;
  remarkColor?: string;
}

export interface RecipeInitPayload {
  clientId: string;
  recipe: RecipeDescriptor;
  transSetting: RecipeTranslationSettings;
  server: RecipeServerConfig;
  token: string;
  channels: RecipeChannelInfo[];
  languages: RecipeLanguageInfo[];
  windowSetting: RecipeWindowSetting;
  isCharUser: boolean;
  isNeedBackupMsg: boolean;
}
