import type { RecipeAdapter, RecipeContractSnapshot, RecipeInitPayload } from "../contracts";
import {
  GUEST_TO_HOST_RECIPE_CHANNELS,
  HOST_TO_GUEST_RECIPE_CHANNELS,
} from "../contracts";

export function buildRecipeContractSnapshot(
  adapter: RecipeAdapter,
  payload: RecipeInitPayload,
): RecipeContractSnapshot {
  const normalizedPayload = adapter.normalizePayload(payload);
  const runtimeConfig = adapter.buildRuntimeConfig(normalizedPayload);
  const runtimeMethods = adapter.buildRuntimeMethods(normalizedPayload);

  return {
    adapterId: adapter.id,
    platform: adapter.platform,
    payload: normalizedPayload,
    runtimeConfig,
    runtimeMethods: {
      implementedKeys: Object.keys(runtimeMethods),
      legacyBindings: adapter.migration?.legacyMethodBindings ?? [],
    },
    migration: adapter.migration,
    bridge: {
      hostToGuestChannels: HOST_TO_GUEST_RECIPE_CHANNELS,
      guestToHostChannels: GUEST_TO_HOST_RECIPE_CHANNELS,
    },
  };
}
