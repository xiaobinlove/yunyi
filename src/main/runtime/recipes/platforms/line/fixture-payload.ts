import type { RecipeInitPayload } from "../../contracts";

export function createLineRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-line-client",
    recipe: {
      id: "line",
      path: "/runtime/recipes/line",
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
