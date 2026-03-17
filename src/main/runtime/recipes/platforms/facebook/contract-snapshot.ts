import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { facebookRecipeAdapter } from "./adapter";
import { createFacebookRecipeFixturePayload } from "./fixture-payload";

export function buildFacebookRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    facebookRecipeAdapter,
    createFacebookRecipeFixturePayload(payloadOverrides),
  );
}
