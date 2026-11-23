const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const ATLAS_URL = 'assets/data/balkans.json';

const globe = document.getElementById('globe');
const canvas = document.getElementById('globeCanvas');
const labelLayer = document.getElementById('globeLabels');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CENTER = { lon: 20.6, lat: 42.2 };
const KX = Math.cos(CENTER.lat * Math.PI / 180);
const HOME_ID = '807';

function project(lon, lat) {
  return { x: (lon - CENTER.lon) * KX, z: -(lat - CENTER.lat) };
}

function currentLang() {
  return document.documentElement.lang === 'en' ? 1 : 0;
}

function placeName(key) {
  const p = window.PRICES.places[key];
  return p ? p[currentLang()] : key;
}

function trips() {
  return window.PRICES.routes.filter((r) => r.type === 'international');
}

function farthest() {
  return Math.max(...trips().map((r) => r.km));
}

function whenNear(el, cb) {
  if (!('IntersectionObserver' in window)) { cb(); return; }
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    cb();
  }, { rootMargin: '1200px 0px' });
  io.observe(el);
}

function fail() {
  globe.classList.add('is-failed', 'is-ready');
  const id = '1702134731681-97d4f829b4a6';
  globe.style.backgroundImage = 'url(' + window.STORY.photo(id, 1400) + ')';
}

let loading = null;

function load() {
  if (!loading) {
    loading = Promise.all([
      import(THREE_URL),
      fetch(ATLAS_URL).then((r) => { if (!r.ok) throw new Error('atlas'); return r.json(); })
    ]);
  }
  return loading;
}

let booted = false;

async function boot() {
  if (booted) return;
  booted = true;
  let THREE, atlas;
  try {
    [THREE, atlas] = await load();
  } catch (e) {
    fail();
    return;
  }
  try {
    build(THREE, atlas);
  } catch (e) {
    fail();
  }
}

function build(THREE, atlas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dee4, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0xe2e7e3, roughness: 1 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.01;
  sea.receiveShadow = true;
  scene.add(sea);

  const landMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const homeMat = new THREE.MeshStandardMaterial({ color: 0xbfe3d1, roughness: 0.7 });
  const land = new THREE.Group();
  scene.add(land);

  atlas.c.forEach((f) => {
    const home = f.id === HOME_ID;
    const shapes = [];
    f.p.forEach((rings) => {
      const toV = (pt) => { const p = project(pt[0], pt[1]); return new THREE.Vector2(p.x, -p.z); };
      const shape = new THREE.Shape(rings[0].map(toV));
      rings.slice(1).forEach((hole) => shape.holes.push(new THREE.Path(hole.map(toV))));
      shapes.push(shape);
    });
    if (!shapes.length) return;
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: home ? 0.22 : 0.08, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, home ? homeMat : landMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (home) mesh.userData.home = true;
    land.add(mesh);
  });

  const pts = [];
  atlas.b.forEach((line) => {
    for (let i = 0; i < line.length - 1; i++) {
      const a = project(line[i][0], line[i][1]);
      const b = project(line[i + 1][0], line[i + 1][1]);
      pts.push(a.x, 0.083, a.z, b.x, 0.083, b.z);
    }
  });
  const borderGeo = new THREE.BufferGeometry();
  borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc4cac5 });
  scene.add(new THREE.LineSegments(borderGeo, lineMat));

  const places = window.STORY.places;
  const homeP = project(places.skopje.ll[1], places.skopje.ll[0]);
  const HOME = new THREE.Vector3(homeP.x, 0.24, homeP.z);

  const accent = new THREE.Color(0x0f4a3a);
  const signal = new THREE.Color(0xb9d3c5);

  const homePin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0x111113 }));
  homePin.position.set(HOME.x, 0.47, HOME.z);
  homePin.castShadow = true;
  scene.add(homePin);
  const homeHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.3 }));
  homeHead.position.set(HOME.x, 0.75, HOME.z);
  homeHead.castShadow = true;
  scene.add(homeHead);

  const ringGeo = new THREE.RingGeometry(0.16, 0.2, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const homeRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: accent, transparent: true }));
  homeRing.position.set(HOME.x, 0.235, HOME.z);
  scene.add(homeRing);

  const routes = {};
  const SEG = 90;
  const RAD = 6;
  trips().forEach((r) => {
    const info = places[r.to];
    if (!info) return;
    const p = project(info.ll[1], info.ll[0]);
    const end = new THREE.Vector3(p.x, 0.09, p.z);
    const dist = HOME.distanceTo(end);
    const mid = HOME.clone().lerp(end, 0.5);
    mid.y = 0.5 + dist * 0.32;
    const curve = new THREE.QuadraticBezierCurve3(HOME.clone(), mid, end);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, SEG, 0.018, RAD, false),
      new THREE.MeshBasicMaterial({ color: 0x8e98a3, transparent: true, opacity: 0.35 })
    );
    scene.add(tube);

    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0x111113 }));
    dot.position.set(end.x, 0.1, end.z);
    dot.castShadow = true;
    scene.add(dot);

    const ring = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({ color: signal, transparent: true, opacity: 0 }));
    ring.position.set(end.x, 0.095, end.z);
    scene.add(ring);

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'pin';
    label.tabIndex = -1;
    label.dataset.to = r.to;
    label.addEventListener('click', () => window.dispatchEvent(new CustomEvent('map:pick', { detail: { key: r.to } })));
    labelLayer.appendChild(label);

    routes[r.to] = { r, curve, tube, dot, ring, end, dist, label, airport: /Airport$/.test(r.to) };
  });

  const homeLabel = document.createElement('span');
  homeLabel.className = 'pin pin--home';
  labelLayer.appendChild(homeLabel);

  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: signal }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ color: signal, transparent: true, opacity: 0.25 }));
  runner.add(glow);
  runner.visible = false;
  scene.add(runner);

  const activeMat = new THREE.MeshBasicMaterial({ color: accent });
  let active = null;
  let anim = null;

  function writeLabels() {
    Object.values(routes).forEach((o) => { o.label.textContent = placeName(o.r.to); });
    homeLabel.textContent = placeName('skopje');
  }
  writeLabels();
  window.addEventListener('lang:change', writeLabels);

  function select(key) {
    const o = routes[key];
    if (!o || (active && active.r.to === key && anim)) return;
    if (active) {
      active.tube.material = active.baseMat;
      active.tube.geometry.setDrawRange(0, Infinity);
      active.label.classList.remove('is-on');
    }
    active = o;
    o.baseMat = o.baseMat || o.tube.material;
    o.tube.material = activeMat;
    o.label.classList.add('is-on');
    const duration = reducedMotion ? 0 : 1100 + o.r.km / farthest() * 1900 + 300;
    anim = { start: performance.now(), duration, o };
    runner.visible = !reducedMotion;
  }

  function paint() {
    const style = getComputedStyle(document.documentElement);
    const read = (name) => new THREE.Color(style.getPropertyValue(name).trim() || '#000');
    accent.copy(read('--accent'));
    signal.copy(read('--signal'));
    sea.material.color.copy(read('--map-sea'));
    landMat.color.copy(read('--map-land'));
    homeMat.color.copy(read('--map-home'));
    lineMat.color.copy(read('--map-line'));
    activeMat.color.copy(accent);
    homeHead.material.color.copy(accent);
    homeHead.material.emissive.copy(accent);
    homeRing.material.color.copy(accent);
    runner.material.color.copy(signal);
    glow.material.color.copy(signal);
    Object.values(routes).forEach((o) => o.ring.material.color.copy(signal));
  }
  window.addEventListener('theme:change', () => { paint(); loop(); });

  const initial = document.querySelector('.trip[aria-pressed="true"]');
  select(initial ? initial.dataset.to : 'thessaloniki');
  paint();
  window.addEventListener('trip:change', (e) => select(e.detail.key));

  const target = new THREE.Vector3();
  const look = new THREE.Vector3(HOME.x, 0, HOME.z + 0.5);
  let azimuth = 0;
  let azimuthGoal = -0.18;
  let dragX = null;
  let hoverX = 0;
  let hoverY = 0;
  let radius = 14;

  globe.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.pin')) return;
    dragX = e.clientX;
    globe.classList.add('is-touched');
    globe.setPointerCapture(e.pointerId);
  });
  globe.addEventListener('pointermove', (e) => {
    const r = globe.getBoundingClientRect();
    hoverX = ((e.clientX - r.left) / r.width) * 2 - 1;
    hoverY = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (dragX === null) return;
    azimuthGoal = Math.max(-0.9, Math.min(0.9, azimuthGoal - (e.clientX - dragX) * 0.006));
    dragX = e.clientX;
  });
  const endDrag = () => { dragX = null; };
  globe.addEventListener('pointerup', endDrag);
  globe.addEventListener('pointercancel', endDrag);
  globe.addEventListener('pointerleave', () => { hoverX = 0; hoverY = 0; });

  function resize() {
    const w = globe.clientWidth;
    const h = globe.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(globe);
  resize();

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(globe);
  }

  const v = new THREE.Vector3();
  function placeLabel(el, pos, show, scale) {
    v.copy(pos).project(camera);
    const x = (v.x * 0.5 + 0.5) * globe.clientWidth;
    const y = (-v.y * 0.5 + 0.5) * globe.clientHeight;
    el.style.setProperty('--x', x.toFixed(1) + 'px');
    el.style.setProperty('--y', y.toFixed(1) + 'px');
    el.style.setProperty('--o', show ? 1 : 0);
    el.style.setProperty('--s', scale);
    el.style.pointerEvents = show ? 'auto' : 'none';
  }

  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  let running = false;
  function loop() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  const total = SEG * RAD * 6;
  const lp = new THREE.Vector3();

  function frame(now) {
    running = false;
    const t = now / 1000;

    if (anim) {
      const p = anim.duration ? Math.min((now - anim.start) / anim.duration, 1) : 1;
      const e = easeInOut(p);
      anim.o.tube.geometry.setDrawRange(0, Math.ceil(total * e / (RAD * 6)) * RAD * 6);
      anim.o.curve.getPoint(e, runner.position);
      if (p >= 1) {
        anim.o.ringStart = now;
        runner.visible = false;
        anim = null;
      }
    }

    Object.values(routes).forEach((o) => {
      if (o.ringStart) {
        const k = (now - o.ringStart) / 1400;
        if (k >= 1) { o.ringStart = 0; o.ring.material.opacity = 0; }
        else { o.ring.scale.setScalar(1 + k * 3); o.ring.material.opacity = 0.9 * (1 - k); }
      }
    });
    const hk = (t % 2.2) / 2.2;
    homeRing.scale.setScalar(1 + hk * 2.4);
    homeRing.material.opacity = 0.8 * (1 - hk);
    homeHead.position.y = 0.75 + (reducedMotion ? 0 : Math.sin(t * 2) * 0.03);

    if (active) {
      target.copy(HOME).lerp(active.end, 0.55);
      target.y = 0;
      radius += ((8.5 + active.dist * 1.15) - radius) * 0.04;
    }
    look.lerp(target, 0.05);
    const sway = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.06;
    azimuth += (azimuthGoal + sway + hoverX * 0.08 - azimuth) * 0.06;
    const polar = 0.78 + hoverY * 0.05;
    camera.position.set(
      look.x + radius * Math.sin(polar) * Math.sin(azimuth),
      radius * Math.cos(polar),
      look.z + radius * Math.sin(polar) * Math.cos(azimuth)
    );
    camera.lookAt(look);

    const taken = [];
    const claim = (el, pos, force) => {
      v.copy(pos).project(camera);
      const x = (v.x * 0.5 + 0.5) * globe.clientWidth;
      const y = (-v.y * 0.5 + 0.5) * globe.clientHeight;
      const w = el.textContent.length * 7.5 + 24;
      const box = { l: x - w / 2, r: x + w / 2, t: y - 40, b: y - 10 };
      const hit = taken.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t);
      if (hit && !force) return false;
      taken.push(box);
      return true;
    };
    lp.set(HOME.x, 0.9, HOME.z);
    claim(homeLabel, lp, true);
    placeLabel(homeLabel, lp, true, 1);
    const order = Object.values(routes).sort((a, b) => (b === active) - (a === active) || (a.airport - b.airport) || (b.r.km - a.r.km));
    order.forEach((o) => {
      const on = active === o;
      lp.set(o.end.x, 0.12, o.end.z);
      const show = (on || !o.airport) && claim(o.label, lp, on);
      placeLabel(o.label, lp, show, on ? 1.08 : 1);
    });

    renderer.render(scene, camera);
    globe.classList.add('is-ready');
    if (visible && !document.hidden) loop();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) loop(); });
  loop();
}

whenNear(globe, boot);
window.addEventListener('load', () => {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
  idle(() => { load().catch(() => {}); }, { timeout: 4000 });
});
