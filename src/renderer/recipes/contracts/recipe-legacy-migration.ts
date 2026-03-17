export type LegacyRendererSymbolName =
  | "Kt"
  | "ge"
  | "Vt"
  | "ensureRecipeInitialized"
  | "resetRecipeBridgeState"
  | "clearWebviewLoading"
  | "kt"
  | "Ra"
  | "st";

export interface RecipeLegacyMigrationTarget {
  module: string;
  responsibility: string;
}

export interface RecipeLegacyMigrationStep {
  symbol: LegacyRendererSymbolName;
  role: string;
  currentSurface: string;
  target: RecipeLegacyMigrationTarget;
  notes: readonly string[];
}

export interface RecipeLegacyMigrationGroup {
  id: string;
  title: string;
  steps: readonly RecipeLegacyMigrationStep[];
}
