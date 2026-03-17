import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { lineBusinessRecipeAdapter } from "./adapter";
import { createLineBusinessRecipeFixturePayload } from "./fixture-payload";

export function buildLineBusinessRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    lineBusinessRecipeAdapter,
    createLineBusinessRecipeFixturePayload(payloadOverrides),
  );
}
