import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { createArchiveBackedRecipeFixturePayload } from "./fixture-payload";
import { createArchiveBackedRecipeAdapter } from "./adapter";
import { getArchiveBackedRecipeSpec } from "./specs";

export function buildArchiveBackedRecipeContractSnapshot(
  recipeId: string,
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  const spec = getArchiveBackedRecipeSpec(recipeId);
  if (!spec) {
    throw new Error(`Unknown archive-backed recipe: ${recipeId}`);
  }

  return buildRecipeContractSnapshot(
    createArchiveBackedRecipeAdapter(spec),
    createArchiveBackedRecipeFixturePayload(recipeId, payloadOverrides),
  );
}
