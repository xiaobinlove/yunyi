import type { RecipeAdapter, RecipeInitPayload } from "../../contracts";
import {
  buildTelegramRecipeRuntimeConfig,
  TELEGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
} from "./runtime-config";
import {
  buildTelegramRecipeRuntimeMethods,
  TELEGRAM_LEGACY_METHOD_BINDINGS,
} from "./runtime-methods";

const TELEGRAM_RECIPE_ID_PATTERN = /^telegramk?$/i;

export function isTelegramRecipePayload(payload: RecipeInitPayload): boolean {
  return TELEGRAM_RECIPE_ID_PATTERN.test(String(payload.recipe.id));
}

export function normalizeTelegramRecipePayload(payload: RecipeInitPayload): RecipeInitPayload {
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

function createTelegramAdapter(recipeId: "telegram" | "telegramk"): RecipeAdapter {
  return {
    id: recipeId,
    platform: "telegram",
    match(payload) {
      return String(payload.recipe.id).toLowerCase() === recipeId;
    },
    normalizePayload(payload) {
      return normalizeTelegramRecipePayload(payload);
    },
    buildRuntimeConfig(payload) {
      return buildTelegramRecipeRuntimeConfig(payload);
    },
    buildRuntimeMethods(_payload) {
      return buildTelegramRecipeRuntimeMethods();
    },
    migration: {
      legacyConfigSource: `recipes/archives/${recipeId}.tar.gz:webview.js`,
      legacyConfigOverrides: TELEGRAM_LEGACY_RUNTIME_CONFIG_OVERRIDES,
      legacyMethodBindings: TELEGRAM_LEGACY_METHOD_BINDINGS,
    },
  };
}

export function createTelegramRecipeAdapter(): RecipeAdapter {
  return createTelegramAdapter("telegram");
}

export function createTelegramKRecipeAdapter(): RecipeAdapter {
  return createTelegramAdapter("telegramk");
}

export const telegramRecipeAdapter = createTelegramRecipeAdapter();

export const telegramKRecipeAdapter = createTelegramKRecipeAdapter();
