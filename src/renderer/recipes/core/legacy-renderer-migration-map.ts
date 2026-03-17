import type { RecipeLegacyMigrationGroup } from "../contracts/recipe-legacy-migration";

export const RECIPE_LEGACY_RENDERER_MIGRATION_MAP: readonly RecipeLegacyMigrationGroup[] = [
  {
    id: "webview-binding",
    title: "Webview Binding",
    steps: [
      {
        symbol: "Kt",
        role: "Attach webview reference and bind listeners",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/bind-recipe-webview-mirror.ts",
          responsibility: "Mirror webview lifecycle and guest bridge events into controller/store",
        },
        notes: [
          "First migration should be additive only.",
          "Keep existing listener registration in place until mirrored state matches runtime behavior.",
        ],
      },
      {
        symbol: "st",
        role: "Handle did-attach side effects",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "future renderer session side-effects layer",
          responsibility: "Run extension load and partition-specific attach side effects outside UI component body",
        },
        notes: [
          "Do not move extension loading into bridge/controller.",
          "Keep browser-session side effects separate from recipe bridge state.",
        ],
      },
    ],
  },
  {
    id: "guest-bridge",
    title: "Guest Bridge Routing",
    steps: [
      {
        symbol: "ge",
        role: "Decode guest event channel and route payloads",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/create-recipe-bridge-controller.ts",
          responsibility: "Normalize guest envelopes and record bridge traffic/state",
        },
        notes: [
          "Controller should own recipe bridge state only.",
          "Business side effects such as unread updates or contact activation should be moved later into a separate reaction layer.",
        ],
      },
    ],
  },
  {
    id: "initialization-timing",
    title: "Initialization Timing",
    steps: [
      {
        symbol: "ensureRecipeInitialized",
        role: "Send initialize-recipe exactly once per loading cycle",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/create-recipe-bridge-orchestrator.ts",
          responsibility: "Own ready/fallback initialization timing and payload dispatch",
        },
        notes: [
          "Payload construction remains external via getInitializePayload.",
          "This isolation is meant to avoid reintroducing init races into the UI layer.",
        ],
      },
      {
        symbol: "resetRecipeBridgeState",
        role: "Reset recipe-ready and initialized flags on new load",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/create-recipe-bridge-orchestrator.ts",
          responsibility: "Reset init timing state when a new load starts",
        },
        notes: [
          "The session store is the source of truth for reset state.",
        ],
      },
      {
        symbol: "Vt",
        role: "Handle dom-ready and did-finish-load adjacent initialization flow",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/create-recipe-bridge-orchestrator.ts",
          responsibility: "Apply loading transitions and schedule dom-ready initialize fallback",
        },
        notes: [
          "Proxy and fingerprint injection remain outside recipe orchestrator.",
        ],
      },
      {
        symbol: "clearWebviewLoading",
        role: "Clear component loading overlay after load milestones",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/create-recipe-bridge-orchestrator.ts",
          responsibility: "Emit loading state updates for the host component to consume",
        },
        notes: [
          "The orchestrator exposes loading transitions, but host UI still owns visual state.",
        ],
      },
    ],
  },
  {
    id: "error-paths",
    title: "Error Handling",
    steps: [
      {
        symbol: "kt",
        role: "Handle did-fail-load error state",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/bind-recipe-webview-mirror.ts",
          responsibility: "Mirror lifecycle error payloads into controller/store",
        },
        notes: [
          "UI-specific retries and visible error messages should stay outside the bridge layer.",
        ],
      },
      {
        symbol: "Ra",
        role: "Handle render-process-gone and crash recovery",
        currentSurface: "readable/dist/assets/index-CQ23iY6_.js",
        target: {
          module: "src/renderer/recipes/core/bind-recipe-webview-mirror.ts",
          responsibility: "Mirror renderer crash state while leaving restart policy in the host component",
        },
        notes: [
          "Restart policy should remain explicit and app-specific.",
        ],
      },
    ],
  },
];
