import type { RecipeInitPayload } from "../../contracts";

export function createGoogleChatRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-googlechat-client",
    recipe: {
      id: "googlechat",
      path: "/runtime/recipes/googlechat",
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
