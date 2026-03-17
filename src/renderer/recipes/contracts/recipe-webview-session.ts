import type {
  GuestToHostRecipeChannel,
  HostToGuestRecipeChannel,
  RecipeInitPayload,
} from "../../../main/runtime/recipes/contracts";

export interface RecipeWebviewLifecycleState {
  attached: boolean;
  loading: boolean;
  domReady: boolean;
  didFinishLoad: boolean;
  didStopLoading: boolean;
  renderProcessGone: boolean;
  attachCount: number;
  url: string;
}

export interface RecipeInitializationState {
  readyReceived: boolean;
  initialized: boolean;
  initializeAttempts: number;
  lastInitializeAt: number | null;
  lastInitPayload: RecipeInitPayload | null;
}

export interface RecipeBridgeTrafficState {
  lastGuestChannel: GuestToHostRecipeChannel | null;
  lastHostChannel: HostToGuestRecipeChannel | null;
  lastGuestPayload: unknown;
  lastHostPayload: unknown;
}

export interface RecipeSessionSnapshot {
  lifecycle: RecipeWebviewLifecycleState;
  initialization: RecipeInitializationState;
  traffic: RecipeBridgeTrafficState;
  clientAccount: Record<string, unknown> | null;
  currentContact: Record<string, unknown> | null;
  contactList: Record<string, unknown> | null;
  unreadCount: Record<string, unknown> | null;
  onlineState: Record<string, unknown> | null;
  lastError: string | null;
}

export interface RecipeSessionPatch {
  lifecycle?: Partial<RecipeWebviewLifecycleState>;
  initialization?: Partial<RecipeInitializationState>;
  traffic?: Partial<RecipeBridgeTrafficState>;
  clientAccount?: RecipeSessionSnapshot["clientAccount"];
  currentContact?: RecipeSessionSnapshot["currentContact"];
  contactList?: RecipeSessionSnapshot["contactList"];
  unreadCount?: RecipeSessionSnapshot["unreadCount"];
  onlineState?: RecipeSessionSnapshot["onlineState"];
  lastError?: RecipeSessionSnapshot["lastError"];
}

export interface RecipeSessionStore {
  getSnapshot(): RecipeSessionSnapshot;
  subscribe(listener: (snapshot: RecipeSessionSnapshot) => void): () => void;
  patch(
    patch: RecipeSessionPatch | ((snapshot: RecipeSessionSnapshot) => RecipeSessionPatch),
  ): RecipeSessionSnapshot;
  reset(): RecipeSessionSnapshot;
}
