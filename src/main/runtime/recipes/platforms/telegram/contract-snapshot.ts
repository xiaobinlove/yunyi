import type { RecipeContractSnapshot, RecipeInitPayload } from "../../contracts";
import { buildRecipeContractSnapshot } from "../../core/recipe-contract-snapshot";
import { telegramKRecipeAdapter, telegramRecipeAdapter } from "./adapter";
import { createTelegramRecipeFixturePayload } from "./fixture-payload";

export function buildTelegramRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    telegramRecipeAdapter,
    createTelegramRecipeFixturePayload("telegram", payloadOverrides),
  );
}

export function buildTelegramKRecipeContractSnapshot(
  payloadOverrides: Partial<RecipeInitPayload> = {},
): RecipeContractSnapshot {
  return buildRecipeContractSnapshot(
    telegramKRecipeAdapter,
    createTelegramRecipeFixturePayload("telegramk", payloadOverrides),
  );
}
