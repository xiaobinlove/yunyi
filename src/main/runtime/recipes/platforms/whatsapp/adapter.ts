import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildWhatsAppRecipeRuntimeConfig,
  WHATSAPP_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildWhatsAppRecipeRuntimeMethods,
  WHATSAPP_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

const WHATSAPP_RECIPE_ID_PATTERN = /whatsapp/i;

export function isWhatsAppRecipePayload(payload: RecipeInitPayload): boolean {
  return WHATSAPP_RECIPE_ID_PATTERN.test(String(payload.recipe.id));
}

export function normalizeWhatsAppRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

export function createWhatsAppRecipeAdapter(): RecipeAdapter {
  return {
    id: "whatsapp",
    platform: "whatsapp",
    match(payload) {
      return isWhatsAppRecipePayload(payload);
    },
    normalizePayload(payload) {
      return normalizeWhatsAppRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildWhatsAppRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods(_payload) {
      return buildWhatsAppRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: "legacy-recipes-patch-parts/whatsapp-host-bridge.ts",
      legacyConfigOverrides: WHATSAPP_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: WHATSAPP_LEGACY_METHOD_BINDINGS,
    },
  };
}

export const whatsappRecipeAdapter = createWhatsAppRecipeAdapter();
