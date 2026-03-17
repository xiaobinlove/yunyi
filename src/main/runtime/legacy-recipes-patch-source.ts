import { buildWaJsRuntimePatchPrefixSource } from "./legacy-recipes-patch-parts/wa-js-runtime-patch";
import { buildWhatsAppHostBridgeSource } from "./legacy-recipes-patch-parts/whatsapp-host-bridge";
import { joinScriptFragments } from "./script-source";

export const LEGACY_RECIPES_PATCH_TARGETS = {
  whatsappSendWrapperOriginal:
    'let bt=null;const Kb=i=>{bt=i,yr.initCustomEvent(i)},Wb=i=>{yr.addFans(i)};',
  initializeRecipeOriginal:
    'const a=require(t),s=typeof a=="function"?a(this.recipe,{...e}):a;yr.init(e,s),e.isNeedBackupMsg?localStorage.setItem("needBackupMsg","1"):localStorage.removeItem("needBackupMsg"),e.recipe.config.hasInject&&this.recipe.injectJSUnsafe(Po.join(e.recipe.path,"custom.js")),console.log("Initialize Recipe"),this.inited=!0',
  injectJsUnsafeOriginal:
    'injectJSUnsafe(...e){Promise.all(e.map(t=>Fo.existsSync(t)?Fo.readFileSync(t,"utf8"):(console.log("Script not found",t),null))).then(t=>{const o=t.filter(a=>a!==null);o.length>0&&(console.log("Inject scripts to main world",o),Ia.ipcRenderer.sendToHost("inject-js-unsafe",...o))})}',
} as const;

export function buildPatchedWhatsAppSendWrapperSource(): string {
  return buildWhatsAppHostBridgeSource();
}

export function buildPatchedInjectJsUnsafeSource(): string {
  return joinScriptFragments([
    "injectJSUnsafe(...e){",
    buildWaJsRuntimePatchPrefixSource(),
    `Promise.all(P.map(a=>Fo.existsSync(a)?y(Fo.readFileSync(a,"utf8"),a):(console.log("Script not found",a),null))).then(a=>{const l=[],p=new Set;S.concat(a).forEach(m=>{m!==null&&!p.has(m)&&(p.add(m),l.push(m))}),l.length>0&&(console.log("Inject scripts to main world",l),Ia.ipcRenderer.sendToHost("inject-js-unsafe",...l))})}`,
  ]);
}

export function buildPatchedInitializeRecipeSource(): string {
  return 'const a=require(t),s0=typeof a=="function"?a(this.recipe,{...e}):a,s=YUNYI_WHATSAPP_HOST.patchRecipeRuntimeConfig(s0,e);yr.init(e,s),e.isNeedBackupMsg?localStorage.setItem("needBackupMsg","1"):localStorage.removeItem("needBackupMsg"),e.recipe.config.hasInject&&this.recipe.injectJSUnsafe(Po.join(e.recipe.path,"custom.js")),console.log("Initialize Recipe"),this.inited=!0';
}
