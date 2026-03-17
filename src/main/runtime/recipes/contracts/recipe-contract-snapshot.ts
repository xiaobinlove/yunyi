import type {
  RecipeAdapterMigrationMeta,
  RecipeLegacyMethodBinding,
  RecipePlatform,
} from "./recipe-adapter";
import type {
  GuestToHostRecipeChannel,
  HostToGuestRecipeChannel,
} from "./recipe-bridge";
import type { RecipeInitPayload } from "./recipe-init-payload";
import type { RecipeRuntimeConfig } from "./recipe-runtime-config";

export interface RecipeRuntimeMethodSnapshot {
  implementedKeys: string[];
  legacyBindings: readonly RecipeLegacyMethodBinding[];
}

export interface RecipeBridgeSnapshot {
  hostToGuestChannels: readonly HostToGuestRecipeChannel[];
  guestToHostChannels: readonly GuestToHostRecipeChannel[];
}

export interface RecipeContractSnapshot {
  adapterId: string;
  platform: RecipePlatform;
  payload: RecipeInitPayload;
  runtimeConfig: RecipeRuntimeConfig;
  runtimeMethods: RecipeRuntimeMethodSnapshot;
  migration?: RecipeAdapterMigrationMeta;
  bridge: RecipeBridgeSnapshot;
}
