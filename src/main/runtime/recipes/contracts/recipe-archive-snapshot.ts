export interface RecipeArchivePackageConfig {
  serviceURL?: string;
  hasNotificationSound?: boolean;
  hasInject?: boolean;
  [key: string]: unknown;
}

export interface RecipeArchivePackageSnapshot {
  id: string;
  name?: string;
  version?: string;
  config?: RecipeArchivePackageConfig;
}

export interface RecipeArchiveSnapshot {
  recipeId: string;
  archivePath: string;
  packageInfo: RecipeArchivePackageSnapshot;
  selectorHints: string[];
  methodHints: string[];
}
