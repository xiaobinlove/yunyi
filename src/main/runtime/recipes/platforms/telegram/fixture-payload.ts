import type { RecipeInitPayload } from "../../contracts";

export function createTelegramRecipeFixturePayload(
  recipeId: "telegram" | "telegramk" = "telegram",
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: `fixture-${recipeId}-client`,
    recipe: {
      id: recipeId,
      path: `/runtime/recipes/${recipeId}`,
      config: {},
      ...(overrides.recipe ?? {}),
    },
    transSetting: {
      ...(overrides.transSetting ?? {}),
    },
    server: {
      ...(overrides.server ?? {}),
    },
    token: overrides.token ?? "",
    channels: overrides.channels ?? [],
    languages: overrides.languages ?? [],
    windowSetting: {
      ...(overrides.windowSetting ?? {}),
    },
    isCharUser: overrides.isCharUser ?? false,
    isNeedBackupMsg: overrides.isNeedBackupMsg ?? false,
  };
}
