import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { createTwitterRecipeFixturePayload } from "./fixture-payload";
import { twitterRecipeAdapter } from "./adapter";

export function buildTwitterRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    twitterRecipeAdapter,
    createTwitterRecipeFixturePayload(payloadOverrides),
  );
}
