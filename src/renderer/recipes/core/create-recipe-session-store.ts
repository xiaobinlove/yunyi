import type {
  RecipeSessionPatch,
  RecipeSessionSnapshot,
  RecipeSessionStore,
} from "../contracts/recipe-webview-session";

function createInitialSnapshot(): RecipeSessionSnapshot {
  return {
    lifecycle: {
      attached: false,
      loading: false,
      domReady: false,
      didFinishLoad: false,
      didStopLoading: false,
      renderProcessGone: false,
      attachCount: 0,
      url: "",
    },
    initialization: {
      readyReceived: false,
      initialized: false,
      initializeAttempts: 0,
      lastInitializeAt: null,
      lastInitPayload: null,
    },
    traffic: {
      lastGuestChannel: null,
      lastHostChannel: null,
      lastGuestPayload: null,
      lastHostPayload: null,
    },
    clientAccount: null,
    currentContact: null,
    contactList: null,
    unreadCount: null,
    onlineState: null,
    lastError: null,
  };
}

function mergeSnapshot(
  snapshot: RecipeSessionSnapshot,
  patch: RecipeSessionPatch,
): RecipeSessionSnapshot {
  return {
    ...snapshot,
    ...patch,
    lifecycle: patch.lifecycle
      ? { ...snapshot.lifecycle, ...patch.lifecycle }
      : snapshot.lifecycle,
    initialization: patch.initialization
      ? { ...snapshot.initialization, ...patch.initialization }
      : snapshot.initialization,
    traffic: patch.traffic ? { ...snapshot.traffic, ...patch.traffic } : snapshot.traffic,
  };
}

export function createRecipeSessionStore(
  initial?: Partial<RecipeSessionSnapshot>,
): RecipeSessionStore {
  let snapshot = mergeSnapshot(createInitialSnapshot(), initial ?? {});
  const listeners = new Set<(snapshot: RecipeSessionSnapshot) => void>();

  const notify = () => {
    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    patch(patch) {
      const nextPatch = typeof patch === "function" ? patch(snapshot) : patch;
      snapshot = mergeSnapshot(snapshot, nextPatch);
      notify();
      return snapshot;
    },
    reset() {
      snapshot = createInitialSnapshot();
      notify();
      return snapshot;
    },
  };
}
