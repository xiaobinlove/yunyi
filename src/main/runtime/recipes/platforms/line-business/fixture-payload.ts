import type { RecipeInitPayload } from "../../contracts";

export function createLineBusinessRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-line-business-client",
    recipe: {
      id: "line-business",
      path: "/runtime/recipes/line-business",
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
