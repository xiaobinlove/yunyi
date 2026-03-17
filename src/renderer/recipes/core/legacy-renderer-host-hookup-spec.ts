import type { RecipeRendererHostHookupSpec } from "../contracts/recipe-renderer-host-hookup";

export const RECIPE_LEGACY_RENDERER_HOST_HOOKUP_SPEC: RecipeRendererHostHookupSpec = {
  componentSurface: "readable/dist/assets/index-CQ23iY6_.js",
  webviewRefBinding: {
    name: "webview ref",
    source: "w.value + Kt(ref callback)",
    target: "shadowRuntime.mountWebview(webview)",
    responsibility: "Mount the active webview instance into the shadow runtime binder",
    notes: [
      "The first migration should mount in parallel with existing listeners.",
      "Do not remove current ref callback behavior until mirrored state is validated.",
    ],
  },
  initializePayload: {
    name: "initialize payload builder",
    source: "yn(i.client)",
    target: "createRecipeRendererShadowRuntime({ getInitializePayload })",
    responsibility:
      "Provide the normalized initialize-recipe payload without moving payload construction into bridge code",
    notes: [
      "Payload construction should remain host-owned because it depends on renderer stores and session data.",
    ],
  },
  loadingBinding: {
    name: "loading state setter",
    source: "z.loading",
    target: "createRecipeRendererShadowRuntime({ setLoading })",
    responsibility:
      "Let orchestrator mirror recipe lifecycle loading transitions without owning UI rendering",
    notes: [
      "The UI component remains the source of truth for visible loading overlays.",
    ],
  },
  lifecycleEffects: [
    {
      name: "did-attach extension flow",
      source: "st()",
      target: "future host side-effect layer",
      responsibility:
        "Keep extension loading and request-header mutation outside the bridge runtime",
    },
    {
      name: "dom-ready proxy and fingerprint flow",
      source: "Vt()",
      target: "future host side-effect layer",
      responsibility:
        "Keep proxy detection, geolocation injection, and badge refresh outside the recipe orchestrator",
    },
    {
      name: "render failure recovery",
      source: "kt() / Ra() / Me()",
      target: "future host error/restart layer",
      responsibility:
        "Keep webview restart policy and visible error state outside the bridge runtime",
    },
  ],
  guestEffects: [
    {
      channel: "ready",
      currentHandler: "ge() -> ensureRecipeInitialized()",
      futureLayer: "shadow runtime orchestrator",
      notes: [
        "This is the first channel that should migrate from direct component logic into the new runtime path.",
      ],
    },
    {
      channel: "inject-js-unsafe",
      currentHandler: "ge() -> webview.executeJavaScript(...)",
      futureLayer: "host guest-effect adapter",
      notes: [
        "Remain host-owned because it executes against the live webview instance.",
      ],
    },
    {
      channel: "set-client-account",
      currentHandler: "ge() -> b.updateAccount(...)",
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "set-unread-count",
      currentHandler: "ge() -> b.updateUnread(...)",
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "set-online-state",
      currentHandler: "ge() -> b.setOnline(...)",
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "set-contact",
      currentHandler: "ge() -> h.setActive(...) / h.setInactive(...)",
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "set-contact-list",
      currentHandler: "ge() -> h.setMassSendContactList(...)",
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "message-changed",
      currentHandler: 'ge() -> emit("send-ws-message", ...)',
      futureLayer: "host guest-effect adapter",
    },
    {
      channel: "message-send-success",
      currentHandler: 'ge() -> emit("send-ws-message", ...)',
      futureLayer: "host guest-effect adapter",
    },
  ],
};
