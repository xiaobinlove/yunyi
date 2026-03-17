import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { zaloRecipeAdapter } from "./adapter";
import { createZaloRecipeFixturePayload } from "./fixture-payload";

export function buildZaloRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    zaloRecipeAdapter,
    createZaloRecipeFixturePayload(payloadOverrides),
  );
}
