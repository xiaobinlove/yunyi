import type { RecipeInitPayload } from "../../contracts";

export function createGoogleVoiceRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-google-voice-client",
    recipe: {
      id: "google-voice",
      path: "/runtime/recipes/google-voice",
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
