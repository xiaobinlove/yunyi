import type { RecipeInitPayload } from "../../contracts";

export function createTikTokRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-tiktok-client",
    recipe: {
      id: "tiktok",
      path: "/runtime/recipes/tiktok",
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
