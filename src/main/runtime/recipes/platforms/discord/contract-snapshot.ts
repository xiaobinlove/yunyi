import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { discordRecipeAdapter } from "./adapter";
import { createDiscordRecipeFixturePayload } from "./fixture-payload";

export function buildDiscordRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    discordRecipeAdapter,
    createDiscordRecipeFixturePayload(payloadOverrides),
  );
}
