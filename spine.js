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

  const body = new THREE.Mesh(bodyGeo, boneMat); body.scale.set(1, height, 1);
  const top = new THREE.Mesh(capGeo, boneMat); top.rotation.x = -Math.PI / 2; top.position.y = height / 2; top.scale.set(.96, .82, 1);
  const bot = top.clone(); bot.rotation.x = Math.PI / 2; bot.position.y = -height / 2;
  v.add(body, top, bot);

  // posterior arch (behind body = -z)
  const arch = new THREE.Mesh(archGeo, boneMat);
  arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI * -0.1 + Math.PI; arch.position.set(0, 0, -0.62);
  v.add(arch);
  // spinous process pointing back & down
  const sp = new THREE.Mesh(spinousGeo, boneMat);
  sp.rotation.x = -Math.PI / 2 - (i < 7 ? 0.3 : i < 19 ? 0.7 : 0.25);
  sp.position.set(0, -0.12, -1.2);
  v.add(sp);
  // transverse processes
  [-1, 1].forEach(side => {
    const tp = new THREE.Mesh(transGeo, boneMat);
    tp.rotation.z = Math.PI / 2 + side * 0.25; tp.position.set(side * 0.62, 0.02, -0.62);
    v.add(tp);
  });

  // wireframe ghost (x-ray mode)
  const ghost = new THREE.Mesh(bodyGeo, wireMat); ghost.scale.set(1.04, height * 1.04, 1.04); v.add(ghost);

  v.scale.setScalar(s);
  v.position.copy(p);
  // align local Y with tangent (pointing down the spine)
  v.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tan.clone().normalize());
  v.userData = { base: v.position.clone(), i };
  spine.add(v); vertebrae.push(v);

  // disc below (except last)
  if (i < N - 1) {
    const t2 = (i + 1) / (N + 1.6);
    const dp = curve.getPointAt(t2);
    const d = new THREE.Mesh(discGeo, discMat);
    d.position.copy(dp);
    d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t2));
    d.scale.setScalar(s * 1.02);
    d.userData = { base: d.position.clone(), i };
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
  const sac = new THREE.Mesh(g, boneMat);
  sac.position.copy(p).add(new THREE.Vector3(0, -0.3, -0.15));
  sac.rotation.x = 0.35;
  sac.scale.set(0.62, 0.62, 0.5);
  sac.userData = { base: sac.position.clone(), i: N };
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

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let xray = 0, visible = true;
const io = new IntersectionObserver(() => {}, {});
function frame() {
  requestAnimationFrame(frame);
  const op = parseFloat(getComputedStyle(canvas).opacity);
  if (op < 0.01) { visible = false; return; }
  visible = true;
  const t = clock.getElapsedTime();
  const st = window.__spine || { progress: 0, xray: 0 };
  const p = st.progress;

  mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

  // scroll choreography: rotate, drift left, tilt
  root.position.x = layout.x + THREE.MathUtils.smoothstep(p, 0.1, 0.9) * 0.8;
  root.position.y = Math.sin(t * 0.6) * 0.08 + p * 0.6;
  root.scale.setScalar(layout.scale * (1 + p * 0.12));
  spine.rotation.y = t * 0.22 + p * Math.PI * 1.6 + mouse.x * 0.5;
  spine.rotation.x = mouse.y * 0.18 + p * 0.25;
  spine.rotation.z = Math.sin(t * 0.4) * 0.03 - 0.05;

  // "breathing" separation of segments
  const spread = 0.06 * Math.sin(t * 1.2) + p * 0.35;
  vertebrae.forEach(m => {
    const b = m.userData.base; const k = (m.userData.i - N / 2) / N;
    m.position.set(b.x, b.y + k * spread * 2, b.z);
  });

  // x-ray toggle (contact section) + mid-scroll ghosting
  const targetX = st.xray;
  xray += (targetX - xray) * 0.06;
  wireMat.opacity = xray * 0.55;
  boneMat.opacity = 1 - xray * 0.75; boneMat.transparent = xray > 0.01;

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
