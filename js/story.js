(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var STORY = window.STORY;

  var FIRST_TRIP = 'thessaloniki';
  var DRIVE_BASE = 1100;
  var DRIVE_SPAN = 1900;
  var TRIP_DWELL = 2200;

  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 900px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isPhone = window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    /Android|iPhone|iPod|Mobi/i.test(navigator.userAgent);
  root.classList.add('js');
  if (reducedMotion) root.classList.add('rm');

  var lang = readSavedLanguage();
  var fareIndex = 0;
  var lastPrice = {};
  var tripKey = FIRST_TRIP;
  var tripStarted = false;
  var tripFrame = null;
  var tripTimer = null;
  var dwellTimer = null;
  var autoplay = !reducedMotion;
  var holds = { hover: false, offscreen: true };

  var $ = function (id) { return document.getElementById(id); };
  var bar = $('bar');
  var nav = $('nav');
  var burger = $('burger');
  var dial = $('dial');
  var dialList = $('dialList');
  var dialLead = $('dialLead');
  var journey = $('journey');
  var track = $('track');
  var trackCar = $('trackCar');
  var abroadList = $('abroad');
  var fareList = $('fareList');

  function readSavedLanguage() {
    try { return localStorage.getItem('lang') === 'en' ? 'en' : 'mk'; } catch (e) { return 'mk'; }
  }
  function saveLanguage() {
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  function t(key) { return TEXT[lang][key]; }
  function pick(value) { return Array.isArray(value) ? value[lang === 'en' ? 1 : 0] : value; }
  function place(key) { return pick(PRICES.places[key]); }
  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function euroHtml(eur) { return '<span class="eur">€</span>' + esc(String(eur)); }
  function routesOf(type) { return PRICES.routes.filter(function (r) { return r.type === type; }); }
  function abroadRoutes() { return routesOf('international').slice().sort(function (a, b) { return a.km - b.km; }); }
  function findTrip(key) { return abroadRoutes().filter(function (r) { return r.to === key; })[0]; }
  function farthestKm() { var r = abroadRoutes(); return r[r.length - 1].km; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function photoHtml(id, alt, sizes, eager) {
    var src = STORY.photo(id, 1400);
    var set = [640, 1000, 1400, 2000].map(function (w) { return STORY.photo(id, w) + ' ' + w + 'w'; }).join(', ');
    return '<img src="' + src + '" srcset="' + set + '" sizes="' + (sizes || '100vw') + '" alt="' + esc(alt || '') + '"' +
      (eager ? '' : ' loading="lazy"') + ' decoding="async" />';
  }

  function fillPhotos() {
    document.querySelectorAll('[data-u]').forEach(function (box) {
      var key = box.getAttribute('data-alt');
      var alt = key ? t(key) : '';
      var existing = box.querySelector('img');
      if (existing) { existing.alt = alt; return; }
      var sizes = '100vw';
      box.innerHTML = photoHtml(box.getAttribute('data-u'), alt, sizes);
      if (box.classList.contains('reel__img') || box.classList.contains('faq__img')) {
        box.classList.add('photo-in');
        revealObserver && revealObserver.observe(box);
      }
    });
  }

  function splitWords(el) {
    var index = 0;
    function wrap(node) {
      var out = document.createDocumentFragment();
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
            out.appendChild(word(document.createTextNode(part)));
          });
        } else if (child.nodeName === 'BR') {
          out.appendChild(child);
        } else {
          out.appendChild(word(child));
        }
      });
      return out;
    }
    function word(inner) {
      var w = document.createElement('span');
      var s = document.createElement('span');
      w.className = 'w';
      s.style.setProperty('--i', index++);
      s.appendChild(inner);
      w.appendChild(s);
      return w;
    }
    var frag = wrap(el);
    el.innerHTML = '';
    el.appendChild(frag);
  }

  var revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;

  function watchReveals(scope) {
    var items = (scope || document).querySelectorAll('[data-split], [data-rise], .sign, .photo-in, .trips');
    Array.prototype.forEach.call(items, function (el) {
      if (el.classList.contains('is-in')) return;
      if (!revealObserver || reducedMotion) { el.classList.add('is-in'); return; }
      if (el.hasAttribute('data-rise')) {
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (s) { return s.hasAttribute('data-rise'); });
        el.style.setProperty('--d', siblings.indexOf(el) * 90 + 'ms');
      }
      revealObserver.observe(el);
    });
  }

  function translatePage() {
    root.lang = lang;
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n'));
      if (el.hasAttribute('data-split')) splitWords(el);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) { el.alt = t(el.getAttribute('data-i18n-alt')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-site-name]').forEach(function (el) { el.textContent = pick(SITE.name); });
    document.querySelectorAll('[data-brand]').forEach(function (el) {
      var words = pick(SITE.name).split(' ');
      el.innerHTML = esc(words.shift()) + (words.length ? '<span>' + esc(words.join(' ')) + '</span>' : '');
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'); });
  }

  var HERO_DWELL = 4200;
  var heroIndex = 0;
  var heroTimer = null;
  var heroPaused = false;

  function heroWord(slide) {
    return slide.to ? place(slide.to).toUpperCase() + '.' : t('hero.where');
  }

  function charsHtml(word) {
    return word.split('').map(function (c, i) {
      return '<i style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</i>';
    }).join('');
  }

  function fitSlot(word) {
    var slot = $('slot');
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
    probe.textContent = word;
    $('heroTitle').appendChild(probe);
    var room = $('heroTitle').clientWidth;
    var need = probe.getBoundingClientRect().width;
    probe.remove();
    slot.style.fontSize = need > room ? (room / need * 0.98).toFixed(3) + 'em' : '';
  }

  function setSlot(word, animate) {
    var slot = $('slot');
    fitSlot(word);
    if (!animate || reducedMotion) {
      slot.innerHTML = '<span class="slot__word">' + esc(word) + '</span>';
      return;
    }
    var old = slot.querySelector('.slot__word:not(.is-out)');
    slot.querySelectorAll('.slot__word.is-out').forEach(function (el) { el.remove(); });
    if (old) {
      if (!old.querySelector('i')) old.innerHTML = charsHtml(old.textContent);
      old.classList.remove('is-in');
      old.classList.add('is-out');
      setTimeout(function () { old.remove(); }, 900);
    }
    var next = document.createElement('span');
    next.className = 'slot__word is-in';
    next.innerHTML = charsHtml(word);
    slot.appendChild(next);
    slot.classList.remove('is-swapping');
    void slot.offsetWidth;
    slot.classList.add('is-swapping');
  }

  var ROAD_WIDE = [[-0.1, 0.62], [0.16, 0.05], [0.34, 1.05], [0.52, 0.6], [0.82, 0.02], [1.12, 0.42]];
  var ROAD_NARROW = [[-0.3, 0.72], [0.12, 0.3], [0.52, 0.95], [0.74, 0.55], [0.96, 0.15], [1.35, 0.32]];
  var road = { samples: [], cur: reducedMotion ? 0.5 : 0, target: reducedMotion ? 0.5 : 0.13, frame: null };

  function buildRoad() {
    var pin = $('heroPin');
    var svg = $('road');
    var w = pin.clientWidth;
    var h = pin.clientHeight;
    var narrow = w < 900;
    var lead = $('heroLead');
    var top = lead.offsetTop + lead.offsetHeight + (narrow ? 24 : 30);
    var rh = Math.max(160, h - top - (narrow ? 30 : 40));
    var pts = narrow ? ROAD_NARROW : ROAD_WIDE;
    function pt(i) { return (pts[i][0] * w).toFixed(1) + ' ' + (top + pts[i][1] * rh).toFixed(1); }
    var d = 'M' + pt(0) + ' C' + pt(1) + ' ' + pt(2) + ' ' + pt(3) + ' S' + pt(4) + ' ' + pt(5);
    var rw = narrow ? Math.round(clamp(w * 0.13, 44, 60)) : Math.round(clamp(w * 0.055, 60, 86));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.setProperty('--rw', rw + 'px');
    svg.querySelectorAll('path[class^="road__"]').forEach(function (path) { path.setAttribute('d', d); });
    $('tcar').style.setProperty('--cw', Math.round(rw * 2.15) + 'px');
    var path = svg.querySelector('.road__tar');
    var len = path.getTotalLength();
    road.samples = [];
    for (var i = 0; i <= 240; i++) {
      var q = path.getPointAtLength(len * i / 240);
      road.samples.push([q.x, q.y]);
    }
    makeAsphalt();
    buildGround(top);
    placeTcar(road.cur);
  }

  var asphaltReady = false;

  function makeAsphalt() {
    if (asphaltReady) return;
    asphaltReady = true;
    var size = 160;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(size, size);
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 62 + (rnd() - 0.5) * 34;
      if (rnd() < 0.035) v += 40 + rnd() * 40;
      if (rnd() < 0.02) v -= 25;
      img.data[i] = v; img.data[i + 1] = v + 2; img.data[i + 2] = v + 7; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var asphaltUrl = cv.toDataURL('image/png');
    var img2 = ctx.createImageData(size, size);
    for (var c = 0; c < img2.data.length; c += 4) {
      var g = 196 + (rnd() - 0.5) * 22;
      if (rnd() < 0.02) g -= 30;
      img2.data[c] = g; img2.data[c + 1] = g + 1; img2.data[c + 2] = g + 3; img2.data[c + 3] = 255;
    }
    ctx.putImageData(img2, 0, 0);
    $('vozaci').style.setProperty('--concrete', 'url(' + cv.toDataURL('image/png') + ')');
    $('asphaltImg').setAttribute('href', asphaltUrl);
  }

  function buildGround(top) {
    var ground = $('heroGround');
    ground.style.setProperty('--gt', Math.max(0, top - 20) + 'px');
    if (!ground.firstChild) ground.innerHTML = photoHtml(ground.dataset.u || '1538390019947-079c808a7315', '', '100vw', true);
  }

  function placeTcar(f) {
    var s = road.samples;
    if (!s.length) return;
    var x = clamp(f, 0, 1) * (s.length - 1);
    var i = Math.min(s.length - 2, Math.floor(x));
    var k = x - i;
    var px = s[i][0] + (s[i + 1][0] - s[i][0]) * k;
    var py = s[i][1] + (s[i + 1][1] - s[i][1]) * k;
    var a = s[Math.max(0, i - 2)];
    var b = s[Math.min(s.length - 1, i + 3)];
    var angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    var car = $('tcar');
    car.style.transform = 'translate3d(' + (px - car.offsetWidth / 2).toFixed(1) + 'px,' + (py - car.offsetHeight / 2).toFixed(1) + 'px,0) rotate(' + angle.toFixed(2) + 'deg)';
  }

  function steerTcar() {
    if (road.frame) return;
    (function tick() {
      var diff = road.target - road.cur;
      road.cur += Math.abs(diff) < 0.0004 ? diff : diff * 0.09;
      placeTcar(road.cur);
      road.frame = Math.abs(road.target - road.cur) > 0.00001 ? requestAnimationFrame(tick) : null;
    })();
  }

  function showSlide(index, animate) {
    heroIndex = (index + STORY.hero.length) % STORY.hero.length;
    setSlot(heroWord(STORY.hero[heroIndex]), animate);
    clearTimeout(heroTimer);
    if (!reducedMotion) heroTimer = setTimeout(nextSlide, HERO_DWELL);
  }

  function nextSlide() {
    if (heroPaused || document.hidden) { heroTimer = setTimeout(nextSlide, 500); return; }
    showSlide(heroIndex + 1, true);
  }

  function renderHero() {
    $('heroTitle').setAttribute('aria-label', t('hero.aria'));
    showSlide(heroIndex, false);
    buildRoad();
  }

  var PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';

  function renderFares() {
    var routes = routesOf('airport');
    var from = null;
    fareList.innerHTML = routes.map(function (route, i) {
      var landing = route.from === 'airport';
      var group = route.from !== from
        ? '<li class="fares__group' + (landing ? ' fares__group--landing' : '') + '"><span class="fares__icon">' + PLANE + '</span>' +
          '<span>' + esc(t(landing ? 'fare.fromAirport' : 'fare.toAirport')) + '</span></li>'
        : '';
      from = route.from;
      return group +
        '<li><button class="fare" type="button" data-fare="' + i + '" aria-pressed="' + (i === fareIndex) + '">' +
          '<span class="fare__to">' + esc(place(landing ? route.to : route.from)) + '</span>' +
          '<span class="fare__dots" aria-hidden="true"></span>' +
          '<span class="fare__price">' + euroHtml(route.eur) + '</span>' +
        '</button></li>';
    }).join('');
  }

  var SCRAMBLE = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШABCDEFGHKLMNOPRSTUVXYZ';
  var scrambles = {};

  function scramble(el, text, animate) {
    cancelAnimationFrame(scrambles[el.id]);
    if (!animate || reducedMotion) { el.textContent = text; return; }
    var start = performance.now();
    var duration = 520 + text.length * 14;
    (function frame(now) {
      var p = clamp((now - start) / duration, 0, 1);
      var settled = Math.floor(p * text.length);
      var out = esc(text.slice(0, settled));
      var rest = '';
      for (var i = settled; i < text.length; i++) {
        rest += text[i] === ' ' ? ' ' : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
      }
      el.innerHTML = out + (rest ? '<span class="sc">' + esc(rest.slice(0, 6)) + '</span>' + esc(rest.slice(6).replace(/./g, ' ')) : '');
      if (p < 1) scrambles[el.id] = requestAnimationFrame(frame);
      else el.textContent = text;
    })(start);
  }

  function tilesHtml(eur, animate) {
    var chars = String(eur).split('');
    return '<span class="tile tile--eur"><span>€</span></span>' + chars.map(function (c, i) {
      var flip = animate && !reducedMotion;
      return '<span class="tile' + (flip ? ' is-flip' : '') + '" style="--d:' + (i * 90 + 60) + 'ms"><span>' + esc(c) + '</span></span>';
    }).join('');
  }

  function showFare(index, animate) {
    var route = routesOf('airport')[index];
    fareIndex = index;
    scramble($('fareFrom'), place(route.from), animate);
    scramble($('fareTo'), place(route.to), animate);
    $('farePrice').innerHTML = tilesHtml(route.eur, animate);
    $('farePrice').setAttribute('aria-label', '€' + route.eur);
    fareList.querySelectorAll('.fare').forEach(function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.fare) === index ? 'true' : 'false');
    });
  }

  function renderTours() {
    $('tours').innerHTML = routesOf('private').map(function (tour) {
      var title = tour.via
        ? tour.via.map(function (k) { return esc(place(k)); }).join(' <span class="arrow">→</span> ')
        : esc(pick(tour.title));
      var sub = tour.note
        ? '<p class="tour__sub">' + esc(pick(tour.note)) + '</p>'
        : tour.stops
          ? '<ul class="tour__sub tour__stops">' + tour.stops.map(function (s) { return '<li>' + esc(pick(s)) + '</li>'; }).join('') + '</ul>'
          : '';
      var price = tour.quote
        ? '<p class="tour__price tour__price--quote">' + esc(t('price.quote')) + '</p>'
        : '<p class="tour__price">' + euroHtml(tour.eur) + '</p>';
      return '<li class="tour" tabindex="0" data-rise>' +
        '<div class="tour__img">' + photoHtml(STORY.tours[tour.id], t('tour.' + tour.id), '(min-width: 960px) 60vw, 100vw') + '</div>' +
        '<div class="tour__body"><p class="tour__title">' + title + '</p>' + sub + '</div>' + price +
      '</li>';
    }).join('');
  }

  var fanOrder = [0, 1, 2];
  var m2 = null;
  var m2Idle = null;
  var m2Photo = -1;
  var m2Waved = { m: false, i: false };

  function renderDrivers() {
    document.querySelectorAll('[data-driver-name]').forEach(function (el) { el.textContent = pick(SITE.drivers[+el.dataset.driverName].name); });
    paintFan();
    m2Layout();
  }

  function paintFan() {
    var roles = ['is-c', 'is-r', 'is-l'];
    document.querySelectorAll('.fan__card').forEach(function (card) {
      var idx = +card.dataset.card;
      var pos = fanOrder.indexOf(idx);
      card.classList.remove('is-c', 'is-l', 'is-r');
      card.classList.add(roles[pos]);
      card.setAttribute('aria-label', t(['car.v1', 'car.v2', 'car.v3'][idx]));
      card.setAttribute('aria-current', pos === 0 ? 'true' : 'false');
    });
    document.querySelectorAll('.m2__angles [data-card]').forEach(function (b) {
      b.setAttribute('aria-pressed', +b.dataset.card === fanOrder[0] ? 'true' : 'false');
    });
  }

  function fanTo(idx) {
    if (fanOrder[0] === idx) return;
    var pos = fanOrder.indexOf(idx);
    fanOrder = fanOrder.slice(pos).concat(fanOrder.slice(0, pos));
    paintFan();
  }

  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function band(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

  function m2Layout() {
    var stage = $('m2Stage');
    var W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    var narrow = W < 900;
    var ratio = 240 / 460;
    var ch = narrow ? Math.min(H * 0.5, (W * 0.44) / ratio) : Math.min(H * 0.84, 980);
    var cw = ch * ratio;
    var gap = narrow ? 0 : Math.max(cw * 0.35, 60);
    var cm = narrow ? W * 0.27 : W / 2 - cw / 2 - gap / 2;
    var ci = narrow ? W * 0.73 : W / 2 + cw / 2 + gap / 2;
    ['dudeM', 'dudeI'].forEach(function (id) {
      $(id).style.width = cw + 'px';
      $(id).style.height = ch + 'px';
    });
    var fan = $('fan');
    var story = $('m2Story');
    var cardW, fx, fy;
    if (narrow) {
      story.style.width = (W - 40) + 'px';
      var sh = story.offsetHeight;
      cardW = Math.max(160, Math.min(W - 32, (H * 0.5) * 4 / 3, (H - sh - 40) * 4 / 3));
      var block = cardW * 0.75 + 24 + sh;
      var top0 = Math.max(8, (H - block) / 2);
      fx = W / 2;
      fy = top0 + cardW * 0.375;
      story.style.transform = '';
      story.style.left = '20px';
      story.style.top = (top0 + cardW * 0.75 + 24) + 'px';
    } else {
      var colW = Math.min(W * 0.28, 380);
      var left0 = Math.max(32, (W - 1320) / 2 + 32);
      cardW = Math.min(W - left0 - colW - 140, (H - 90) * 4 / 3 * 0.92, 780);
      story.style.width = colW + 'px';
      story.style.left = left0 + 'px';
      story.style.top = Math.max(10, (H - story.offsetHeight) / 2) + 'px';
      fx = left0 + colW + 70 + (W - left0 - colW - 70) / 2;
      fy = H / 2;
    }
    fan.style.setProperty('--cw', cardW + 'px');
    fan.style.setProperty('--off', (narrow ? cardW * 0.08 : Math.min(cardW * 0.42, (W - fx) - cardW * 0.42)) + 'px');
    fan.style.left = fx + 'px';
    fan.style.top = fy + 'px';
    var footPad = narrow ? 18 : 10;
    m2 = { W: W, H: H, ch: ch, cw: cw, cm: cm, ci: ci, narrow: narrow, foot: footPad };
    var lb = $('vozaci').getBoundingClientRect();
    m2Tick(clamp(-lb.top / Math.max(1, lb.height - innerHeight), 0, 1), true);
  }

  function m2Tick(p, still) {
    if (!m2) return;
    if (reducedMotion) p = 1;
    var sec = $('vozaci');
    var m = $('dudeM'), i = $('dudeI');
    var wo = Math.pow(band(p, 0.3, 0.56), 1.6);
    sec.style.setProperty('--wo', wo.toFixed(3));
    var xm = m2.cm - wo * (m2.cm + m2.cw);
    var xi = m2.ci + wo * (m2.W - m2.ci + m2.cw);
    var y = m2.H - m2.ch - m2.foot;
    m.style.transform = 'translate3d(' + (xm - m2.cw / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    i.style.transform = 'translate3d(' + (xi - m2.cw / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';

    var walking = wo > 0 && wo < 1;
    if (!still && walking && !reducedMotion) {
      m.classList.add('is-walking');
      i.classList.add('is-walking');
      clearTimeout(m2Idle);
      m2Idle = setTimeout(function () { m.classList.remove('is-walking'); i.classList.remove('is-walking'); }, 180);
    }

    var hm = $('helloM'), hi = $('helloI');
    var showM = p > 0.02 && wo === 0, showI = p > 0.09 && wo === 0;
    hm.classList.toggle('is-on', showM);
    hi.classList.toggle('is-on', showI);
    if (showM && !m2Waved.m) { m2Waved.m = true; waveOnce(m); }
    if (showI && !m2Waved.i) { m2Waved.i = true; waveOnce(i); }
    if (p < 0.01) { m2Waved.m = false; m2Waved.i = false; }
    var headY = y + m2.ch * 0.03;
    var bwm = hm.offsetWidth, bwi = hi.offsetWidth;
    var lm = clamp(xm - bwm * (m2.narrow ? 0.5 : 0.9), 10, m2.W - bwm - 10);
    var li = clamp(xi - bwi * (m2.narrow ? 0.5 : 0.1), 10, m2.W - bwi - 10);
    var clash = lm + bwm > li - 8;
    hm.style.left = lm.toFixed(1) + 'px';
    hm.style.top = (headY - (clash ? hi.offsetHeight + 10 : 0)).toFixed(1) + 'px';
    hi.style.left = li.toFixed(1) + 'px';
    hi.style.top = headY.toFixed(1) + 'px';

    var f = ease(band(p, 0.5, 0.68));
    sec.style.setProperty('--f', f.toFixed(3));
    sec.classList.toggle('is-open', f >= 1);

    if (p >= 0.72) {
      var idx = Math.min(2, Math.floor(band(p, 0.72, 1) * 3));
      if (idx !== m2Photo) { m2Photo = idx; fanTo(idx); }
    } else if (m2Photo !== -1) {
      m2Photo = -1;
      fanTo(0);
    }
  }

  function waveOnce(fig) {
    if (reducedMotion) return;
    fig.classList.add('pose-wave');
    setTimeout(function () { fig.classList.remove('pose-wave'); }, 2600);
  }

  var PIN = '<svg class="trip__plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';

  function renderAbroad() {
    var farthest = farthestKm();
    abroadList.innerHTML = abroadRoutes().map(function (route) {
      var airport = /Airport$/.test(route.to);
      return '<li><button class="trip" type="button" data-to="' + route.to + '" aria-pressed="' + (route.to === tripKey) + '">' +
        '<span class="trip__city">' + (airport ? PIN : '') + esc(place(route.to)) + '</span>' +
        '<span class="trip__price">' + euroHtml(route.eur) + '</span>' +
        '<span class="trip__bar" style="--k:' + (route.km / farthest).toFixed(3) + '"><span class="trip__fill"></span></span>' +
        '<span class="trip__km">' + route.km + ' ' + esc(t('km')) + '</span>' +
      '</button></li>';
    }).join('');
  }

  function priceDigitsHtml(slot, eur, animate) {
    var number = String(eur);
    var previous = lastPrice[slot] || '';
    var offset = previous.length - number.length;
    var digits = number.split('').map(function (c, i) {
      var rolling = animate && !reducedMotion && previous.charAt(i + offset) !== c;
      return '<span class="digit' + (rolling ? ' is-rolling' : '') + '"' +
        (rolling ? ' style="animation-delay:' + (number.length - 1 - i) * 50 + 'ms"' : '') + '>' + esc(c) + '</span>';
    }).join('');
    lastPrice[slot] = number;
    return '<span class="eur">€</span>' + digits;
  }

  var photoCache = {};
  function showTripPhoto(key) {
    var id = (STORY.places[key] || {}).img;
    var box = $('tripPhoto');
    if (!id) return;
    box.querySelectorAll('img').forEach(function (img) { img.classList.toggle('is-on', img.dataset.id === id); });
    if (photoCache[id]) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = photoHtml(id, '', '(min-width: 1000px) 40vw, 100vw', true);
    var img = wrap.firstChild;
    img.dataset.id = id;
    photoCache[id] = img;
    img.addEventListener('load', function () {
      if (STORY.places[tripKey] && STORY.places[tripKey].img === id) img.classList.add('is-on');
    });
    box.appendChild(img);
  }

  function carWidth() { return trackCar.getBoundingClientRect().width; }
  function endOf(route) { var s = carWidth(); return s + (track.clientWidth - s) * route.km / farthestKm(); }
  function placeCar(x, km) {
    track.style.setProperty('--x', x.toFixed(1) + 'px');
    $('tripKm').textContent = Math.round(km) + ' ' + t('km');
  }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function labelTrip(route) {
    tripKey = route.to;
    $('tripFrom').textContent = place('skopje');
    $('tripTo').textContent = place(route.to);
    track.style.setProperty('--end', endOf(route).toFixed(1) + 'px');
    abroadList.querySelectorAll('.trip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.to === route.to ? 'true' : 'false');
    });
    showTripPhoto(route.to);
    window.dispatchEvent(new CustomEvent('trip:change', { detail: { key: route.to } }));
  }

  function arrive(route, animate) {
    placeCar(endOf(route), route.km);
    track.classList.add('is-arrived');
    journey.classList.remove('is-driving');
    $('tripPrice').innerHTML = priceDigitsHtml('trip', route.eur, animate);
  }

  function drive(route, delay) {
    cancelAnimationFrame(tripFrame);
    clearTimeout(tripTimer);
    clearTimeout(dwellTimer);
    labelTrip(route);
    if (reducedMotion) { arrive(route, false); return; }
    $('tripPrice').innerHTML = priceDigitsHtml('trip', route.eur, true);
    track.classList.remove('is-arrived');
    journey.classList.add('is-driving');
    var from = carWidth();
    placeCar(from, 0);
    var duration = Math.round(DRIVE_BASE + route.km / farthestKm() * DRIVE_SPAN);
    tripTimer = setTimeout(function () {
      var start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / duration, 1);
        var e = easeInOut(p);
        placeCar(from + (endOf(route) - from) * e, route.km * e);
        if (p < 1) tripFrame = requestAnimationFrame(tick);
        else { arrive(route, true); queueNext(); }
      })(start);
    }, delay || 0);
  }

  function nextTrip() {
    var routes = abroadRoutes();
    for (var i = 0; i < routes.length; i++) if (routes[i].to === tripKey) return routes[(i + 1) % routes.length];
    return routes[0];
  }

  function queueNext() {
    clearTimeout(dwellTimer);
    if (!autoplay || !wide.matches) return;
    dwellTimer = setTimeout(function tryNext() {
      if (holds.hover || holds.offscreen || document.hidden) { dwellTimer = setTimeout(tryNext, 600); return; }
      drive(nextTrip());
    }, TRIP_DWELL);
  }

  function pickTrip(key) {
    autoplay = false;
    journey.setAttribute('aria-live', 'polite');
    tripStarted = true;
    drive(findTrip(key));
  }

  function refreshTrip() {
    var route = findTrip(tripKey);
    labelTrip(route);
    if (!tripStarted) {
      $('tripPrice').innerHTML = priceDigitsHtml('trip', route.eur, false);
      placeCar(carWidth(), 0);
      return;
    }
    if (!journey.classList.contains('is-driving')) arrive(route, false);
  }

  function renderSigns() {
    var picks = abroadRoutes().filter(function (r) { return !/Airport$/.test(r.to); });
    $('signs').innerHTML = picks.map(function (r, i) {
      return '<div class="rsign" data-i="' + i + '"><b>' + esc(place(r.to)) + '</b><span><span>' + (i % 2 ? '↗' : '↖') + '</span><span>' + r.km + ' ' + esc(t('km')) + '</span></span></div>';
    }).join('');
  }

  function renderStops() {
    var chapters = document.querySelectorAll('[data-chapter]');
    $('stops').innerHTML = Array.prototype.map.call(chapters, function (sec) {
      return '<li><button type="button" tabindex="-1" data-go="' + sec.id + '"><span>' + esc(t(sec.dataset.chapter)) + '</span><i></i></button></li>';
    }).join('');
  }

  function renderWall() {
    var cols = document.querySelectorAll('.depart__col');
    if (cols[0].children.length) return;
    cols.forEach(function (col, c) {
      var ids = STORY.wall.filter(function (_, i) { return i % cols.length === c; });
      var html = ids.map(function (id) {
        return '<img src="' + STORY.photo(id, 500) + '" alt="" loading="lazy" decoding="async" />';
      }).join('');
      col.innerHTML = html + html;
    });
  }

  var PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';

  function renderDial() {
    dialLead.textContent = isPhone ? '' : t('dial.lead.desk');
    dialLead.hidden = isPhone;
    dial.classList.toggle('is-phone', isPhone);
    dialList.innerHTML = SITE.drivers.map(function (driver, i) {
      var name = pick(driver.name);
      var inner = '<span class="dial__initial" aria-hidden="true">' + esc(name.charAt(0)) + '</span>' +
        '<span class="dial__who"><span class="dial__name">' + esc(name) + '</span>' +
        '<span class="dial__num">' + esc(driver.phone.display) + '</span></span>';
      if (!isPhone) return '<li><div class="dial__row dial__row--info">' + inner + '</div></li>';
      return '<li><a class="dial__row" href="tel:' + esc(driver.phone.number) + '" data-dial="' + i + '" aria-label="' +
        esc(t('dial.call').replace('{name}', name) + ' ' + driver.phone.display) + '">' + inner +
        '<span class="dial__go" aria-hidden="true">' + PHONE_ICON + '</span></a></li>';
    }).join('');
  }

  function openDial() {
    renderDial();
    if (typeof dial.showModal === 'function') dial.showModal(); else dial.setAttribute('open', '');
    root.classList.add('has-dial');
  }
  function closeDial() {
    if (!dial.open) return;
    if (typeof dial.close === 'function') dial.close();
    else { dial.removeAttribute('open'); root.classList.remove('has-dial'); }
  }

  function bindContacts() {
    document.querySelectorAll('[data-whatsapp]').forEach(function (el) { el.href = 'https://wa.me/' + SITE.whatsapp.number; });
    document.querySelectorAll('[data-call]').forEach(function (el) { el.setAttribute('aria-haspopup', 'dialog'); });
    document.querySelectorAll('[data-instagram]').forEach(function (el) { el.href = SITE.social.instagram.url; });
    if (dial.open) renderDial();
  }

  function render() {
    translatePage();
    document.querySelectorAll('[data-car-model]').forEach(function (el) { el.textContent = SITE.car.model; });
    fillPhotos();
    renderHero();
    renderDrivers();
    renderFares();
    showFare(fareIndex, false);
    renderTours();
    renderAbroad();
    refreshTrip();
    renderSigns();
    renderStops();
    renderWall();
    bindContacts();
    if (!revealObserver || reducedMotion) {
      document.querySelectorAll('[data-split], [data-rise], .sign, .photo-in, .trips').forEach(function (el) { el.classList.add('is-in'); });
    } else {
      document.querySelectorAll('[data-split], [data-rise], .sign, .trips').forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < innerHeight && box.bottom > 0 && el.closest('.hero')) el.classList.add('is-in');
      });
      watchReveals();
    }
    onScroll();
    window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang: lang } }));
  }

  function setLanguage(next) {
    if (next === lang) return;
    lang = next;
    saveLanguage();
    closeMenu();
    document.body.classList.add('is-switching');
    setTimeout(function () {
      render();
      document.querySelectorAll('[data-split]').forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < innerHeight && box.bottom > 0) requestAnimationFrame(function () { el.classList.add('is-in'); });
      });
      document.body.classList.remove('is-switching');
    }, 180);
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    root.classList.remove('has-menu');
  }

  var drive$ = $('pat');
  var air = $('ceni');
  var flightPath = $('flightPath');
  var plane = $('plane');

  function onScroll() {
    var doc = root.scrollHeight - innerHeight;
    var p = doc > 0 ? scrollY / doc : 0;
    if (reducedMotion) return;

    var hb = hero.getBoundingClientRect();
    if (hb.bottom > 0) {
      road.target = 0.13 + clamp(-hb.top / Math.max(1, hb.height - innerHeight), 0, 1) * 0.82;
      steerTcar();
    }

    var wb = $('vozaci').getBoundingClientRect();
    if (wb.bottom > 0 && wb.top < innerHeight) m2Tick(clamp(-wb.top / Math.max(1, wb.height - innerHeight), 0, 1));

    var abox = air.getBoundingClientRect();
    if (abox.bottom > 0 && abox.top < innerHeight) {
      var photo = air.querySelector('.air__photo img');
      if (photo) photo.style.setProperty('--py', (abox.top * -0.15).toFixed(1));
      var ap = clamp((innerHeight - abox.top) / (innerHeight * 1.3), 0, 1);
      placePlane(ap);
    }

    var dbox = drive$.getBoundingClientRect();
    if (dbox.bottom > 0 && dbox.top < innerHeight) {
      var dp = clamp(-dbox.top / Math.max(1, dbox.height - innerHeight), 0, 1);
      drive$.style.setProperty('--dp', dp.toFixed(4));
      $('driveKm').textContent = Math.round(easeInOut(dp) * farthestKm());
      moveSigns(dp);
    }
  }

  function placePlane(p) {
    var len = flightPath.getTotalLength();
    var svg = flightPath.ownerSVGElement;
    var sbox = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var sx = sbox.width / vb.width;
    var sy = sbox.height / vb.height;
    var a = flightPath.getPointAtLength(len * p);
    var b = flightPath.getPointAtLength(Math.min(len, len * p + 2));
    var angle = Math.atan2((b.y - a.y) * sy, (b.x - a.x) * sx) * 180 / Math.PI + 90;
    plane.style.transform = 'translate(' + (a.x * sx).toFixed(1) + 'px,' + (a.y * sy).toFixed(1) + 'px) translate(-50%,-50%) rotate(' + angle.toFixed(1) + 'deg)';
  }

  function moveSigns(p) {
    var signs = $('signs').children;
    var n = signs.length;
    var narrow = innerWidth < 720;
    Array.prototype.forEach.call(signs, function (sign, i) {
      var local = p * (n + 2) - i;
      var z = -2400 + local * 1300;
      var side = i % 2 ? 1 : -1;
      var spread = narrow ? 70 : 220;
      var x = side * (spread + Math.max(0, local) * (narrow ? 60 : 160));
      var y = -40 + Math.max(0, local) * -30;
      var o = clamp(local + 0.6, 0, 1) * clamp(1.8 - local, 0, 1);
      sign.style.setProperty('--z', z.toFixed(0));
      sign.style.setProperty('--sx', x.toFixed(0));
      sign.style.setProperty('--sy', y.toFixed(0));
      sign.style.setProperty('--o', o.toFixed(3));
    });
  }

  function tiltOn(el, target) {
    if (!finePointer || reducedMotion) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      (target || el).style.setProperty('--ty', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      (target || el).style.setProperty('--tx', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    el.addEventListener('pointerleave', function () {
      (target || el).style.setProperty('--ty', 0);
      (target || el).style.setProperty('--tx', 0);
    });
  }

  function magnet(el) {
    if (!finePointer || reducedMotion) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.25;
      var y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  fareList.addEventListener('click', function (e) {
    var b = e.target.closest('.fare');
    if (b && Number(b.dataset.fare) !== fareIndex) showFare(Number(b.dataset.fare), true);
  });

  abroadList.addEventListener('click', function (e) {
    var b = e.target.closest('.trip');
    if (!b) return;
    pickTrip(b.dataset.to);
    if (!wide.matches || journey.getBoundingClientRect().top < 80) {
      journey.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
  });

  window.addEventListener('map:pick', function (e) { pickTrip(e.detail.key); });

  var peek = $('peek');
  var peekImg = $('peekImg');
  if (finePointer && !reducedMotion) {
    abroadList.addEventListener('pointermove', function (e) {
      var b = e.target.closest('.trip');
      if (!b) { peek.classList.remove('is-on'); return; }
      var id = (STORY.places[b.dataset.to] || {}).img;
      if (id && peekImg.dataset.id !== id) {
        peekImg.dataset.id = id;
        peekImg.innerHTML = '<img src="' + STORY.photo(id, 480) + '" alt="" />';
      }
      peek.style.setProperty('--x', (e.clientX + 24) + 'px');
      peek.style.setProperty('--y', (e.clientY - 190) + 'px');
      peek.classList.toggle('is-on', !!id);
    });
    abroadList.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); });
  }

  [journey, abroadList, $('globe')].forEach(function (el) {
    el.addEventListener('mouseenter', function () { holds.hover = true; });
    el.addEventListener('mouseleave', function () { holds.hover = false; });
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-call]')) { e.preventDefault(); closeMenu(); openDial(); return; }
    if (e.target.closest('[data-dial-close]')) { closeDial(); return; }
    if (e.target.closest('[data-dial]')) setTimeout(closeDial, 400);
    var go = e.target.closest('[data-go]');
    if (go) $(go.dataset.go).scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  dial.addEventListener('click', function (e) { if (e.target === dial) closeDial(); });
  dial.addEventListener('close', function () { root.classList.remove('has-dial'); });

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.fan__card, .m2__angles [data-card]');
    if (card) fanTo(+card.dataset.card);
  });
  (function () {
    var fan = $('fan');
    var startX = null;
    fan.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    fan.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) fanTo(fanOrder[dx < 0 ? 1 : 2]);
    });
    fan.addEventListener('pointercancel', function () { startX = null; });
  })();
  [$('dudeM'), $('dudeI')].forEach(function (fig) {
    fig.addEventListener('click', function () { waveOnce(fig); });
  });

  document.querySelectorAll('.faq__q').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.closest('.faq__item').classList.toggle('is-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLanguage(b.dataset.lang); });
  });

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('has-menu', open);
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  var hero = $('pocetna');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroPaused = !entries[0].isIntersecting;
    }).observe(hero);
  }
  document.querySelectorAll('.faq__photo').forEach(function (el) { tiltOn(el); });
  document.querySelectorAll('[data-magnet]').forEach(magnet);

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; onScroll(); });
  }, { passive: true });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { buildRoad(); m2Layout(); refreshTrip(); onScroll(); }, 120);
  });
  window.addEventListener('load', function () { buildRoad(); m2Layout(); onScroll(); });
  if (document.fonts) document.fonts.ready.then(buildRoad);

  if ('IntersectionObserver' in window) {

    new IntersectionObserver(function (entries) {
      holds.offscreen = !entries[0].isIntersecting;
      if (entries[0].isIntersecting && !tripStarted) {
        tripStarted = true;
        drive(findTrip(tripKey), 300);
      }
    }, { threshold: 0.45 }).observe(journey);

    var navLinks = nav.querySelectorAll('a');
    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        var navId = { turi: 'ceni', pat: 'patuvanja', prashanja: 'patuvanja' }[id] || id;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + navId); });
        document.querySelectorAll('[data-go]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.go === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-chapter]').forEach(function (sec) { chapterObserver.observe(sec); });
  } else {
    holds.offscreen = false;
    tripStarted = true;
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  $('year').textContent = new Date().getFullYear();
  render();
})();
