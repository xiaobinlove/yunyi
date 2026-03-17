import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildTwitterRecipeRuntimeConfig,
  TWITTER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildTwitterRecipeRuntimeMethods,
  TWITTER_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isTwitterRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "twitter";
}

export function normalizeTwitterRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createTwitterRecipeAdapter(): RecipeAdapter {
  return {
    id: "twitter",
    platform: "archive",
    match(payload) {
      return isTwitterRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeTwitterRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildTwitterRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildTwitterRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/twitter.tar.gz:webview.js",
      legacyConfigOverrides: TWITTER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: TWITTER_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const twitterRecipeAdapter = createTwitterRecipeAdapter();
