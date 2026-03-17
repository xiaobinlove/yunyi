import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildGoogleChatRecipeRuntimeConfig,
  GOOGLECHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildGoogleChatRecipeRuntimeMethods,
  GOOGLECHAT_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isGoogleChatRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "googlechat";
}

export function normalizeGoogleChatRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
  return {
    ...payload,
    recipe: { ...payload.recipe, config: payload.recipe.config ?? {} },
    transSetting: { ...payload.transSetting },
    server: { ...payload.server },
    channels: [...payload.channels],
    languages: [...payload.languages],
    windowSetting: { ...payload.windowSetting },
  };
}

export function createGoogleChatRecipeAdapter(): RecipeAdapter {
  return {
    id: "googlechat",
    platform: "archive",
    match(payload) {
      return isGoogleChatRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeGoogleChatRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildGoogleChatRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildGoogleChatRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/googlechat.tar.gz:webview.js",
      legacyConfigOverrides: GOOGLECHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: GOOGLECHAT_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const googleChatRecipeAdapter = createGoogleChatRecipeAdapter();
