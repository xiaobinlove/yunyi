const { desktopCapturer, ipcRenderer } = require("electron");

const backgroundImage = document.getElementById("background");
const selectionElement = document.getElementById("selection");
const toolbarElement = document.getElementById("toolbar");
const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");

let currentDisplay = null;
let captureImage = null;
let dragStart = null;
let currentRect = null;
let isDragging = false;

function normalizeRect(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { left, top, width, height };
}

function setSelection(rect) {
  currentRect = rect;
  if (!rect || rect.width < 2 || rect.height < 2) {
    selectionElement.style.display = "none";
    toolbarElement.style.display = "none";
    return;
  }

  selectionElement.style.display = "block";
  selectionElement.style.left = `${rect.left}px`;
  selectionElement.style.top = `${rect.top}px`;
  selectionElement.style.width = `${rect.width}px`;
  selectionElement.style.height = `${rect.height}px`;

  const toolbarTop = Math.max(16, rect.top - 52);
  const toolbarLeft = Math.min(window.innerWidth - 180, Math.max(16, rect.left));
  toolbarElement.style.display = "flex";
  toolbarElement.style.left = `${toolbarLeft}px`;
  toolbarElement.style.top = `${toolbarTop}px`;
}

async function loadScreenBackground() {
  currentDisplay = await ipcRenderer.invoke("capture-screen", { type: "get-current-screen" });
  if (!currentDisplay) {
    return;
  }

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: currentDisplay.bounds.width,
      height: currentDisplay.bounds.height,
    },
    fetchWindowIcons: false,
  });

  const matchedSource =
    sources.find((source) => String(source.display_id || "") === String(currentDisplay.id)) || sources[0];

  if (!matchedSource) {
    return;
  }

  captureImage = new Image();
  captureImage.src = matchedSource.thumbnail.toDataURL();
  backgroundImage.src = captureImage.src;
}

function cropCurrentSelection() {
  if (!captureImage || !currentRect || currentRect.width < 2 || currentRect.height < 2) {
    return "";
  }

  const scaleX = captureImage.naturalWidth / window.innerWidth;
  const scaleY = captureImage.naturalHeight / window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(currentRect.width * scaleX));
  canvas.height = Math.max(1, Math.round(currentRect.height * scaleY));

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.drawImage(
    captureImage,
    currentRect.left * scaleX,
    currentRect.top * scaleY,
    currentRect.width * scaleX,
    currentRect.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/png");
}

function saveSelection() {
  const dataUrl = cropCurrentSelection();
  if (!dataUrl) {
    return;
  }

  ipcRenderer.send("capture-screen", { type: "save", url: dataUrl });
}

function resetSelection() {
  setSelection(null);
}

window.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  dragStart = { x: event.clientX, y: event.clientY };
  isDragging = true;
  ipcRenderer.send("capture-screen", {
    type: "select",
    screenId: String(currentDisplay?.id ?? ""),
  });
  setSelection({ left: event.clientX, top: event.clientY, width: 0, height: 0 });
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging || !dragStart) {
    return;
  }

  setSelection(normalizeRect(dragStart, { x: event.clientX, y: event.clientY }));
});

window.addEventListener("mouseup", (event) => {
  if (!isDragging || !dragStart) {
    return;
  }

  isDragging = false;
  setSelection(normalizeRect(dragStart, { x: event.clientX, y: event.clientY }));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    ipcRenderer.send("capture-screen", { type: "complete" });
    return;
  }

  if (event.key === "Enter") {
    saveSelection();
  }
});

saveButton.addEventListener("click", () => {
  saveSelection();
});

cancelButton.addEventListener("click", () => {
  ipcRenderer.send("capture-screen", { type: "complete" });
});

ipcRenderer.on("capture-screen", (_event, payload = {}) => {
  if (payload.type === "select" && String(payload.screenId || "") !== String(currentDisplay?.id || "")) {
    toolbarElement.style.opacity = "0.45";
    return;
  }

  toolbarElement.style.opacity = "1";
});

window.addEventListener("beforeunload", () => {
  resetSelection();
});

void loadScreenBackground();
