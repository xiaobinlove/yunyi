import type {
  RecipeCapabilities,
  RecipeLegacyConfigOverrides,
  RecipeLegacyMethodBinding,
} from "../../contracts";

export interface ArchiveBackedRecipeSpec {
  id: string;
  displayName: string;
  serviceURL?: string;
  hasInject?: boolean;
  selectorHints: readonly string[];
  methodHints: readonly string[];
  legacyConfigOverrides?: RecipeLegacyConfigOverrides;
  legacyMethodBindings?: readonly RecipeLegacyMethodBinding[];
  capabilities?: Partial<RecipeCapabilities>;
}

const DEFAULT_CAPABILITIES: RecipeCapabilities = {
  liveTranslation: true,
  historyTranslation: false,
  originalEcho: true,
  messageSend: true,
  contactSync: true,
  unreadSync: true,
  massSend: false,
};

function withCapabilities(
  overrides: Partial<RecipeCapabilities> = {},
): Partial<RecipeCapabilities> {
  return {
    ...DEFAULT_CAPABILITIES,
    ...overrides,
  };
}

export const ARCHIVE_BACKED_RECIPE_SPECS: readonly ArchiveBackedRecipeSpec[] = [
  {
    id: "custom",
    displayName: "Custom",
    selectorHints: [],
    methodHints: [],
    capabilities: withCapabilities({
      liveTranslation: false,
      historyTranslation: false,
      originalEcho: false,
      messageSend: false,
      contactSync: false,
      unreadSync: false,
    }),
  },
  {
    id: "signal",
    displayName: "Signal",
    selectorHints: [],
    methodHints: [],
    capabilities: withCapabilities({
      liveTranslation: false,
      historyTranslation: false,
      originalEcho: false,
      messageSend: false,
      contactSync: false,
      unreadSync: false,
    }),
  },
] as const;

export const ARCHIVE_BACKED_RECIPE_IDS = ARCHIVE_BACKED_RECIPE_SPECS.map((spec) => spec.id);

export function getArchiveBackedRecipeSpec(recipeId: string): ArchiveBackedRecipeSpec | undefined {
  return ARCHIVE_BACKED_RECIPE_SPECS.find((spec) => spec.id === recipeId);
}
