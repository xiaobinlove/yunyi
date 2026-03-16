"use strict";const s=require("electron"),c={on(...e){const[a,n]=e;return s.ipcRenderer.on(a,(t,...i)=>n(t,...i))},off(...e){const[a,...n]=e;return s.ipcRenderer.off(a,...n)},send(...e){console.log("ipcRenderer.send",e);const[a,...n]=e;return s.ipcRenderer.send(a,...n)},invoke(...e){const[a,...n]=e;return s.ipcRenderer.invoke(a,...n)}};if(process.contextIsolated)try{s.contextBridge.exposeInMainWorld("ipcRenderer",c)}catch(e){console.error(e)}else window.ipcRenderer=c;function m(){const e="loader",a=`
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
  z-index: 9;
}

/* From Uiverse.io by cosnametv */ 
.${e} {
  --color: #a5a5b0;
  --size: 70px;
  width: var(--size);
  height: var(--size);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.${e} span {
  width: 100%;
  height: 100%;
  background-color: var(--color);
  animation: keyframes-blink 0.6s alternate infinite linear;
}

.${e} span:nth-child(1) {
  animation-delay: 0ms;
}

.${e} span:nth-child(2) {
  animation-delay: 200ms;
}

.${e} span:nth-child(3) {
  animation-delay: 300ms;
}

.${e} span:nth-child(4) {
  animation-delay: 400ms;
}

.${e} span:nth-child(5) {
  animation-delay: 500ms;
}

.${e} span:nth-child(6) {
  animation-delay: 600ms;
}

@keyframes keyframes-blink {
  0% {
    opacity: 0.3;
    transform: scale(0.5) rotate(5deg);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}
    `,n=document.createElement("style"),t=document.createElement("div");n.id="app-loading-style",n.innerHTML=a,t.className="app-loading-wrap",t.innerHTML=`
<div class="${e}">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>
  `;const i={append(o,r){Array.from(o.children).find(d=>d===r)||o.appendChild(r)},remove(o,r){Array.from(o.children).find(d=>d===r)&&o.removeChild(r)}};return{appendLoading(){i.append(document.head,n),i.append(document.body,t)},removeLoading(){i.remove(document.head,n),i.remove(document.body,t)}}}const{appendLoading:h,removeLoading:l}=m(),p=["complete","interactive"];new Promise(e=>{p.includes(document.readyState)?e(!0):document.addEventListener("readystatechange",()=>{p.includes(document.readyState)&&e(!0)})}).then(h);window.onmessage=e=>{e.data.payload==="removeLoading"&&l()};setTimeout(l,4999);
