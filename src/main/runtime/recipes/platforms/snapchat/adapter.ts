import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildSnapchatRecipeRuntimeConfig,
  SNAPCHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildSnapchatRecipeRuntimeMethods,
  SNAPCHAT_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isSnapchatRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "snapchat";
}

export function normalizeSnapchatRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createSnapchatRecipeAdapter(): RecipeAdapter {
  return {
    id: "snapchat",
    platform: "archive",
    match(payload) {
      return isSnapchatRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeSnapchatRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildSnapchatRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildSnapchatRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/snapchat.tar.gz:webview.js",
      legacyConfigOverrides: SNAPCHAT_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: SNAPCHAT_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const snapchatRecipeAdapter = createSnapchatRecipeAdapter();
