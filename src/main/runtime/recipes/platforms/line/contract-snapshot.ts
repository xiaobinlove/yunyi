import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { lineRecipeAdapter } from "./adapter";
import { createLineRecipeFixturePayload } from "./fixture-payload";

export function buildLineRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    lineRecipeAdapter,
    createLineRecipeFixturePayload(payloadOverrides),
  );
}
