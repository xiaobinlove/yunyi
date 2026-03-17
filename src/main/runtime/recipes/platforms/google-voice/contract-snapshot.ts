import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { createGoogleVoiceRecipeFixturePayload } from "./fixture-payload";
import { googleVoiceRecipeAdapter } from "./adapter";

export function buildGoogleVoiceRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    googleVoiceRecipeAdapter,
    createGoogleVoiceRecipeFixturePayload(payloadOverrides),
  );
}
