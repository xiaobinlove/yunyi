import type { RecipeInitPayload } from "../../contracts";

export function createWhatsAppRecipeFixturePayload(
  overrides: Partial<RecipeInitPayload> = {},
): RecipeInitPayload {
  return {
    clientId: "fixture-whatsapp-client",
    recipe: {
      id: "whatsapp",
      path: "/runtime/recipes/whatsapp",
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
