import type { RecipeInitPayload } from "../../contracts";

export function createTeamsRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-teams-client",
    recipe: { id: "teams", path: "/runtime/recipes/teams", config: {}, ...(overrides.recipe ?? {}) },
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
