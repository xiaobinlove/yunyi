export function buildWhatsAppLegacyGetChatInfoFallbackSource(): string {
  return `function(original){return function(...args){let fallbackChat=null;try{fallbackChat=typeof original=="function"?original.apply(this,args):null}catch(error){console.warn("[yunyi-whatsapp-host]","getChatInfo fallback",error)}const activeInput=document.querySelector("#chatActiveIpt")?.value||"",selectedSidebarId=document.querySelector("#pane-side [aria-selected='true'][data-id],#pane-side [data-id][aria-selected='true'],#pane-side [aria-selected='true'] [data-id]")?.getAttribute?.("data-id")||"",normalizedId=YUNYI_WHATSAPP_HOST.normalizeTarget(activeInput)||YUNYI_WHATSAPP_HOST.normalizeTarget(selectedSidebarId)||YUNYI_WHATSAPP_HOST.normalizeTarget(fallbackChat?.id),headerNode=document.querySelector("header span[dir='auto']"),name=(headerNode?.textContent||fallbackChat?.name||"").trim(),group=fallbackChat?.group===!0||document.querySelector("#chatActiveIpt")?.getAttribute("data-isgroup")==="1"||String(normalizedId).includes("@g.us");return{id:normalizedId||String(fallbackChat?.id||""),name,group}}`;
}

export function buildWhatsAppLegacyExtractMessageTextFallbackSource(): string {
  return `function(original){return function(node,...rest){const extractedText=YUNYI_WHATSAPP_HOST.extractMessageText(node);if(extractedText)return extractedText;return typeof original=="function"?original.call(this,node,...rest):String(node?.textContent||"").trim()}}`;
}

export function buildWhatsAppLegacyIsHistoryMessageFallbackSource(): string {
  return `function(original){return function(node,...rest){const timestamp=YUNYI_WHATSAPP_HOST.parseHistoryTimestamp(YUNYI_WHATSAPP_HOST.extractMessageLabel(node));if(timestamp){const today=new Date;today.setHours(0,0,0,0);return timestamp<today.getTime()}return typeof original=="function"?original.call(this,node,...rest):!1}}`;
}

export function buildWhatsAppLegacyIsOwnMessageFallbackSource(): string {
  return `function(original){return function(node,...rest){const messageRow=YUNYI_WHATSAPP_HOST.extractMessageRow(node),className=YUNYI_WHATSAPP_HOST.toClassName(messageRow?.className);if(className.includes("message-out"))return!0;if(className.includes("message-in"))return!1;return typeof original=="function"?original.call(this,node,...rest):!1}}`;
}

export function buildWhatsAppLegacyNeedsTranslateFallbackSource(): string {
  return `function(original){return function(event,...rest){if(typeof original=="function")try{if(original.call(this,event,...rest))return!0}catch(error){console.warn("[yunyi-whatsapp-host]","othersNeedTrans fallback",error)}return!!event?.target?.closest?.("#pane-side [role='gridcell'],#pane-side ._ak8o[role='gridcell'],#pane-side [data-testid='cell-frame-container'],#main header")}}`;
}
