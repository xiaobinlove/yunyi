import type { RecipeAdapter, RecipeInitPayload, RecipePlatform } from "../contracts";

export interface RecipeAdapterRegistry {
  list(): readonly RecipeAdapter[];
  register(adapter: RecipeAdapter): void;
  getById(id: string): RecipeAdapter | undefined;
  getByPlatform(platform: RecipePlatform): readonly RecipeAdapter[];
  findMatching(payload: RecipeInitPayload): RecipeAdapter | undefined;
}

export function createRecipeAdapterRegistry(
  initialAdapters: readonly RecipeAdapter[] = [],
): RecipeAdapterRegistry {
  const adapters = new Map<string, RecipeAdapter>();

  for (const adapter of initialAdapters) {
    adapters.set(adapter.id, adapter);
  }

  return {
    list() {
      return Array.from(adapters.values());
    },
    register(adapter) {
      adapters.set(adapter.id, adapter);
    },
    getById(id) {
      return adapters.get(id);
    },
    getByPlatform(platform) {
      return Array.from(adapters.values()).filter((adapter) => adapter.platform === platform);
    },
    findMatching(payload) {
      return Array.from(adapters.values()).find((adapter) => adapter.match(payload));
    },
  };
}
