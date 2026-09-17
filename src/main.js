const els = {
  shell: document.querySelector('#mapShell'),
  img: document.querySelector('#mapImage'),
  marker: document.querySelector('#marker'),
  coords: document.querySelector('#coords'),
  pixelInfo: document.querySelector('#pixelInfo'),
  copy: document.querySelector('#copyBtn'),
  clear: document.querySelector('#clearBtn'),
  reset: document.querySelector('#resetBtn'),
  worldWidth: document.querySelector('#worldWidth'),
  worldHeight: document.querySelector('#worldHeight'),
};

const storeKey = 'pixelmap-tracker:v2';
let state = loadState();

function loadState() {
  try { return JSON.parse(localStorage.getItem(storeKey)) ?? {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(storeKey, JSON.stringify(state)); }
function scale() {
  return {
    width: Math.max(1, Number(els.worldWidth.value) || 4096),
    height: Math.max(1, Number(els.worldHeight.value) || 4096),
  };
}
function imageRect() {
  const shell = els.shell.getBoundingClientRect();
  const imgRatio = els.img.naturalWidth / els.img.naturalHeight;
  const shellRatio = shell.width / shell.height;
  let width, height;
  if (shellRatio > imgRatio) {
    height = shell.height;
    width = height * imgRatio;
  } else {
    width = shell.width;
    height = width / imgRatio;
  }
  return { left: shell.left + (shell.width - width) / 2, top: shell.top + (shell.height - height) / 2, width, height };
}
function pointToCoords(point) {
  const s = scale();
  return {
    x: Math.round((point.u - 0.5) * s.width),
    z: Math.round((point.v - 0.5) * s.height),
  };
}
function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}
function updateMarker() {
  if (!state.point || !els.img.naturalWidth) return;
  const rect = imageRect();
  const shell = els.shell.getBoundingClientRect();
  els.marker.style.left = `${rect.left - shell.left + state.point.u * rect.width}px`;
  els.marker.style.top = `${rect.top - shell.top + state.point.v * rect.height}px`;
  els.marker.classList.add('visible');
  updateCoords();
}
function updateCoords() {
  if (!state.point) {
    els.coords.textContent = 'click the map';
    els.pixelInfo.textContent = 'No point selected yet.';
    return;
  }
  state.coords = pointToCoords(state.point);
  const px = Math.round(state.point.u * els.img.naturalWidth);
  const py = Math.round(state.point.v * els.img.naturalHeight);
  const dx = Math.round((state.point.u - 0.5) * 1000) / 10;
  const dz = Math.round((state.point.v - 0.5) * 1000) / 10;
  els.coords.textContent = `X ${state.coords.x}, Z ${state.coords.z}`;
  els.pixelInfo.textContent = `Image pixel ${px}, ${py} • ${dx}% X from center, ${dz}% Z from center`;
  saveState();
}
function pick(clientX, clientY) {
  const rect = imageRect();
  const u = (clientX - rect.left) / rect.width;
  const v = (clientY - rect.top) / rect.height;
  if (u < 0 || u > 1 || v < 0 || v > 1) return;
  state.point = { u, v };
  updateMarker();
}

if (state.worldWidth) els.worldWidth.value = state.worldWidth;
if (state.worldHeight) els.worldHeight.value = state.worldHeight;
for (const input of [els.worldWidth, els.worldHeight]) {
  input.addEventListener('input', () => {
    state.worldWidth = Number(els.worldWidth.value);
    state.worldHeight = Number(els.worldHeight.value);
    updateCoords();
    saveState();
  });
}

els.img.addEventListener('load', updateMarker);
if (state.point) requestAnimationFrame(updateMarker);
els.shell.addEventListener('click', event => pick(event.clientX, event.clientY));
addEventListener('keydown', event => {
  if (!state.point || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  const step = (event.shiftKey ? 10 : 1) / Math.max(els.img.naturalWidth || 1, els.img.naturalHeight || 1);
  state.point = {
    u: clamp(state.point.u + direction[0] * step),
    v: clamp(state.point.v + direction[1] * step),
  };
  updateMarker();
});
addEventListener('resize', updateMarker);
els.copy.addEventListener('click', async () => {
  if (!state.coords) return;
  await navigator.clipboard.writeText(`${state.coords.x}, ${state.coords.z}`);
  els.copy.textContent = 'Copied';
  setTimeout(() => els.copy.textContent = 'Copy coords', 900);
});
els.clear.addEventListener('click', () => {
  delete state.point;
  delete state.coords;
  els.marker.classList.remove('visible');
  updateCoords();
  saveState();
});
els.reset.addEventListener('click', () => {
  els.worldWidth.value = 4096;
  els.worldHeight.value = 4096;
  state.worldWidth = 4096;
  state.worldHeight = 4096;
  updateCoords();
  saveState();
});
