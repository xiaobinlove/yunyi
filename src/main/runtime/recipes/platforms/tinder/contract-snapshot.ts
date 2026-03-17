import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { tinderRecipeAdapter } from "./adapter";
import { createTinderRecipeFixturePayload } from "./fixture-payload";

export function buildTinderRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    tinderRecipeAdapter,
    createTinderRecipeFixturePayload(payloadOverrides),
  );
}
