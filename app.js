const DEFAULT_TEXT = "For Sliema Central Apt. 8, Malta stay, July 2-5 2026";
const MAX_CANVAS_EDGE = 2400;

const imageInput = document.querySelector("#imageInput");
const fileName = document.querySelector("#fileName");
const watermarkText = document.querySelector("#watermarkText");
const opacityRange = document.querySelector("#opacityRange");
const sizeRange = document.querySelector("#sizeRange");
const tiltRange = document.querySelector("#tiltRange");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");
const canvas = document.querySelector("#previewCanvas");
const previewPanel = document.querySelector(".preview-panel");
const context = canvas.getContext("2d");

let loadedImage = null;
let outputFileName = "malta-watermarked-id.png";

function createDemoImageDataUrl() {
  const isPortraitDemo = new URLSearchParams(window.location.search).get("demo") === "portrait";
  const width = isPortraitDemo ? 560 : 900;
  const height = isPortraitDemo ? 900 : 560;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#f2f4f8"/>
      <rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="18" fill="#fff" stroke="#222" stroke-width="8"/>
      <rect x="76" y="92" width="${Math.min(260, width - 150)}" height="320" fill="#c9def8" stroke="#333" stroke-width="5"/>
      <circle cx="206" cy="210" r="70" fill="#f2c7aa"/>
      <path d="M112 398c18-78 170-78 188 0" fill="#4d68c8"/>
      <rect x="${isPortraitDemo ? 92 : 390}" y="${isPortraitDemo ? 470 : 104}" width="${isPortraitDemo ? 376 : 360}" height="34" fill="#222"/>
      <rect x="${isPortraitDemo ? 92 : 390}" y="${isPortraitDemo ? 540 : 176}" width="${isPortraitDemo ? 340 : 420}" height="28" fill="#777"/>
      <rect x="${isPortraitDemo ? 92 : 390}" y="${isPortraitDemo ? 602 : 238}" width="${isPortraitDemo ? 300 : 380}" height="28" fill="#999"/>
      <rect x="${isPortraitDemo ? 92 : 390}" y="${isPortraitDemo ? 664 : 300}" width="${isPortraitDemo ? 360 : 330}" height="28" fill="#777"/>
      <rect x="${isPortraitDemo ? 92 : 390}" y="${isPortraitDemo ? 726 : 362}" width="${isPortraitDemo ? 310 : 410}" height="28" fill="#aaa"/>
      <text x="${width / 2}" y="${height - 60}" font-family="Arial, sans-serif" font-size="42" fill="#333" text-anchor="middle">DUMMY TEST IMAGE</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function fitDimensions(width, height) {
  const scale = Math.min(1, MAX_CANVAS_EDGE / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function drawPlaceholder() {
  canvas.width = 1200;
  canvas.height = 800;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  previewPanel.classList.remove("has-image");
}

function drawWatermark() {
  if (!loadedImage) {
    drawPlaceholder();
    return;
  }

  const { width, height } = fitDimensions(loadedImage.naturalWidth, loadedImage.naturalHeight);
  const text = watermarkText.value.trim() || DEFAULT_TEXT;
  const fontSize = Number(sizeRange.value);
  const opacity = Number(opacityRange.value);
  const tilt = (Number(tiltRange.value) * Math.PI) / 180;

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(loadedImage, 0, 0, width, height);

  context.save();
  context.globalAlpha = opacity;
  context.translate(width / 2, height / 2);
  context.rotate(tilt);
  context.translate(-width / 2, -height / 2);
  context.font = `900 ${fontSize}px "Comic Sans MS", "Comic Sans", cursive`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = Math.max(3, fontSize * 0.1);

  const diagonal = Math.hypot(width, height);
  const textWidth = context.measureText(text).width;
  const horizontalGap = Math.max(textWidth + fontSize * 8, diagonal * 0.72);
  const verticalGap = Math.max(fontSize * 8, 360);
  const rowOffset = horizontalGap * 0.5;

  for (let y = -diagonal; y < height + diagonal; y += verticalGap) {
    const stagger = Math.round((y + diagonal) / verticalGap) % 2 === 0 ? 0 : rowOffset;
    for (let x = -diagonal - rowOffset + stagger; x < width + diagonal; x += horizontalGap) {
      context.strokeStyle = "#ffffff";
      context.strokeText(text, x, y);
      context.fillStyle = "#d30000";
      context.fillText(text, x, y);
    }
  }

  context.restore();

  previewPanel.classList.add("has-image");
  downloadButton.disabled = false;
}

function loadImageUrl(imageUrl, name, shouldRevoke = false) {
  const image = new Image();

  image.onload = () => {
    if (shouldRevoke) URL.revokeObjectURL(imageUrl);
    loadedImage = image;
    outputFileName = `${name.replace(/\.[^.]+$/, "") || "malta-id"}-watermarked.png`;
    fileName.textContent = name;
    drawWatermark();
  };

  image.onerror = () => {
    if (shouldRevoke) URL.revokeObjectURL(imageUrl);
    fileName.textContent = "that file did not image correctly";
    loadedImage = null;
    downloadButton.disabled = true;
    drawPlaceholder();
  };

  image.src = imageUrl;
}

function loadImageFile(file) {
  if (!file) return;
  loadImageUrl(URL.createObjectURL(file), file.name, true);
}

function downloadCanvas() {
  if (!loadedImage) return;

  const link = document.createElement("a");
  link.download = outputFileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function resetApp() {
  loadedImage = null;
  outputFileName = "malta-watermarked-id.png";
  imageInput.value = "";
  watermarkText.value = DEFAULT_TEXT;
  opacityRange.value = "0.3";
  sizeRange.value = "42";
  tiltRange.value = "-28";
  fileName.textContent = "no image selected :(";
  downloadButton.disabled = true;
  drawPlaceholder();
}

imageInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
});

watermarkText.addEventListener("input", drawWatermark);
opacityRange.addEventListener("input", drawWatermark);
sizeRange.addEventListener("input", drawWatermark);
tiltRange.addEventListener("input", drawWatermark);
downloadButton.addEventListener("click", downloadCanvas);
resetButton.addEventListener("click", resetApp);

drawPlaceholder();

if (["1", "portrait"].includes(new URLSearchParams(window.location.search).get("demo"))) {
  loadImageUrl(createDemoImageDataUrl(), "dummy-id.svg");
}
