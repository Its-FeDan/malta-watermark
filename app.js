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
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <rect width="900" height="560" fill="#f2f4f8"/>
      <rect x="32" y="32" width="836" height="496" rx="18" fill="#fff" stroke="#222" stroke-width="8"/>
      <rect x="76" y="92" width="260" height="320" fill="#c9def8" stroke="#333" stroke-width="5"/>
      <circle cx="206" cy="210" r="70" fill="#f2c7aa"/>
      <path d="M112 398c18-78 170-78 188 0" fill="#4d68c8"/>
      <rect x="390" y="104" width="360" height="34" fill="#222"/>
      <rect x="390" y="176" width="420" height="28" fill="#777"/>
      <rect x="390" y="238" width="380" height="28" fill="#999"/>
      <rect x="390" y="300" width="330" height="28" fill="#777"/>
      <rect x="390" y="362" width="410" height="28" fill="#aaa"/>
      <text x="450" y="475" font-family="Arial, sans-serif" font-size="42" fill="#333" text-anchor="middle">DUMMY TEST IMAGE</text>
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
  const scale = width / loadedImage.naturalWidth;
  const text = watermarkText.value.trim() || DEFAULT_TEXT;
  const fontSize = Number(sizeRange.value);
  const opacity = Number(opacityRange.value);
  const tilt = (Number(tiltRange.value) * Math.PI) / 180;
  const gap = Math.max(fontSize * 5.7, 280);

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
  for (let y = -diagonal; y < height + diagonal; y += gap) {
    for (let x = -diagonal; x < width + diagonal; x += gap * 1.35) {
      context.strokeStyle = "#ffffff";
      context.strokeText(text, x, y);
      context.fillStyle = "#d30000";
      context.fillText(text, x, y);
    }
  }

  context.restore();

  context.save();
  context.globalAlpha = 0.88;
  let footerSize = Math.max(18, fontSize * 0.62);
  context.font = `900 ${footerSize}px "Comic Sans MS", "Comic Sans", cursive`;
  while (context.measureText(text).width > width * 0.92 && footerSize > 12) {
    footerSize -= 2;
    context.font = `900 ${footerSize}px "Comic Sans MS", "Comic Sans", cursive`;
  }
  context.fillStyle = "#fff600";
  context.strokeStyle = "#000000";
  context.lineWidth = 6;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.strokeText(text, width / 2, height - 22);
  context.fillText(text, width / 2, height - 22);
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

if (new URLSearchParams(window.location.search).get("demo") === "1") {
  loadImageUrl(createDemoImageDataUrl(), "dummy-id.svg");
}
