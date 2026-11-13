/* ==========================================================
   Procedural 3D spine — Three.js
   24 vertebrae + sacrum on an S-curve, glowing discs,
   spinal cord with flowing "nerve signal" particles.
   ========================================================== */
import * as THREE from 'three';

const canvas = document.getElementById('spine');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 860 ? 1.5 : 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x07090c, 13, 24);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0, 17);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x0a0d12, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 6); scene.add(key);
const rim = new THREE.PointLight(0xff5b2e, 40, 20); rim.position.set(-4, 1, -3); scene.add(rim);
const rim2 = new THREE.PointLight(0x7cf0d4, 18, 18); rim2.position.set(4, -3, -2); scene.add(rim2);

/* ---------- materials ---------- */
const boneMat = new THREE.MeshPhysicalMaterial({ color: 0xe9e1cf, roughness: 0.48, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffd9c2) });
const bones = []; // every bone material (one per vertebra) — xray + glow act on all
const wireMat = new THREE.MeshBasicMaterial({ color: 0x7cf0d4, wireframe: true, transparent: true, opacity: 0 });
const discMat = new THREE.MeshStandardMaterial({ color: 0xff5b2e, emissive: 0xff3a10, emissiveIntensity: 0.9, roughness: 0.4, transparent: true, opacity: 0.92 });
const cordMat = new THREE.MeshStandardMaterial({ color: 0xffb08f, emissive: 0xff5b2e, emissiveIntensity: 1.4, transparent: true, opacity: 0.55 });

/* ---------- curve of the spine ---------- */
const N = 24; // C1–L5
const H = 7.4; // total height
// S-curve: cervical lordosis, thoracic kyphosis, lumbar lordosis (z = depth)
const zAt = t => 0.42 * Math.sin(t * Math.PI * 2.05 + 0.35) - 0.1 * t;
const yAt = t => H / 2 - t * H;
const pts = [];
for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(new THREE.Vector3(0, yAt(t), zAt(t))); }
const curve = new THREE.CatmullRomCurve3(pts);

/* ---------- vertebra geometry builder ---------- */
function vertebraGeometry() {
  // waisted vertebral body via lathe
  const prof = [];
  for (let i = 0; i <= 10; i++) {
    const v = i / 10, y = (v - 0.5);
    const r = 0.5 - 0.07 * Math.sin(v * Math.PI);
    prof.push(new THREE.Vector2(r, y));
  }
  const body = new THREE.LatheGeometry(prof, 32);
  body.scale(1, 1, 0.82);
  return body;
}
const bodyGeo = vertebraGeometry();
const capGeo = new THREE.CircleGeometry(0.5, 32);
const archGeo = new THREE.TorusGeometry(0.33, 0.085, 10, 28, Math.PI * 1.2);
const spinousGeo = new THREE.ConeGeometry(0.11, 0.85, 10);
const transGeo = new THREE.CapsuleGeometry(0.07, 0.5, 4, 10);
const discGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.12, 32);

const spine = new THREE.Group();
const vertebrae = [];
for (let i = 0; i < N; i++) {
  const t = (i + 0.5) / (N + 1.6);
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t);
  // size grows from cervical to lumbar
  const s = 0.36 + Math.pow(i / (N - 1), 1.15) * 0.42;
  const v = new THREE.Group();
  const height = (H / (N + 1.6)) * 0.62 / s;
  const vm = boneMat.clone(); bones.push(vm); // own material so each bone can glow alone

  const body = new THREE.Mesh(bodyGeo, vm); body.scale.set(1, height, 1);
  const top = new THREE.Mesh(capGeo, vm); top.rotation.x = -Math.PI / 2; top.position.y = height / 2; top.scale.set(.96, .82, 1);
  const bot = top.clone(); bot.rotation.x = Math.PI / 2; bot.position.y = -height / 2;
  v.add(body, top, bot);

  // posterior arch (behind body = -z)
  const arch = new THREE.Mesh(archGeo, vm);
  arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI * -0.1 + Math.PI; arch.position.set(0, 0, -0.62);
  v.add(arch);
  // spinous process pointing back & down
  const sp = new THREE.Mesh(spinousGeo, vm);
  sp.rotation.x = -Math.PI / 2 - (i < 7 ? 0.3 : i < 19 ? 0.7 : 0.25);
  sp.position.set(0, -0.12, -1.2);
  v.add(sp);
  // transverse processes
  [-1, 1].forEach(side => {
    const tp = new THREE.Mesh(transGeo, vm);
    tp.rotation.z = Math.PI / 2 + side * 0.25; tp.position.set(side * 0.62, 0.02, -0.62);
    v.add(tp);
  });

  // wireframe ghost (x-ray mode)
  const ghost = new THREE.Mesh(bodyGeo, wireMat); ghost.scale.set(1.04, height * 1.04, 1.04); v.add(ghost);

  v.scale.setScalar(s);
  v.position.copy(p);
  // align local Y with tangent (pointing down the spine)
  v.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tan.clone().normalize());
  v.userData = { base: v.position.clone(), i, ky: (i - N / 2) / N, q0: v.quaternion.clone(), mat: vm, glow: 0 };
  spine.add(v); vertebrae.push(v);

  // disc below (except last)
  if (i < N - 1) {
    const t2 = (i + 1) / (N + 1.6);
    const dp = curve.getPointAt(t2);
    const d = new THREE.Mesh(discGeo, discMat);
    d.position.copy(dp);
    d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t2));
    d.scale.setScalar(s * 1.02);
    d.userData = { base: d.position.clone(), i, disc: true, ky: (i + 0.5 - N / 2) / N };
    spine.add(d); vertebrae.push(d);
  }
}

/* ---------- sacrum ---------- */
{
  const t = 0.93, p = curve.getPointAt(t);
  const shape = new THREE.Shape();
  shape.moveTo(-0.75, 0); shape.quadraticCurveTo(-0.7, -0.9, 0, -1.45); shape.quadraticCurveTo(0.7, -0.9, 0.75, 0); shape.quadraticCurveTo(0, 0.22, -0.75, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 4, curveSegments: 24 });
  g.center();
  const sacMat = boneMat.clone(); bones.push(sacMat);
  const sac = new THREE.Mesh(g, sacMat);
  sac.position.copy(p).add(new THREE.Vector3(0, -0.3, -0.15));
  sac.rotation.x = 0.35;
  sac.scale.set(0.62, 0.62, 0.5);
  sac.userData = { base: sac.position.clone(), i: N, ky: 0.5, q0: sac.quaternion.clone(), mat: sacMat, glow: 0 };
  spine.add(sac); vertebrae.push(sac);
}

/* ---------- spinal cord ---------- */
const cordPts = [];
for (let i = 0; i <= 40; i++) {
  const t = i / 40 * 0.9; const p = curve.getPointAt(t);
  cordPts.push(new THREE.Vector3(p.x, p.y, p.z - 0.32 * (0.36 + t * 0.42) / 0.36 * 0.6 - 0.16));
}
cordPts.unshift(cordPts[0].clone().add(new THREE.Vector3(0, 0.25, 0.02)));
const cordCurve = new THREE.CatmullRomCurve3(cordPts);
const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 160, 0.06, 10, false), cordMat);
spine.add(cord);

/* ---------- nerve signal particles ---------- */
const P = 70;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P * 3);
const pOff = new Float32Array(P);
for (let i = 0; i < P; i++) pOff[i] = Math.random();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const dotTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,170,130,.9)'); g.addColorStop(1, 'rgba(255,91,46,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const pMat = new THREE.PointsMaterial({ size: 0.32, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const particles = new THREE.Points(pGeo, pMat);
spine.add(particles);

/* ---------- ambient dust ---------- */
const D = 380;
const dGeo = new THREE.BufferGeometry();
const dPos = new Float32Array(D * 3);
for (let i = 0; i < D; i++) { dPos[i * 3] = (Math.random() - .5) * 18; dPos[i * 3 + 1] = (Math.random() - .5) * 12; dPos[i * 3 + 2] = (Math.random() - .5) * 8 - 2; }
dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.035, color: 0xede6d6, transparent: true, opacity: 0.45, depthWrite: false }));
scene.add(dust);

/* ---------- orbit ring (diagram feel) ---------- */
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: 0xff5b2e, transparent: true, opacity: 0.45 }));
ring.rotation.x = Math.PI / 2.15;
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.004, 6, 160), new THREE.MeshBasicMaterial({ color: 0x7cf0d4, transparent: true, opacity: 0.25 }));
ring2.rotation.x = Math.PI / 1.8; ring2.rotation.y = 0.3;
spine.add(ring, ring2);

const root = new THREE.Group();
root.add(spine);
scene.add(root);

/* ---------- sizing ---------- */
let layout = { x: 2.6, scale: 1 };
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const mobile = w < 860;
  layout = mobile ? { x: 1.2, scale: 0.8 } : { x: Math.min(4.6, (w / h) * 2.45), scale: 1 };
}
addEventListener('resize', resize); resize();

/* ---------- input ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = (e.clientY / innerHeight - 0.5) * 2; });

/* ---------- interaction: hover glow, hold = explode, drag = rotate ---------- */
const REG = [
  { name: 'Cervical', where: 'neck', col: new THREE.Color(0x7cf0d4), note: 'Carries the head and drives neck pain, stiffness and headaches.' },
  { name: 'Thoracic', where: 'mid-back', col: new THREE.Color(0xffc46b), note: 'Anchors the ribs. Least mobile, so it stiffens with desk posture.' },
  { name: 'Lumbar', where: 'low back', col: new THREE.Color(0xff5b2e), note: 'Takes the most load. The most common site of back pain.' },
  { name: 'Sacral', where: 'pelvis', col: new THREE.Color(0xb58cff), note: 'The base of the spine, locking into the pelvis.' }
];
const regOf = i => i < 7 ? 0 : i < 19 ? 1 : i < 24 ? 2 : 3;
const nameOf = i => i < 7 ? 'C' + (i + 1) : i < 19 ? 'T' + (i - 6) : i < 24 ? 'L' + (i - 18) : 'S';
const NERVE = new THREE.Color(0xff5b2e);
const isTouchDev = matchMedia('(hover: none)').matches;

// DOM helpers (labels while exploded + tooltip)
const labelsBox = document.createElement('div'); labelsBox.className = 'spine-labels'; document.body.appendChild(labelsBox);
const labelEls = [];
for (let i = 0; i <= N; i++) {
  const el = document.createElement('span'); el.className = 'spine-label';
  const r = REG[regOf(i)];
  const first = i === 0 || i === 7 || i === 19 || i === N;
  el.innerHTML = nameOf(i) + (first ? '<em>' + r.name + '</em>' : '');
  el.style.setProperty('--c', '#' + r.col.getHexString());
  labelsBox.appendChild(el); labelEls.push(el);
}
const tip = document.createElement('div'); tip.className = 'spine-tip'; document.body.appendChild(tip);
let tipIdx = -2;

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const ptr = { x: 0, y: 0, has: false, blocked: false, down: false, dragging: false, lastX: 0, startX: 0, startY: 0, timer: 0 };
let hoverIdx = -1, explode = 0, explodeT = 0, expV = 0, dragYaw = 0, dragV = 0, yawAuto = 0, used = false;
const INTERACTIVE = 'a,button,input,textarea,select,.mobile-menu,.nav,.side-nav,[data-drag],[data-magnetic]';
const canvasOn = () => parseFloat(getComputedStyle(canvas).opacity) > 0.3 && !document.body.classList.contains('menu-open');

function pickIndex() {
  ndc.set(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(vertebrae, true);
  for (const h of hits) { let o = h.object; while (o && o.userData.i === undefined) o = o.parent; if (o) return o.userData.i; }
  return -1;
}
const cursorEl = document.querySelector('.cursor'), cursorLbl = document.querySelector('.cursor-label');
let cursorOwned = false;
function setCursor(on, text) {
  if (!cursorEl || isTouchDev) return;
  if (on) { cursorLbl.textContent = text; cursorEl.classList.add('is-label'); cursorOwned = true; }
  else if (cursorOwned) { cursorEl.classList.remove('is-label'); cursorOwned = false; }
}

function release() {
  clearTimeout(ptr.timer);
  if (ptr.down) { ptr.down = false; ptr.dragging = false; explodeT = 0; document.body.classList.remove('spine-hold'); }
}
addEventListener('pointermove', e => {
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
  ptr.blocked = !!(e.target.closest && e.target.closest(INTERACTIVE));
  if (ptr.down && e.pointerType === 'mouse') {
    const dx = e.clientX - ptr.lastX; ptr.lastX = e.clientX;
    if (!ptr.dragging && Math.hypot(e.clientX - ptr.startX, e.clientY - ptr.startY) > 7) { ptr.dragging = true; clearTimeout(ptr.timer); }
    if (ptr.dragging) { dragV = dx * 0.012; dragYaw += dragV; }
  }
});
addEventListener('pointerdown', e => {
  if (e.button > 0 || !canvasOn() || (e.target.closest && e.target.closest(INTERACTIVE))) return;
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
  if (pickIndex() < 0) return;
  ptr.down = true; ptr.dragging = false; ptr.lastX = ptr.startX = e.clientX; ptr.startY = e.clientY; dragV = 0;
  document.body.classList.add('spine-hold');
  clearTimeout(ptr.timer);
  ptr.timer = setTimeout(() => { if (ptr.down) { explodeT = 1; if (!used) { used = true; document.body.classList.add('spine-used'); } } }, e.pointerType === 'mouse' ? 170 : 380);
});
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('blur', release);
document.addEventListener('pointerleave', () => { ptr.has = false; });
addEventListener('contextmenu', e => { if (ptr.down) e.preventDefault(); });

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let xray = 0, visible = true, frameN = 0, lastMs = performance.now();
const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), AXY = new THREE.Vector3(0, 1, 0);
const io = new IntersectionObserver(() => {}, {});
function frame() {
  requestAnimationFrame(frame);
  const op = parseFloat(getComputedStyle(canvas).opacity);
  if (op < 0.01) { visible = false; return; }
  visible = true;
  const t = clock.getElapsedTime();
  const nowMs = performance.now(); const dt = Math.min((nowMs - lastMs) / 1000, 0.05); lastMs = nowMs;
  const st =window.__spine || { progress: 0, xray: 0 };
  const p = st.progress;

  mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

  // scroll choreography: rotate, drift left, tilt
  root.position.x = (layout.x + THREE.MathUtils.smoothstep(p, 0.1, 0.9) * 0.8) * (innerWidth < 860 ? 1 - Math.min(Math.max(explode, 0), 1) * 0.65 : 1);
  root.position.y = Math.sin(t * 0.6) * 0.08 + p * 0.6;
  // spring for the explode (small overshoot = elastic snap-back)
  expV += (explodeT - explode) * 0.1; expV *= 0.8; explode += expV;
  const ex = Math.max(explode, -0.08);
  root.scale.setScalar(layout.scale * (1 + p * 0.12) * (1 - Math.min(ex, 1.15) * 0.36));
  yawAuto += dt * 0.22 * (1 - Math.min(Math.max(ex, 0), 1) * 0.9);
  if (!ptr.dragging) { dragYaw += dragV; dragV *= 0.94; }
  spine.rotation.y = yawAuto + dragYaw + p * Math.PI * 1.6 + mouse.x * 0.5 * (1 - Math.min(Math.max(ex, 0), 1));
  spine.rotation.x = mouse.y * 0.18 + p * 0.25;
  spine.rotation.z = Math.sin(t * 0.4) * 0.03 - 0.05;

  // "breathing" separation of segments
  const spread = 0.06 * Math.sin(t * 1.2) + p * 0.35;
  const fx = i => Math.sin(i * 2.3) * 0.32;
  const onNow = canvasOn();
  if (frameN++ % 3 === 0) {
    if (onNow && ptr.has && !ptr.blocked && !ptr.dragging) hoverIdx = pickIndex();
    else if (!ptr.down) hoverIdx = -1;
  }
  vertebrae.forEach(m => {
    const u = m.userData, b = u.base, k = u.ky;
    const xo = u.disc ? (fx(u.i) + fx(u.i + 1)) * 0.5 : fx(u.i);
    m.position.set(b.x + xo * ex, b.y + (u.i - N / 2) / N * spread * 2 - k * ex * 3.3, b.z);
    if (u.q0) {
      m.quaternion.copy(u.q0).multiply(tmpQ.setFromAxisAngle(AXY, Math.sin(u.i * 1.7) * 0.55 * ex));
      u.glow += ((hoverIdx === u.i ? 1 : 0) - u.glow) * 0.18;
      const g = u.glow * 0.8 + Math.max(ex, 0) * 0.55;
      u.mat.emissive.copy(ex > 0.04 ? REG[regOf(u.i)].col : NERVE);
      u.mat.emissiveIntensity = g;
    }
  });

  // labels follow each bone while exploded
  const showL = ex > 0.25;
  labelsBox.classList.toggle("on", showL); document.body.classList.toggle("spine-exploded", showL);
  if (showL) {
    const a = Math.min(1, (ex - 0.25) * 2.2);
    labelsBox.style.opacity = a;
    const w = innerWidth / 2, h2 = innerHeight / 2;
    vertebrae.forEach(m => {
      const u = m.userData; if (u.disc) return;
      m.getWorldPosition(tmpV); tmpV.project(camera);
      labelEls[u.i].style.transform = `translate(${tmpV.x * w + w + 46 * layout.scale}px,${-tmpV.y * h2 + h2}px) translateY(-50%)`;
    });
  }

  // tooltip (mouse only)
  const tIdx = (!isTouchDev && hoverIdx >= 0 && !ptr.dragging && !ptr.down) ? hoverIdx : -1;
  if (tIdx !== tipIdx) {
    tipIdx = tIdx;
    if (tIdx >= 0) {
      const r = REG[regOf(tIdx)];
      tip.innerHTML = `<b style="color:#${r.col.getHexString()}">${nameOf(tIdx)}</b><i>${r.name} · ${r.where}</i><p>${tIdx === 22 || tIdx === 23 ? 'L4–L5 is where most disc problems begin. ' : ''}${r.note}</p>`;
    }
    tip.classList.toggle('on', tIdx >= 0);
  }
  if (tIdx >= 0) tip.style.transform = `translate(${Math.min(ptr.x + 22, innerWidth - 250)}px,${Math.min(ptr.y + 18, innerHeight - 130)}px)`;
  setCursor((hoverIdx >= 0 && !ptr.blocked && !ptr.dragging) || ptr.down, ptr.dragging ? 'Drag' : explodeT ? 'Release' : 'Hold');

  // x-ray toggle (contact section) + mid-scroll ghosting
  const targetX = st.xray;
  xray += (targetX - xray) * 0.06;
  wireMat.opacity = xray * 0.55;
  bones.forEach(m => { m.opacity = 1 - xray * 0.75; m.transparent = xray > 0.01; });

  // particles along the cord, travelling downward
  const arr = pGeo.attributes.position.array;
  for (let i = 0; i < P; i++) {
    const u = (pOff[i] + t * 0.12) % 1;
    const q = cordCurve.getPointAt(u);
    const j = Math.sin(i * 12.9 + t * 3) * 0.04;
    arr[i * 3] = q.x + j; arr[i * 3 + 1] = q.y; arr[i * 3 + 2] = q.z + j;
  }
  pGeo.attributes.position.needsUpdate = true;
  discMat.emissiveIntensity = 0.7 + Math.sin(t * 2.4) * 0.3;
  cordMat.emissiveIntensity = 1.2 + Math.sin(t * 3.1) * 0.4;

  ring.rotation.z = t * 0.25; ring2.rotation.z = -t * 0.18;
  dust.rotation.y = t * 0.015 + mouse.x * 0.05;
  rim.position.x = -4 + Math.sin(t * .5) * 1.5;

  renderer.render(scene, camera);
}
frame();
