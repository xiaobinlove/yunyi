import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import type { PathRuntime } from "../types";
import { getWhatsAppSendMessageOverrideSource } from "./whatsapp-send-message-override";

const LEGACY_BUNDLE_PATCH_MARK = Symbol.for("yunyi.legacyBundlePatcherInstalled");

type ModuleWithCompile = Module & {
  _compile(code: string, filename: string): void;
};

type JsExtensionHandler = (module: ModuleWithCompile, filename: string) => void;

function replaceStrict(source: string, searchValue: string, replaceValue: string, label: string): string {
  if (!source.includes(searchValue)) {
    throw new Error(`Legacy bundle patch target not found: ${label}`);
  }

  return source.replace(searchValue, replaceValue);
}

export function patchDistElectronRecipes(source: string): string {
  const whatsappOverrideSource = JSON.stringify(getWhatsAppSendMessageOverrideSource());
  const waJsBannerOriginal = JSON.stringify('/*! wppconnect-team/wa-js v3.19.6 */(()=>{');
  const waJsBannerPatched = JSON.stringify(
    '/*! wppconnect-team/wa-js v3.19.6 */(()=>{const __YUNYI_WA_NORMALIZE_WID=e=>{const t=r=>{if("string"==typeof r||"number"==typeof r)return String(r).trim();if(!r||"object"!=typeof r)return"";if("string"==typeof r.user&&"string"==typeof r.server)return r.user+"@"+r.server;const n=[r._serialized,r.phoneNumber,r.contactId,r.contactID,r.id,r.wid,r.jid,r.remote,r.chatId,r.participant,r.contact,r.value,r.user,r.server];for(const o of n){const i=t(o);if(i)return i}return""};return t(e)||e};'
  );
  const waJsCreateWidOriginal = JSON.stringify(
    't.createWid=function(e){if(!e)return;const t=o();if(t&&t.isWidlike&&t.isWidlike(e))return t.createWidFromWidLike(e);e&&"object"==typeof e&&"object"==typeof e._serialized&&(e=e._serialized);if("string"!=typeof e)return;if(/@\\w*lid\\b/.test(e))return i(e,"lid");if(/^\\d+$/.test(e))return i(e,"c.us");if(/^\\d+-\\d+$/.test(e))return i(e,"g.us");if(/status$/.test(e))return i(e,"broadcast");if(t&&"function"==typeof t.createWid)return t.createWid(e);return};'
  );
  const waJsCreateWidPatched = JSON.stringify(
    't.createWid=function(e){if(e=__YUNYI_WA_NORMALIZE_WID(e),!e)return;const t=o();if(t&&t.isWidlike&&t.isWidlike(e))return t.createWidFromWidLike(e);e&&"object"==typeof e&&"object"==typeof e._serialized&&(e=e._serialized);if("string"!=typeof e)return;if(/@\\w*lid\\b/.test(e))return i(e,"lid");if(/^120363\\d{6,}$/.test(e))return i(e,"g.us");if(/^\\d+-\\d+$/.test(e))return i(e,"g.us");if(/^\\d+$/.test(e))return i(e,"c.us");if(/status$/.test(e))return i(e,"broadcast");if(t&&"function"==typeof t.createWid)return t.createWid(e);return};'
  );
  const waJsAssertWidOriginal = JSON.stringify(
    't.assertWid=function(e){const t=(0,n.createWid)(e);if(!t)throw new o(e);return t};'
  );
  const waJsAssertWidPatched = JSON.stringify(
    't.assertWid=function(e){e=__YUNYI_WA_NORMALIZE_WID(e);const t=(0,n.createWid)(e);if(!t)throw new o(e);return t};'
  );
  const waJsGetPnLidEntryOriginal = JSON.stringify(
    't.getPnLidEntry=async function(e){const t=(0,n.assertWid)(e);'
  );
  const waJsGetPnLidEntryPatched = JSON.stringify(
    't.getPnLidEntry=async function(e){e=__YUNYI_WA_NORMALIZE_WID(e);const t=(0,n.assertWid)(e);'
  );
  const whatsappSendWrapperOriginal = 'let bt=null;const Kb=i=>{bt=i,yr.initCustomEvent(i)},Wb=i=>{yr.addFans(i)};';
  const whatsappSendWrapperPatched =
    `let bt=null;const YUNYI_WHATSAPP_HOST={
isWhatsapp(){return typeof window!="undefined"&&typeof window.location?.hostname=="string"&&window.location.hostname.includes("whatsapp")},
normalizeTarget(i){if(typeof i=="string"||typeof i=="number")return String(i).trim();if(!i||typeof i!="object")return"";const e=[i.contact,i.phoneNumber,i.contactId,i.contactID,i.id,i._serialized,i.user,i.wid,i.jid,i.remote,i.chatId,i.participant,i.value];for(const t of e){const o=YUNYI_WHATSAPP_HOST.normalizeTarget(t);if(o)return o}return""},
detectType(i,e){const t=typeof i=="object"&&i?i.type||i.contactType||i.chatType||i.messageType:"";if(i?.isGroup===!0||e.includes("@g.us")||/^120363\\d{6,}$/.test(e)||/-\\d+$/.test(e))return"group";if(e.includes("@c.us")||e.includes("@lid"))return"chat";if(t)return t;return"chat"},
toChatId(i){const e=YUNYI_WHATSAPP_HOST.normalizeTarget(i);if(!e)return"";if(e.includes("@"))return e;const t=YUNYI_WHATSAPP_HOST.detectType(i,e);return t==="group"?e+"@g.us":e.replace(/^\\+/,"")+"@c.us"},
describe(i){if(i===null)return"null";if(i===void 0)return"undefined";if(typeof i=="string"||typeof i=="number"||typeof i=="boolean")return String(i);const e=YUNYI_WHATSAPP_HOST.normalizeTarget(i);if(e)return e;try{return JSON.stringify(i)}catch{return String(i)}},
normalizePayload(i){const e=YUNYI_WHATSAPP_HOST.normalizeTarget(i);if(!e)return i;const t=YUNYI_WHATSAPP_HOST.detectType(i,e),o=YUNYI_WHATSAPP_HOST.toChatId(i);if(i&&typeof i=="object")return{...i,rawContactId:e,contactId:o,type:i.type||t};return{rawContactId:e,contactId:o,type:t}},
wrapCustomEvent(i){if(!YUNYI_WHATSAPP_HOST.isWhatsapp()||!i||typeof i!="object"||i.__yunyiWhatsappHostWrapped||!i.sendMessage||typeof i.sendMessage!="object")return i;const e={...i.sendMessage},t=o=>typeof o=="function"?async function(...a){const[s,...c]=a,f=YUNYI_WHATSAPP_HOST.normalizePayload(s);console.log("[yunyi-whatsapp-host]","normalize send target","input="+YUNYI_WHATSAPP_HOST.describe(s),"contactId="+YUNYI_WHATSAPP_HOST.describe(f?.contactId),"type="+YUNYI_WHATSAPP_HOST.describe(f?.type));return await o.call(this,f,...c)}:o;for(const o of["text","image","audio","card"])typeof e[o]=="function"&&(e[o]=t(e[o]));return{...i,sendMessage:e,__yunyiWhatsappHostWrapped:!0}}
};const Kb=i=>{bt=YUNYI_WHATSAPP_HOST.wrapCustomEvent(i),yr.initCustomEvent(bt)},Wb=i=>{yr.addFans(i)};`;
  const injectJsUnsafeOriginal =
    'injectJSUnsafe(...e){Promise.all(e.map(t=>Fo.existsSync(t)?Fo.readFileSync(t,"utf8"):(console.log("Script not found",t),null))).then(t=>{const o=t.filter(a=>a!==null);o.length>0&&(console.log("Inject scripts to main world",o),Ia.ipcRenderer.sendToHost("inject-js-unsafe",...o))})}';
  const injectJsUnsafePatched =
    `injectJSUnsafe(...e){const t=${whatsappOverrideSource},o=a=>(a.includes("/whatsapp/")||a.includes("\\\\whatsapp\\\\")),s=${waJsBannerOriginal},c=${waJsBannerPatched},f=${waJsCreateWidOriginal},b=${waJsCreateWidPatched},w=${waJsAssertWidOriginal},h=${waJsAssertWidPatched},v=${waJsGetPnLidEntryOriginal},u=${waJsGetPnLidEntryPatched},d=(a,l,p,m)=>a.includes(l)?a.replace(l,p):(console.warn("[yunyi-whatsapp-host]","skip runtime patch",m),a),y=(a,l)=>{if(typeof a!="string"||!(typeof l=="string"&&o(l)&&l.endsWith("wppconnect-wa.js")))return a;let p=a;p=d(p,s,c,"wa-js helper"),p=d(p,f,b,"wa-js createWid"),p=d(p,w,h,"wa-js assertWid"),p=d(p,v,u,"wa-js getPnLidEntry"),p!==a&&console.log("[yunyi-whatsapp-host]","patched wppconnect-wa.js runtime");return p},g=e.filter(a=>typeof a=="string"),m=g.some(a=>o(a)&&a.endsWith("custom.js")),k=g.some(a=>o(a)&&a.endsWith("send-message-override.js")),S=m||k?[t]:[],P=g.filter(a=>!(o(a)&&a.endsWith("send-message-override.js")));Promise.all(P.map(a=>Fo.existsSync(a)?y(Fo.readFileSync(a,"utf8"),a):(console.log("Script not found",a),null))).then(a=>{const l=[],p=new Set;S.concat(a).forEach(m=>{m!==null&&!p.has(m)&&(p.add(m),l.push(m))}),l.length>0&&(console.log("Inject scripts to main world",l),Ia.ipcRenderer.sendToHost("inject-js-unsafe",...l))})}`;

  source = replaceStrict(
    source,
    whatsappSendWrapperOriginal,
    whatsappSendWrapperPatched,
    "dist-electron/recipes.js whatsapp send wrapper"
  );

  source = replaceStrict(
    source,
    injectJsUnsafeOriginal,
    injectJsUnsafePatched,
    "dist-electron/recipes.js injectJSUnsafe order fix"
  );

  return source;
}

export function ensurePatchedLegacyRecipesPreload(paths: PathRuntime): string {
  const sourcePath = path.join(paths.getDistElectronDir(), "recipes.js");
  const outputPath = paths.getUserDataDir("runtime", "recipes.patched.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const patchedSource = patchDistElectronRecipes(source);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== patchedSource) {
    fs.writeFileSync(outputPath, patchedSource, "utf8");
  }

  return outputPath;
}

export function installLegacyBundlePatches(paths: PathRuntime): void {
  const globalState = globalThis as Record<PropertyKey, unknown>;
  if (globalState[LEGACY_BUNDLE_PATCH_MARK]) {
    return;
  }

  const recipesPath = path.join(paths.getDistElectronDir(), "recipes.js");
  ensurePatchedLegacyRecipesPreload(paths);
  const moduleApi = Module as unknown as { _extensions: Record<string, JsExtensionHandler> };
  const originalJsExtension = moduleApi._extensions[".js"];
  if (!originalJsExtension) {
    throw new Error("Legacy bundle patcher could not find the default .js loader");
  }

  moduleApi._extensions[".js"] = (module, filename) => {
    if (path.resolve(filename) !== path.resolve(recipesPath)) {
      return originalJsExtension(module, filename);
    }

    const source = fs.readFileSync(filename, "utf8");
    const patchedSource = patchDistElectronRecipes(source);
    module._compile(patchedSource, filename);
  };

  globalState[LEGACY_BUNDLE_PATCH_MARK] = true;
}
