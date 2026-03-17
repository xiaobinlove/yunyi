import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildMessengerRecipeRuntimeConfig,
  MESSENGER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildMessengerRecipeRuntimeMethods,
  MESSENGER_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isMessengerRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "messenger";
}

export function normalizeMessengerRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createMessengerRecipeAdapter(): RecipeAdapter {
  return {
    id: "messenger",
    platform: "archive",
    match(payload) {
      return isMessengerRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeMessengerRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildMessengerRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildMessengerRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/messenger.tar.gz:webview.js",
      legacyConfigOverrides: MESSENGER_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: MESSENGER_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const messengerRecipeAdapter = createMessengerRecipeAdapter();
