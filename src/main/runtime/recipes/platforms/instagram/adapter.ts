import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildInstagramRecipeRuntimeConfig,
  INSTAGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildInstagramRecipeRuntimeMethods,
  INSTAGRAM_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isInstagramRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "instagram";
}

export function normalizeInstagramRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
  return {
    ...payload,
    recipe: {
      ...payload.recipe,
      config: payload.recipe.config ?? {},
    },
    transSetting: {
      ...payload.transSetting,
    },
    server: {
      ...payload.server,
    },
    channels: [...payload.channels],
    languages: [...payload.languages],
    windowSetting: {
      ...payload.windowSetting,
    },
  };
}

export function createInstagramRecipeAdapter(): RecipeAdapter {
  return {
    id: "instagram",
    platform: "archive",
    match(payload) {
      return isInstagramRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeInstagramRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildInstagramRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods(_payload) {
      return buildInstagramRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/instagram.tar.gz:webview.js",
      legacyConfigOverrides: INSTAGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: INSTAGRAM_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const instagramRecipeAdapter = createInstagramRecipeAdapter();
