import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { instagramRecipeAdapter } from "./adapter";
import { createInstagramRecipeFixturePayload } from "./fixture-payload";

export function buildInstagramRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    instagramRecipeAdapter,
    createInstagramRecipeFixturePayload(payloadOverrides),
  );
}
