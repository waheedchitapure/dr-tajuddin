/* ==========================================================
   Dr. Tajuddin Chitapure — interactions
   GSAP + ScrollTrigger + Lenis
   ========================================================== */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const isTouch = matchMedia('(hover: none)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('is-loading');
$('#yr').textContent = new Date().getFullYear();

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
const burger = $('.burger');
const setMenu = open => {
  document.documentElement.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  $('.mobile-menu').setAttribute('aria-hidden', !open);
  open ? lenis.stop() : lenis.start();
};
burger.addEventListener('click', () => setMenu(!document.documentElement.classList.contains('menu-open')));
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  if (document.documentElement.classList.contains('menu-open')) setMenu(false);
  lenis.scrollTo(t, { offset: 0, duration: 1.6 });
}));

/* ---------- split words ---------- */
$$('.split').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
});
$$('[data-words]').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="word">${w}</span>`).join(' ');
});

/* ---------- loader ---------- */
const counter = { v: 0 };
const imgs = $$('img').filter(i => !i.loading || i.loading !== 'lazy');
let loaded = 0;
const total = Math.max(imgs.length, 1);
const bump = () => { loaded++; };
imgs.forEach(i => (i.complete ? bump() : (i.onload = i.onerror = bump)));
gsap.to(counter, {
  v: 100, duration: 2.2, ease: 'power2.inOut',
  onUpdate() {
    const cap = 40 + (loaded / total) * 60;
    if ($('#loaderCount')) $('#loaderCount').textContent = Math.round(Math.min(counter.v, cap));
  },
  onComplete: finishLoad
});
function finishLoad() {
  if (!$('#loader')) return;
  $('#loaderCount').textContent = '100';
  const tl = gsap.timeline({ onComplete: () => { $('#loader').remove(); document.body.classList.remove('is-loading'); lenis.start(); ScrollTrigger.refresh(); } });
  tl.to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
    .add(heroIntro(), '-=0.45');
}
gsap.set('#loader', { clipPath: 'inset(0 0 0% 0)' });

function heroIntro() {
  const tl = gsap.timeline();
  tl.from('.hero-title .w > span', { yPercent: 110, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.08 })
    .from('.hero-title sup', { opacity: 0, duration: .6 }, '-=.6')
    .from('.hero-meta > span', { y: 20, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out' }, '-=1')
    .from('.hero .reveal-up', { y: 30, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out' }, '-=.9')
    .from('.nav', { y: -40, opacity: 0, duration: .8, ease: 'power3.out' }, '-=.9')
    .from('#spine', { opacity: 0, duration: 1.6 }, 0);
  return tl;
}

/* ---------- generic reveals ---------- */
$$('.split').forEach(el => {
  if (el.closest('.hero')) return;
  $$('.w > span', el).forEach(w => { w.innerHTML = [...w.textContent].map(ch => `<span class="c">${ch}</span>`).join(''); });
  gsap.from($$('.c', el), {
    yPercent: 120, rotate: 6, duration: .9, ease: 'expo.out', stagger: { each: .018, from: 'start' },
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});
$$('.reveal-up').forEach(el => {
  if (el.closest('.hero')) return;
  gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
});
$$('.section-label').forEach(el => gsap.from(el, { opacity: 0, x: -20, duration: .8, scrollTrigger: { trigger: el, start: 'top 92%' } }));

/* ---------- hero parallax ---------- */
gsap.to('.hero-title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- 3D canvas visibility + progress ---------- */
window.__spine = { progress: 0, xray: 0, lab: 0 };
window.__lab = { slouch: 0, curve: 0, pain: 0 };
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom top',
  onUpdate: s => { window.__spine.progress = s.progress; }
});
// fade the 3D spine out before the manifesto text so it never sits behind copy
gsap.to('#spine', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 35%', scrub: true } });
gsap.fromTo('#spine', { opacity: 0 }, { opacity: 1, immediateRender: false, ease: 'none', scrollTrigger: { trigger: '.lab', start: 'top 80%', end: 'top 40%', scrub: true } });
gsap.fromTo('#spine', { opacity: 1 }, { opacity: 0, immediateRender: false, ease: 'none', scrollTrigger: { trigger: '.expertise', start: 'top 90%', end: 'top 55%', scrub: true } });
ScrollTrigger.create({ trigger: '.lab', start: 'top 60%', end: 'bottom 40%', onToggle: s => { window.__spine.lab = s.isActive ? 1 : 0; } });
gsap.fromTo('#spine', { opacity: 0 }, { opacity: .35, immediateRender: false, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 80%', end: 'top 20%', scrub: true } });
ScrollTrigger.create({ trigger: '.contact', start: 'top 80%', onToggle: s => { window.__spine.xray = s.isActive ? 1 : 0; } });

/* ---------- manifesto word scrub ---------- */
gsap.to('.manifesto .word', {
  opacity: 1, stagger: .05, ease: 'none',
  scrollTrigger: { trigger: '.manifesto', start: 'top 80%', end: 'bottom 45%', scrub: true }
});

/* ---------- portrait ---------- */
gsap.to('.portrait-frame', { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.portrait', start: 'top 80%' } });
gsap.fromTo('.portrait-frame img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- counters ---------- */
$$('[data-count]').forEach(el => {
  const end = +el.dataset.count, suf = el.dataset.suffix || '';
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(end >= 10 ? 1 : 2, '0') + suf) })
  });
});

/* ==========================================================
   BODY MAP
   ========================================================== */
const conditions = {
  neck: { region: 'Cervical spine', title: 'Tech-Neck', img: 'post-techneck-1.jpg',
    desc: 'Hours of forward-head posture overload the neck. Every inch the head drifts forward multiplies the load on the cervical spine.',
    clues: ['Neck pain & stiffness', 'Tension headaches', 'Posture-related fatigue'],
    rehab: ['Screen at eye level', '1-minute movement break every 30 min', 'Deep neck flexor & upper-back strengthening'] },
  shoulder: { region: 'Glenohumeral joint', title: 'Rotator Cuff', img: 'post-rotator-1.jpg',
    desc: 'Rarely just trauma — usually tendon overload, poor scapular mechanics and repetitive overhead demand. A load, control and capacity issue.',
    clues: ['Painful arc', 'Weakness in rotation', 'Difficulty with functional reaching'],
    rehab: ['Symptom modulation', 'Restore mobility', 'Strengthen cuff & scapular stabilisers', 'Long-term load management'] },
  elbow: { region: 'Lateral epicondyle', title: 'Tennis Elbow', img: 'post-tennis-1.jpg',
    desc: 'A tendon overload condition driven by repetitive gripping, poor biomechanics and inadequate recovery — not just pain.',
    clues: ['Lateral elbow pain', 'Pain on gripping', 'Positive resisted wrist extension'],
    rehab: ['Progressive (eccentric) loading', 'Mobility & motor control', 'Ergonomic modification', 'Patient education'] },
  wrist: { region: 'Carpal tunnel', title: 'Carpal Tunnel', img: 'post-carpal-1.jpg',
    desc: 'Median nerve compression, often driven by repetitive wrist use, sustained flexion and poor ergonomics. Early recognition changes the course.',
    clues: ['Night-time symptoms', 'Tingling from thumb to ring finger', 'Reduced grip strength'],
    rehab: ['Splinting & symptom modulation', 'Neural mobility & carpal mechanics', 'Intrinsic hand strengthening', 'Ergonomic correction'] },
  back: { region: 'Lumbar spine', title: 'Chronic Back Pain', img: 'post-pain-1.jpg',
    desc: 'In chronic pain the nervous system can stay on high alert even when tissues are structurally safe. Pain neuroscience education recalibrates that threat.',
    clues: ['Pain beyond normal healing time', 'Fear of movement', 'Pain linked to stress, sleep & beliefs'],
    rehab: ['Pain neuroscience education', 'Graded exposure & loading', 'Manual therapy', 'Sleep & stress coaching'] },
  knee: { region: 'Knee joint', title: 'Arthritis Care', img: 'post-ageing-1.jpg',
    desc: 'Arthritis is more than joint wear. Pain pathways, central sensitisation and lost confidence must be treated alongside the joint.',
    clues: ['Pain & morning stiffness', 'Reduced function & confidence', 'Sensitised pain response'],
    rehab: ['Biopsychosocial assessment', 'Strength & function restoration', 'Activity pacing', 'Self-management education'] },
  foot: { region: 'Plantar fascia', title: 'Plantar Fasciitis', img: 'post-plantar-1.jpg',
    desc: 'Not simply inflammation — fascia overload, micro-tears and poor load tolerance. Rest alone rarely fixes it.',
    clues: ['First-step morning pain', 'Limited ankle dorsiflexion', 'Medial heel tenderness'],
    rehab: ['Load modification', 'Calf & plantar fascia mobility', 'Intrinsic foot strengthening', 'Footwear & orthotic support'] }
};
const order = Object.keys(conditions);
let current = 0;

// vertebrae stack
(() => {
  const g = $('.skeleton .vertebrae');
  const n = 24, top = 148, bottom = 396;
  let html = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = top + t * (bottom - top);
    const w = 9 + t * 14, h = 6 + t * 3;
    html += `<rect x="${200 - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2"/>`;
  }
  g.innerHTML = html;
})();

// draw the skeleton in
const bonePaths = $$('.skeleton .bones path');
bonePaths.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
const skelTl = gsap.timeline({ scrollTrigger: { trigger: '.bodymap', start: 'top 75%' } });
skelTl.to(bonePaths, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: .03 })
  .from('.skeleton .vertebrae rect', { scaleX: 0, transformOrigin: 'center', transformBox: 'fill-box', stagger: .025, duration: .5 }, .3)
  .from('.skeleton .joints circle', { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', stagger: .04, duration: .5, ease: 'back.out(3)' }, .8)
  .from('.hs', { opacity: 0, stagger: .08, duration: .5 }, 1.2)
  .from('.condition-panel', { y: 60, opacity: 0, duration: 1, ease: 'power3.out' }, .2);

function showCondition(i, dir = 1) {
  current = (i + order.length) % order.length;
  const id = order[current], c = conditions[id];
  $$('.hs').forEach(h => h.classList.toggle('is-active', h.dataset.id === id));
  const panel = $('.condition-panel');
  const parts = [$('.cp-title', panel), $('.cp-desc', panel), $('.cp-cols', panel), $('.cp-img', panel)];
  gsap.timeline()
    .to(parts, { opacity: 0, y: -16 * dir, duration: .25, stagger: .03, ease: 'power2.in' })
    .add(() => {
      $('.cp-index', panel).textContent = `${String(current + 1).padStart(2, '0')} / ${String(order.length).padStart(2, '0')}`;
      $('.cp-region', panel).textContent = c.region;
      $('.cp-title', panel).textContent = c.title;
      $('.cp-desc', panel).textContent = c.desc;
      $('.cp-clues', panel).innerHTML = c.clues.map(x => `<li>${x}</li>`).join('');
      $('.cp-rehab', panel).innerHTML = c.rehab.map(x => `<li>${x}</li>`).join('');
      $('.cp-img img', panel).src = 'assets/img/' + c.img;
    })
    .fromTo(parts, { opacity: 0, y: 20 * dir }, { opacity: 1, y: 0, duration: .55, stagger: .06, ease: 'power3.out' });
}
$$('.hs').forEach(h => h.addEventListener('click', () => {
  const i = order.indexOf(h.dataset.id);
  showCondition(i, i >= current ? 1 : -1);
  stopAuto();
}));
$$('.cp-btn').forEach(b => b.addEventListener('click', () => { showCondition(current + +b.dataset.dir, +b.dataset.dir); stopAuto(); }));
showCondition(0);
/* ---- range of motion on the active joint ---- */
const ROM = {
  neck:{n:'Cervical rotation',max:80,a0:-90,d:1}, shoulder:{n:'Shoulder abduction',max:180,a0:90,d:-1},
  elbow:{n:'Elbow flexion',max:145,a0:90,d:1}, wrist:{n:'Wrist flexion',max:80,a0:90,d:1},
  back:{n:'Lumbar flexion',max:60,a0:-90,d:1}, knee:{n:'Knee flexion',max:135,a0:90,d:-1},
  foot:{n:'Ankle dorsiflexion',max:20,a0:0,d:-1}
};
let romTw = null;
const romO = { v: 0 };
function setRom(id) {
  const r = ROM[id]; if (!r) return;
  const hs = $(`.hs[data-id="${id}"]`);
  const m = /translate\(([\d.]+)\s+([\d.]+)\)/.exec(hs.getAttribute('transform'));
  const cx = +m[1], cy = +m[2], R = 38, rad = a => a * Math.PI / 180;
  const pt = (a, rr) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const arc = $('.rom-arc'), line = $('.rom-line'), dot = $('.rom-dot'), txt = $('.rom-txt');
  const panel = $('.condition-panel');
  $('.cp-rom-name', panel).textContent = r.n;
  $('.cp-rom-val i', panel).textContent = r.max;
  const val = $('.cp-rom-val b', panel), bar = $('.cp-rom-bar span', panel);
  if (romTw) romTw.kill();
  romO.v = 0;
  const draw = () => {
    const v = romO.v, a1 = r.a0 + r.d * v * r.max;
    const [x0, y0] = pt(r.a0, R), [x1, y1] = pt(a1, R), [lx, ly] = pt(a1, R + 10);
    arc.setAttribute('d', `M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${v * r.max > 180 ? 1 : 0} ${r.d > 0 ? 1 : 0} ${x1} ${y1} Z`);
    line.setAttribute('x1', cx); line.setAttribute('y1', cy); line.setAttribute('x2', lx); line.setAttribute('y2', ly);
    dot.setAttribute('cx', lx); dot.setAttribute('cy', ly);
    const t = pt(r.a0 + r.d * v * r.max * .5, R + 22);
    txt.setAttribute('x', t[0]); txt.setAttribute('y', t[1] + 4); txt.textContent = Math.round(v * r.max) + '\u00b0';
    val.textContent = Math.round(v * r.max); bar.style.width = (v * 100) + '%';
  };
  draw();
  romTw = gsap.to(romO, { v: 1, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: .25, onUpdate: draw });
}
$$('.hs').forEach(h => h.addEventListener('click', () => setRom(h.dataset.id)));
$$('.cp-btn').forEach(b => b.addEventListener('click', () => setRom(order[current])));
setRom(order[0]);
let autoTimer = null;
const stopAuto = () => { clearInterval(autoTimer); autoTimer = null; };
ScrollTrigger.create({
  trigger: '.bodymap', start: 'top 60%', end: 'bottom 20%',
  onEnter: () => { if (!autoTimer && autoTimer !== false) autoTimer = setInterval(() => { showCondition(current + 1); setRom(order[current]); }, 5200); },
  onLeave: stopAuto, onLeaveBack: stopAuto
});
$('.bodymap').addEventListener('pointerdown', () => { stopAuto(); autoTimer = false; }, { once: true });

/* ==========================================================
   PAIN PATHWAY (pinned, scrubbed)
   ========================================================== */
(() => {
  const svg = $('.pw-svg');
  const mainPath = $('.pw-path', svg), outPath = $('.pw-out-path', svg), pulse = $('.pw-pulse', svg);
  const L1 = mainPath.getTotalLength(), L2 = outPath.getTotalLength();
  [mainPath, outPath].forEach((p, k) => { const l = k ? L2 : L1; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  // center label backdrop for BPS
  const ns = 'http://www.w3.org/2000/svg';
  const cbg = document.createElementNS(ns, 'circle');
  cbg.setAttribute('class', 'center-bg'); cbg.setAttribute('cx', 300); cbg.setAttribute('cy', 300); cbg.setAttribute('r', 54);
  $('.bps', svg).insertBefore(cbg, $('.bps .center', svg));

  const place = (path, len, t) => { const pt = path.getPointAtLength(len * t); pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y); };
  place(mainPath, L1, 0);
  const steps = $$('.pstep');
  const setStep = i => steps.forEach((s, k) => s.classList.toggle('is-active', k === i));

  gsap.set('.pw-brain, .pw-tags .tag, .pw-output, .bps', { opacity: 0 });
  gsap.set('.pw-brain', { scale: .8, transformOrigin: '50% 50%', transformBox: 'fill-box' });
  gsap.set('.bps .c, .bps text', { transformOrigin: '50% 50%', transformBox: 'fill-box' });
  gsap.set('.bps .center, .center-bg', { scale: 0 });

  const p1 = { t: 0 }, p2 = { t: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.add(() => $('.pw-node.n1').classList.add('lit'), 0)
    .to(mainPath, { strokeDashoffset: L1 * .45, duration: 1 }, 0)
    .to(p1, { t: .55, duration: 1, onUpdate: () => place(mainPath, L1, p1.t) }, 0)
    .add(() => $('.pw-node.n2').classList.toggle('lit', tl.progress() > .18), 1)
    .to(mainPath, { strokeDashoffset: 0, duration: 1 }, 1)
    .to(p1, { t: 1, duration: 1, onUpdate: () => place(mainPath, L1, p1.t) }, 1)
    .to('.pw-brain', { opacity: 1, scale: 1, duration: .6, ease: 'power2.out' }, 1.6)
    .to('.pw-tags .tag', { opacity: 1, duration: .4, stagger: .2 }, 2)
    .from('.pw-tags .tag', { y: 20, duration: .4, stagger: .2 }, 2)
    .to(outPath, { strokeDashoffset: 0, duration: 1 }, 3)
    .to(p2, { t: 1, duration: 1, onUpdate: () => place(outPath, L2, p2.t) }, 3)
    .to('.pw-output', { opacity: 1, duration: .4 }, 3.7)
    .from('.pw-output', { scale: .3, transformOrigin: '50% 50%', transformBox: 'fill-box', duration: .5, ease: 'back.out(2)' }, 3.7)
    // morph into Bio-Psycho-Social
    .to('.pw-node, .pw-brain, .pw-tags, .pw-output, .pw-path, .pw-path-bg, .pw-out-path, .pw-pulse', { opacity: 0, duration: .5 }, 4.6)
    .to('.bps', { opacity: 1, duration: .3 }, 4.8)
    .fromTo('.bps .c1, .bps .b1', { x: 0, y: 0 }, { x: -70, y: 50, duration: .8, ease: 'power2.out' }, 4.9)
    .fromTo('.bps .c2, .bps .b2', { x: 0, y: 0 }, { x: 70, y: 50, duration: .8, ease: 'power2.out' }, 4.9)
    .fromTo('.bps .c3, .bps .b3', { x: 0, y: 0 }, { x: 0, y: -70, duration: .8, ease: 'power2.out' }, 4.9)
    .to('.bps .b1', { x: -130, y: 100, duration: .4 }, 5.7)
    .to('.bps .b2', { x: 130, y: 100, duration: .4 }, 5.7)
    .to('.bps .b3', { y: -140, duration: .4 }, 5.7)
    .to('.bps .center, .center-bg', { scale: 1, duration: .5, ease: 'back.out(2)' }, 6)
    .to({}, { duration: .4 });

  const thresholds = [0, 1.05 / 6.4, 2 / 6.4, 3.2 / 6.4, 4.7 / 6.4];
  ScrollTrigger.create({
    trigger: '.pathway', start: 'top top', end: () => '+=' + innerHeight * 4,
    pin: '.pathway-pin', scrub: 1, animation: tl,
    onUpdate: s => {
      let k = 0; thresholds.forEach((th, i) => { if (s.progress >= th) k = i; });
      setStep(k);
      $('.pw-node.n2').classList.toggle('lit', s.progress > .2);
      gsap.set('.pathway-progress i', { scaleX: s.progress });
    }
  });
})();

/* ==========================================================
   JOURNEY — horizontal on desktop
   ========================================================== */
const mm = gsap.matchMedia();
mm.add('(min-width: 861px)', () => {
  const track = $('.journey-track');
  const dist = () => track.scrollWidth - innerWidth;
  const linePath = $('.journey-line path');
  const ll = linePath.getTotalLength();
  gsap.set(linePath, { strokeDasharray: ll, strokeDashoffset: ll });
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.to(track, { x: () => -dist() }, 0).to(linePath, { strokeDashoffset: 0 }, 0);
  ScrollTrigger.create({ trigger: '.journey', start: 'top top', end: () => '+=' + dist(), pin: '.journey-pin', scrub: 1, animation: tl, invalidateOnRefresh: true });
  $$('.jcard').forEach(c => gsap.from(c, { opacity: .25, scale: .94, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tl, start: 'left 95%', end: 'left 60%', scrub: true } }));
});
mm.add('(max-width: 860px)', () => {
  $$('.jcard').forEach(c => gsap.from(c, { y: 50, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
});

/* ==========================================================
   AWARDS
   ========================================================== */
gsap.fromTo('.award-hero-img img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.award-hero', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.award-hero-img', { clipPath: 'inset(0 100% 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.award-hero', start: 'top 75%' } });
gsap.from('.award', { y: 80, opacity: 0, rotateX: -20, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.award-grid', start: 'top 82%' } });
gsap.from('.research-strip > div', { y: 40, opacity: 0, stagger: .08, duration: .8, scrollTrigger: { trigger: '.research-strip', start: 'top 88%' } });
if (!isTouch) $$('[data-tilt]').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
    gsap.to(card, { rotateY: (x - .5) * 14, rotateX: (.5 - y) * 14, duration: .5, ease: 'power2.out' });
  });
  card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
});

/* ==========================================================
   SPEAKING — cursor-following image
   ========================================================== */
gsap.from('.talk', { y: 40, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.talks', start: 'top 85%' } });
if (!isTouch) {
  const hv = $('.hover-img'), hvImg = $('img', hv);
  const hx = gsap.quickTo(hv, 'x', { duration: .6, ease: 'power3' }), hy = gsap.quickTo(hv, 'y', { duration: .6, ease: 'power3' });
  // Track which talk row is under the pointer. Checked on move AND on scroll,
  // because smooth scrolling moves rows under a still cursor without firing pointerleave.
  let px = -1, py = -1, activeTalk = null;
  const show = t => { hvImg.src = t.dataset.img; gsap.to(hv, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: .5, ease: 'power3.out', overwrite: true }); };
  const hide = () => gsap.to(hv, { opacity: 0, scale: .6, duration: .3, overwrite: true });
  const check = () => {
    if (px < 0) return;
    const el = document.elementFromPoint(px, py);
    const t = el && el.closest ? el.closest('.talk') : null;
    if (t === activeTalk) return;
    activeTalk = t;
    t ? show(t) : hide();
  };
  window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; hx(px); hy(py); check(); });
  document.addEventListener('pointerleave', () => { px = -1; activeTalk = null; hide(); });
  lenis.on('scroll', check);
}

/* ---------- gallery parallax ---------- */
if (innerWidth > 860) $$('.gcol').forEach(c => gsap.fromTo(c, { yPercent: -(+c.dataset.speed) }, { yPercent: +c.dataset.speed, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } }));

/* ---------- insights drag ---------- */
(() => {
  const rail = $('[data-drag]');
  let down = false, sx = 0, sl = 0, moved = 0;
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-drag'); });
  window.addEventListener('pointerup', () => { down = false; rail.classList.remove('is-drag'); });
  window.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); rail.scrollLeft = sl - dx; });
  rail.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  gsap.from('.insight', { x: 120, opacity: 0, stagger: .07, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: rail, start: 'top 85%' } });
})();

/* ---------- contact + footer ---------- */
gsap.from('.footer-name', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 95%' } });

/* ==========================================================
   CURSOR + MAGNETIC
   ========================================================== */
if (!isTouch) {
  const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
  const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
  const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
  window.addEventListener('pointermove', e => { cur.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  const hoverables = 'a, button, .hs, .talk, .award';
  document.addEventListener('pointerover', e => {
    const t = e.target.closest(hoverables); if (!t) return;
    if (t.dataset.cursor) { label.textContent = t.dataset.cursor; cur.classList.add('is-label'); }
    else if (t.closest('[data-drag]')) { label.textContent = 'Drag'; cur.classList.add('is-label'); }
    else cur.classList.add('is-hover');
  });
  document.addEventListener('pointerout', e => { if (e.target.closest(hoverables)) cur.classList.remove('is-hover', 'is-label'); });
  $('[data-drag]').addEventListener('pointerenter', () => { label.textContent = 'Drag'; cur.classList.add('is-label'); });
  $('[data-drag]').addEventListener('pointerleave', () => cur.classList.remove('is-label'));

  $$('[data-magnetic]').forEach(el => {
    const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

if (reduce) { gsap.globalTimeline.timeScale(20); }
window.addEventListener('load', () => ScrollTrigger.refresh());

/* ==========================================================
   SIDE SCROLL-SPINE NAV — one vertebra per section
   ========================================================== */
{
  const items = [['.hero', 'Intro'], ['#about', 'About'], ['#lab', 'Spine lab'], ['#expertise', 'Expertise'], ['#pathway', 'Pain pathway'], ['#journey', 'Journey'], ['#awards', 'Awards'], ['#stage', 'Speaking'], ['#insights', 'Insights'], ['#contact', 'Connect']]
    .map(([sel, name]) => ({ el: $(sel), name })).filter(x => x.el);
  const nav = document.createElement('nav');
  nav.className = 'side-nav'; nav.setAttribute('aria-label', 'Sections');
  const links = items.map((it, i) => {
    const a = document.createElement('a');
    a.href = it.el.id ? '#' + it.el.id : '#top';
    a.innerHTML = `<span>${it.name}</span><i></i>`;
    a.addEventListener('click', e => { e.preventDefault(); lenis.scrollTo(it.el, { offset: 0, duration: 1.6 }); });
    nav.appendChild(a); return a;
  });
  document.body.appendChild(nav);
  const setActive = i => {
    links.forEach((a, k) => a.classList.toggle('is-active', k === i));
    nav.style.setProperty('--fill', (i / (items.length - 1) * 100) + '%');
  };
  setActive(0);
  items.forEach((it, i) => ScrollTrigger.create({
    trigger: it.el, start: 'top 50%', end: 'bottom 50%',
    onEnter: () => setActive(i), onEnterBack: () => setActive(i)
  }));
  ScrollTrigger.create({ trigger: '.hero', start: 'top -4%', onToggle: s => nav.classList.toggle('on', s.isActive), end: 'max' });
}

/* ==========================================================
   SPINE LAB — sliders drive the 3D spine (spine.js reads window.__lab)
   ========================================================== */
{
  const sl = $('#labSlouch'), cu = $('#labCurve'), pa = $('#labPain');
  const slV = $('#labSlouchV'), cuV = $('#labCurveV'), paV = $('#labPainV'), note = $('#labNote'), lab = $('.lab');
  const word = (v, a) => v < 12 ? a[0] : v < 45 ? a[1] : v < 78 ? a[2] : a[3];
  const painNote = p => p < 1 ? 'No threat detected. The nervous system is quiet.'
    : p < 4 ? 'A low alarm. Remember: pain is an estimate of threat, not a direct reading of tissue damage.'
    : p < 7 ? 'The alarm is turning up. Sleep, stress and fear can amplify it, even when tissue is healthy.'
    : 'A sensitised system. The volume knob is high. This is where pain education and graded loading help most.';
  const posNote = (s, c) => s > 60 && c < 30 ? 'Long static slouching loads tissue, but posture alone rarely explains pain. Varied movement matters more.'
    : c > 55 ? 'Side curves are common and often painless. Most people with scoliosis live and move normally.' : '';
  const sync = () => {
    const s = +sl.value, c = +cu.value, p = +pa.value;
    window.__lab.slouch = s / 100; window.__lab.curve = c / 100; window.__lab.pain = p;
    slV.textContent = word(s, ['Upright', 'Relaxed', 'Slouched', 'Collapsed']);
    cuV.textContent = word(c, ['Straight', 'Slight', 'Curved', 'Scoliosis']);
    paV.textContent = (p % 1 ? p.toFixed(1) : p) + ' / 10';
    note.textContent = (p >= 4 ? painNote(p) : (posNote(s, c) || painNote(p)));
    lab.style.setProperty('--pain', p / 10);
    [sl, cu, pa].forEach(i => i.style.setProperty('--fill', (i.value - i.min) / (i.max - i.min) * 100 + '%'));
  };
  [sl, cu, pa].forEach(i => i.addEventListener('input', () => { $$('.lab-presets button').forEach(b => b.classList.remove('is-on')); sync(); }));
  $$('.lab-presets button').forEach(b => b.addEventListener('click', () => {
    const [s, c, p] = b.dataset.preset.split(',').map(Number);
    $$('.lab-presets button').forEach(x => x.classList.toggle('is-on', x === b));
    const o = { s: +sl.value, c: +cu.value, p: +pa.value };
    gsap.to(o, { s, c, p, duration: 1.1, ease: 'power3.inOut', onUpdate: () => { sl.value = o.s; cu.value = o.c; pa.value = Math.round(o.p * 2) / 2; sync(); } });
  }));
  sync();
}

/* ==========================================================
   PHASE 3: breathing widget
   ========================================================== */
(() => {
  const orb = $('#bOrb'); if (!orb) return;
  const ring = $('.b-ring', orb), halo = $('.b-halo', orb), phase = $('#bPhase'), time = $('#bTime'), btn = $('#bStart'), snd = $('#bSound');
  let ctx, running = false, tl, tick, hb;
  gsap.set([ring, halo], { scale: .62 });
  const beat = () => {
    if (!snd.checked) return;
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const thump = (d, f, g) => {
      const t = ctx.currentTime + d;
      [[f, g], [f * 2, g * .5]].forEach(([fr, gn]) => {
        const o = ctx.createOscillator(), a = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(fr, t); o.frequency.exponentialRampToValueAtTime(fr * .4, t + .2);
        a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(gn, t + .02); a.gain.exponentialRampToValueAtTime(.0001, t + .28);
        o.connect(a).connect(ctx.destination); o.start(t); o.stop(t + .3);
      });
    };
    thump(0, 120, .9); thump(.3, 100, .6);
  };
  snd.addEventListener('change', () => { if (snd.checked) beat(); });
  const stop = done => {
    running = false; clearInterval(tick); clearInterval(hb); if (tl) tl.kill();
    gsap.to([ring, halo], { scale: .62, duration: .8, ease: 'power2.out' });
    phase.textContent = done ? 'Well done' : 'Ready'; time.textContent = done ? '\u2713' : '30';
    btn.textContent = done ? 'Again' : 'Start';
  };
  btn.addEventListener('click', () => {
    if (running) { stop(false); return; }
    running = true; btn.textContent = 'Stop';
    let left = 30; time.textContent = left;
    tick = setInterval(() => { left--; time.textContent = Math.max(left, 0); if (left <= 0) stop(true); }, 1000);
    hb = setInterval(beat, 1000); beat();
    tl = gsap.timeline({ repeat: -1 });
    tl.add(() => { phase.textContent = 'Breathe in'; })
      .to([ring, halo], { scale: 1, duration: 4, ease: 'sine.inOut' })
      .add(() => { phase.textContent = 'Breathe out'; })
      .to([ring, halo], { scale: .62, duration: 6, ease: 'sine.inOut' });
  });
})();

/* ---------- patient crowd ---------- */
(() => {
  const g = $('#crowd'); if (!g) return;
  const n = innerWidth < 860 ? 100 : 120;
  g.innerHTML = '<i></i>'.repeat(n);
  gsap.to($$('i', g), { opacity: 1, duration: .5, stagger: { each: .02, from: 'random' }, ease: 'power1.out', scrollTrigger: { trigger: g, start: 'top 88%', once: true } });
})();
