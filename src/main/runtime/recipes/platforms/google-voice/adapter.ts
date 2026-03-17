import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildGoogleVoiceRecipeRuntimeConfig,
  GOOGLE_VOICE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildGoogleVoiceRecipeRuntimeMethods,
  GOOGLE_VOICE_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

export function isGoogleVoiceRecipePayload(payload: RecipeInitPayload): boolean {
  return String(payload.recipe.id).toLowerCase() === "google-voice";
}

export function normalizeGoogleVoiceRecipePayload(
  payload: RecipeInitPayload,
): RecipeInitPayload {
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

export function createGoogleVoiceRecipeAdapter(): RecipeAdapter {
  return {
    id: "google-voice",
    platform: "archive",
    match(payload) {
      return isGoogleVoiceRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeGoogleVoiceRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildGoogleVoiceRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods() {
      return buildGoogleVoiceRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "recipes/archives/google-voice.tar.gz:webview.js",
      legacyConfigOverrides: GOOGLE_VOICE_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: GOOGLE_VOICE_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const googleVoiceRecipeAdapter = createGoogleVoiceRecipeAdapter();
