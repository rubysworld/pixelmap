const els = {
  file: document.querySelector('#mapFile'),
  drop: document.querySelector('#dropZone'),
  shell: document.querySelector('#mapShell'),
  img: document.querySelector('#mapImage'),
  empty: document.querySelector('#emptyState'),
  marker: document.querySelector('#marker'),
  coords: document.querySelector('#coords'),
  pixelInfo: document.querySelector('#pixelInfo'),
  copy: document.querySelector('#copyBtn'),
  clear: document.querySelector('#clearBtn'),
  reset: document.querySelector('#resetBtn'),
  bounds: ['minX', 'maxX', 'minZ', 'maxZ'].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {}),
};

const storeKey = 'pixelmap-tracker:v1';
let state = loadState();

function loadState() {
  try { return JSON.parse(localStorage.getItem(storeKey)) ?? {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(storeKey, JSON.stringify(state)); }
function bounds() {
  return Object.fromEntries(Object.entries(els.bounds).map(([key, el]) => [key, Number(el.value)]));
}
function setImage(src) {
  state.image = src;
  els.img.src = src;
  els.img.classList.add('loaded');
  els.empty.style.display = 'none';
  saveState();
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
function updateMarker() {
  if (!state.point || !els.img.naturalWidth) return;
  const rect = imageRect();
  els.marker.style.left = `${rect.left - els.shell.getBoundingClientRect().left + state.point.u * rect.width}px`;
  els.marker.style.top = `${rect.top - els.shell.getBoundingClientRect().top + state.point.v * rect.height}px`;
  els.marker.classList.add('visible');
  updateCoords();
}
function updateCoords() {
  if (!state.point) {
    els.coords.textContent = 'click the map';
    els.pixelInfo.textContent = 'No point selected yet.';
    return;
  }
  const b = bounds();
  const x = b.minX + state.point.u * (b.maxX - b.minX);
  const z = b.minZ + state.point.v * (b.maxZ - b.minZ);
  const px = Math.round(state.point.u * els.img.naturalWidth);
  const py = Math.round(state.point.v * els.img.naturalHeight);
  state.coords = { x: Math.round(x), z: Math.round(z) };
  els.coords.textContent = `X ${state.coords.x}, Z ${state.coords.z}`;
  els.pixelInfo.textContent = `Image pixel ${px}, ${py} • ${Math.round(state.point.u * 1000) / 10}% across, ${Math.round(state.point.v * 1000) / 10}% down`;
  saveState();
}
function pick(clientX, clientY) {
  if (!els.img.naturalWidth) return;
  const rect = imageRect();
  const u = (clientX - rect.left) / rect.width;
  const v = (clientY - rect.top) / rect.height;
  if (u < 0 || u > 1 || v < 0 || v > 1) return;
  state.point = { u, v };
  updateMarker();
}
function handleFile(file) {
  if (!file?.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => setImage(reader.result);
  reader.readAsDataURL(file);
}

for (const [key, el] of Object.entries(els.bounds)) {
  if (state[key] !== undefined) el.value = state[key];
  el.addEventListener('input', () => { state[key] = Number(el.value); saveState(); updateCoords(); });
}
if (state.image) setImage(state.image);
if (state.point) requestAnimationFrame(updateMarker);

els.file.addEventListener('change', event => handleFile(event.target.files[0]));
els.drop.addEventListener('dragover', event => { event.preventDefault(); els.drop.classList.add('hover'); });
els.drop.addEventListener('drop', event => { event.preventDefault(); handleFile(event.dataTransfer.files[0]); });
els.shell.addEventListener('click', event => pick(event.clientX, event.clientY));
addEventListener('resize', updateMarker);
els.copy.addEventListener('click', async () => {
  if (!state.coords) return;
  await navigator.clipboard.writeText(`${state.coords.x}, ${state.coords.z}`);
  els.copy.textContent = 'Copied';
  setTimeout(() => els.copy.textContent = 'Copy coords', 900);
});
els.clear.addEventListener('click', () => { delete state.point; delete state.coords; els.marker.classList.remove('visible'); updateCoords(); saveState(); });
els.reset.addEventListener('click', () => { localStorage.removeItem(storeKey); location.reload(); });
