import type { RecipeInitPayload } from "../../contracts";

export function createFacebookBusinessRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-facebook-business-client",
    recipe: {
      id: "facebook-business",
      path: "/runtime/recipes/facebook-business",
      config: {},
      ...(overrides.recipe ?? {}),
    },
    transSetting: { ...(overrides.transSetting ?? {}) },
    server: { ...(overrides.server ?? {}) },
    token: overrides.token ?? "",
    channels: overrides.channels ?? [],
    languages: overrides.languages ?? [],
    windowSetting: { ...(overrides.windowSetting ?? {}) },
    isCharUser: overrides.isCharUser ?? false,
    isNeedBackupMsg: overrides.isNeedBackupMsg ?? false,
  };
}
