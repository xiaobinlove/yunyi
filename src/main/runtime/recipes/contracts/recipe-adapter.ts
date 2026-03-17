import type { RecipeInitPayload } from "./recipe-init-payload";
import type { RecipeRuntimeConfig } from "./recipe-runtime-config";
import type { RecipeRuntimeMethods } from "./recipe-runtime-methods";

export type RecipePlatform = "whatsapp" | "telegram" | "line";

export type RecipeLegacyConfigValue = string | number | boolean | null;

export type RecipeLegacyConfigOverrides = Record<string, RecipeLegacyConfigValue>;

export interface RecipeLegacyMethodBinding {
  contractKey: keyof RecipeRuntimeMethods;
  legacyKey: string;
  note?: string;
}

export interface RecipeAdapterMigrationMeta {
  legacyConfigSource?: string;
  legacyConfigOverrides?: RecipeLegacyConfigOverrides;
  legacyMethodBindings?: readonly RecipeLegacyMethodBinding[];
}

export interface RecipeAdapter {
  id: string;
  platform: RecipePlatform;
  match(payload: RecipeInitPayload): boolean;
  normalizePayload(payload: RecipeInitPayload): RecipeInitPayload;
  buildRuntimeConfig(payload: RecipeInitPayload): RecipeRuntimeConfig;
  buildRuntimeMethods(payload: RecipeInitPayload): RecipeRuntimeMethods;
  buildGuestPatches?(payload: RecipeInitPayload): string[];
  buildSendOverride?(): string;
  migration?: RecipeAdapterMigrationMeta;
}
