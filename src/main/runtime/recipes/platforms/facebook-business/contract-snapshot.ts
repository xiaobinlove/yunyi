import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { facebookBusinessRecipeAdapter } from "./adapter";
import { createFacebookBusinessRecipeFixturePayload } from "./fixture-payload";

export function buildFacebookBusinessRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    facebookBusinessRecipeAdapter,
    createFacebookBusinessRecipeFixturePayload(payloadOverrides),
  );
}
