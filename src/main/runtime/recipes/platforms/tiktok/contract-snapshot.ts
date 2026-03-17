import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { createTikTokRecipeFixturePayload } from "./fixture-payload";
import { tikTokRecipeAdapter } from "./adapter";

export function buildTikTokRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    tikTokRecipeAdapter,
    createTikTokRecipeFixturePayload(payloadOverrides),
  );
}
