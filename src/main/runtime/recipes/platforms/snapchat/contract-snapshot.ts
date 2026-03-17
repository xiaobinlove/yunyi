import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { snapchatRecipeAdapter } from "./adapter";
import { createSnapchatRecipeFixturePayload } from "./fixture-payload";

export function buildSnapchatRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    snapchatRecipeAdapter,
    createSnapchatRecipeFixturePayload(payloadOverrides),
  );
}
