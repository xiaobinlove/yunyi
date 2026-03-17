import { getWhatsAppSendMessageOverrideSource } from "../whatsapp-send-message-override";

const WA_JS_BANNER_ORIGINAL = JSON.stringify('/*! wppconnect-team/wa-js v3.19.6 */(()=>{');
const WA_JS_BANNER_PATCHED = JSON.stringify(
  '/*! wppconnect-team/wa-js v3.19.6 */(()=>{const __YUNYI_WA_NORMALIZE_WID=e=>{const t=r=>{if("string"==typeof r||"number"==typeof r)return String(r).trim();if(!r||"object"!=typeof r)return"";if("string"==typeof r.user&&"string"==typeof r.server)return r.user+"@"+r.server;const n=[r._serialized,r.phoneNumber,r.contactId,r.contactID,r.id,r.wid,r.jid,r.remote,r.chatId,r.participant,r.contact,r.value,r.user,r.server];for(const o of n){const i=t(o);if(i)return i}return""};return t(e)||e};'
);
const WA_JS_CREATE_WID_ORIGINAL = JSON.stringify(
  't.createWid=function(e){if(!e)return;const t=o();if(t&&t.isWidlike&&t.isWidlike(e))return t.createWidFromWidLike(e);e&&"object"==typeof e&&"object"==typeof e._serialized&&(e=e._serialized);if("string"!=typeof e)return;if(/@\\w*lid\\b/.test(e))return i(e,"lid");if(/^\\d+$/.test(e))return i(e,"c.us");if(/^\\d+-\\d+$/.test(e))return i(e,"g.us");if(/status$/.test(e))return i(e,"broadcast");if(t&&"function"==typeof t.createWid)return t.createWid(e);return};'
);
const WA_JS_CREATE_WID_PATCHED = JSON.stringify(
  't.createWid=function(e){if(e=__YUNYI_WA_NORMALIZE_WID(e),!e)return;const t=o();if(t&&t.isWidlike&&t.isWidlike(e))return t.createWidFromWidLike(e);e&&"object"==typeof e&&"object"==typeof e._serialized&&(e=e._serialized);if("string"!=typeof e)return;if(/@\\w*lid\\b/.test(e))return i(e,"lid");if(/^120363\\d{6,}$/.test(e))return i(e,"g.us");if(/^\\d+-\\d+$/.test(e))return i(e,"g.us");if(/^\\d+$/.test(e))return i(e,"c.us");if(/status$/.test(e))return i(e,"broadcast");if(t&&"function"==typeof t.createWid)return t.createWid(e);return};'
);
const WA_JS_ASSERT_WID_ORIGINAL = JSON.stringify(
  't.assertWid=function(e){const t=(0,n.createWid)(e);if(!t)throw new o(e);return t};'
);
const WA_JS_ASSERT_WID_PATCHED = JSON.stringify(
  't.assertWid=function(e){e=__YUNYI_WA_NORMALIZE_WID(e);const t=(0,n.createWid)(e);if(!t)throw new o(e);return t};'
);
const WA_JS_GET_PN_LID_ENTRY_ORIGINAL = JSON.stringify(
  't.getPnLidEntry=async function(e){const t=(0,n.assertWid)(e);'
);
const WA_JS_GET_PN_LID_ENTRY_PATCHED = JSON.stringify(
  't.getPnLidEntry=async function(e){e=__YUNYI_WA_NORMALIZE_WID(e);const t=(0,n.assertWid)(e);'
);

export function buildWaJsRuntimePatchPrefixSource(): string {
  return `const t=${JSON.stringify(getWhatsAppSendMessageOverrideSource())},o=a=>(a.includes("/whatsapp/")||a.includes("\\\\whatsapp\\\\")),s=${WA_JS_BANNER_ORIGINAL},c=${WA_JS_BANNER_PATCHED},f=${WA_JS_CREATE_WID_ORIGINAL},b=${WA_JS_CREATE_WID_PATCHED},w=${WA_JS_ASSERT_WID_ORIGINAL},h=${WA_JS_ASSERT_WID_PATCHED},v=${WA_JS_GET_PN_LID_ENTRY_ORIGINAL},u=${WA_JS_GET_PN_LID_ENTRY_PATCHED},d=(a,l,p,m)=>a.includes(l)?a.replace(l,p):(console.warn("[yunyi-whatsapp-host]","skip runtime patch",m),a),y=(a,l)=>{if(typeof a!="string"||!(typeof l=="string"&&o(l)&&l.endsWith("wppconnect-wa.js")))return a;let p=a;p=d(p,s,c,"wa-js helper"),p=d(p,f,b,"wa-js createWid"),p=d(p,w,h,"wa-js assertWid"),p=d(p,v,u,"wa-js getPnLidEntry"),p!==a&&console.log("[yunyi-whatsapp-host]","patched wppconnect-wa.js runtime");return p},g=e.filter(a=>typeof a=="string"),m=g.some(a=>o(a)&&a.endsWith("custom.js")),k=g.some(a=>o(a)&&a.endsWith("send-message-override.js")),S=m||k?[t]:[],P=g.filter(a=>!(o(a)&&a.endsWith("send-message-override.js")));`;
}
