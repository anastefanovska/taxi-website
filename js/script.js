(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var SWITCH_DELAY = 180;
  var SWAP_DELAY = 160;
  var DIGIT_STAGGER = 30;
  var DRIVE_BASE = 1100;
  var DRIVE_SPAN = 1900;
  var SCROLL_WAIT = 380;
  var REVEAL_STAGGER = 80;
  var REVEAL_FAILSAFE = 1500;
  var THREAD_RADIUS = 22;
  var THREAD_CURVE_STEPS = 8;
  var FIRST_TRIP = 'thessaloniki';
  var TRIP_DWELL = 1500;
  var LAYOUT_SETTLE = 150;
  var KM_BASE = 1200;
  var KM_SPAN = 1800;
  var RAIL_AT = 0.6;
  var SEEN_STAGGER = 90;

  var lang = readSavedLanguage();
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fareIndex = 0;
  var driverIndex = 0;
  var driverToken = 0;
  var tripKey = FIRST_TRIP;
  var tripStarted = false;
  var tripFrame = null;
  var tripTimer = null;
  var autoplay = !reducedMotion;
  var dwellTimer = null;
  var dwellLeft = 0;
  var dwellStart = 0;
  var holds = { hover: false, focus: false, offscreen: true };
  var lastPrice = {};
  var threadSamples = [];
  var threadLength = 0;
  var railStops = [];
  var railStart = 0;
  var railEnd = 0;
  var seen = {};
  var counted = {};

  var main = document.getElementById('main');
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  var wide = window.matchMedia('(min-width: 900px)');

  var fareFrom = document.getElementById('fareFrom');
  var fareTo = document.getElementById('fareTo');
  var farePrice = document.getElementById('farePrice');
  var fareList = document.getElementById('fareList');

  var stage = document.getElementById('stage');
  var driverNames = document.getElementById('driverNames');
  var driverImg = document.getElementById('driverImg');
  var carImg = document.getElementById('carImg');
  var carModel = document.getElementById('carModel');
  var driverName = document.getElementById('driverName');
  var driverLine = document.getElementById('driverLine');
  var crew = document.getElementById('crew');

  var journey = document.getElementById('journey');
  var track = document.getElementById('track');
  var trackCar = document.getElementById('trackCar');
  var tripFrom = document.getElementById('tripFrom');
  var tripTo = document.getElementById('tripTo');
  var tripPrice = document.getElementById('tripPrice');
  var tripKm = document.getElementById('tripKm');
  var abroadList = document.getElementById('abroad');

  var thread = document.getElementById('thread');
  var threadBase = document.getElementById('threadBase');
  var threadDrawn = document.getElementById('threadDrawn');
  var threadHead = document.getElementById('threadHead');
  var threadEnd = document.getElementById('threadEnd');
  var rail = document.getElementById('rail');
  var railFill = document.getElementById('railFill');

  function readSavedLanguage() {
    try {
      return localStorage.getItem('lang') === 'en' ? 'en' : 'mk';
    } catch (e) {
      return 'mk';
    }
  }

  function saveLanguage() {
    try {
      localStorage.setItem('lang', lang);
    } catch (e) {}
  }

  function t(key) {
    return TEXT[lang][key];
  }

  function pick(value) {
    return Array.isArray(value) ? value[lang === 'en' ? 1 : 0] : value;
  }

  function place(key) {
    return pick(PRICES.places[key]);
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function euroHtml(eur) {
    return '<span class="eur">€</span>' + esc(String(eur));
  }

  function routesOf(type) {
    return PRICES.routes.filter(function (route) { return route.type === type; });
  }

  function abroadRoutes() {
    return routesOf('international').slice().sort(function (a, b) { return a.km - b.km; });
  }

  function findTrip(key) {
    return abroadRoutes().filter(function (route) { return route.to === key; })[0];
  }

  function farthestKm() {
    var routes = abroadRoutes();
    return routes[routes.length - 1].km;
  }

  function priceDigitsHtml(slot, eur, animate) {
    var number = String(eur);
    var previous = lastPrice[slot] || '';
    var offset = previous.length - number.length;
    var digits = number.split('').map(function (char, i) {
      var rolling = animate && !reducedMotion && previous.charAt(i + offset) !== char;
      var style = rolling ? ' style="animation-delay:' + (number.length - 1 - i) * DIGIT_STAGGER + 'ms"' : '';
      return '<span class="digit' + (rolling ? ' is-rolling' : '') + '"' + style + '>' + esc(char) + '</span>';
    }).join('');
    lastPrice[slot] = number;
    return '<span class="eur">€</span>' + digits;
  }

  function reveal(el) {
    if (reducedMotion || !el.animate) return;
    el.animate(
      [
        { opacity: 0, transform: 'translateY(0.4em)', clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0)' }
      ],
      { duration: 560, easing: 'cubic-bezier(.2, .8, .2, 1)' }
    );
  }

  function nudge(el) {
    if (reducedMotion || !el.animate) return;
    el.animate(
      [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' }
    );
  }

  var PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-1.8l-7.9-4.9V3.4a1.6 1.6 0 0 0-3.2 0v5.4L2 13.7v1.8l7.9-2.4v5.3l-2.2 1.6v1.5l3.8-1.1 3.8 1.1v-1.5l-2.2-1.6v-5.3z"/></svg>';

  function fareGroupHtml(route) {
    var landing = route.from === 'airport';
    return (
      '<li class="fares__group' + (landing ? ' fares__group--landing' : '') + '">' +
        '<span class="fares__icon">' + PLANE + '</span>' +
        '<span class="fares__title">' + esc(t(landing ? 'fare.fromAirport' : 'fare.toAirport')) + '</span>' +
      '</li>' +
      '<li class="fares__label">' + esc(t(landing ? 'fare.to' : 'fare.from')) + '</li>'
    );
  }

  function renderFares() {
    var routes = routesOf('airport');
    var from = null;
    fareList.innerHTML = routes.map(function (route, i) {
      var group = route.from !== from ? fareGroupHtml(route) : '';
      var last = i === routes.length - 1 || routes[i + 1].from !== route.from;
      from = route.from;
      return group + (
        '<li' + (last ? ' class="fares__end"' : '') + '>' +
          '<button class="fare" type="button" data-fare="' + i + '" aria-pressed="' + (i === fareIndex) + '">' +
            '<span class="fare__route">' +
              '<span class="fare__to">' + esc(place(route.from === 'airport' ? route.to : route.from)) + '</span>' +
            '</span>' +
            '<span class="fare__price">' + euroHtml(route.eur) + '</span>' +
          '</button>' +
        '</li>'
      );
    }).join('');
  }

  function showFare(index, animate) {
    var route = routesOf('airport')[index];
    var changedFrom = fareFrom.textContent !== place(route.from);
    fareIndex = index;
    fareFrom.textContent = place(route.from);
    fareTo.textContent = place(route.to);
    farePrice.innerHTML = priceDigitsHtml('fare', route.eur, animate);
    fareList.querySelectorAll('.fare').forEach(function (button) {
      button.setAttribute('aria-pressed', Number(button.dataset.fare) === index ? 'true' : 'false');
    });
    if (!animate) return;
    if (changedFrom) nudge(fareFrom);
    nudge(fareTo);
  }

  function tourTitleHtml(tour) {
    if (tour.via) {
      return tour.via.map(function (key) { return esc(place(key)); }).join(' <span class="arrow">→</span> ');
    }
    return esc(pick(tour.title));
  }

  function tourSubHtml(tour) {
    if (tour.note) return '<p class="tour__sub">' + esc(pick(tour.note)) + '</p>';
    if (tour.stops) {
      return '<ul class="tour__sub tour__stops">' + tour.stops.map(function (stop) {
        return '<li>' + esc(pick(stop)) + '</li>';
      }).join('') + '</ul>';
    }
    return '';
  }

  function renderTours() {
    document.getElementById('tours').innerHTML = routesOf('private').map(function (tour) {
      var price = tour.quote
        ? '<p class="tour__price tour__price--quote">' + esc(t('price.quote')) + '</p>'
        : '<p class="tour__price">' + euroHtml(tour.eur) + '</p>';
      return (
        '<li class="tour">' +
          '<div>' +
            '<p class="tour__title">' + tourTitleHtml(tour) + '</p>' +
            tourSubHtml(tour) +
          '</div>' +
          price +
        '</li>'
      );
    }).join('');
  }

  function renderDriverNames() {
    driverNames.innerHTML = SITE.drivers.map(function (driver, i) {
      return (
        '<button class="chip" type="button" data-driver="' + i + '" aria-pressed="' + (i === driverIndex) + '">' +
          '<img class="chip__photo" src="' + esc(driver.photo) + '" alt="" style="object-position:' + esc(driver.focus || 'center') + '" />' +
          '<span class="chip__name">' + esc(pick(driver.name)) + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function fillDriver() {
    var driver = SITE.drivers[driverIndex];
    var car = driver.car;
    driverImg.src = driver.photo;
    driverImg.alt = pick(driver.name);
    driverImg.style.objectPosition = driver.focus || '';
    carImg.src = car.photo;
    carImg.alt = pick(car.model) + ' — ' + pick(driver.name);
    carImg.style.objectPosition = car.focus || '';
    carModel.textContent = pick(car.model);
    driverName.textContent = pick(driver.name);
    driverLine.textContent = pick(driver.line);
  }

  function preload(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function setDriver(index) {
    if (index === driverIndex) return;
    driverIndex = index;
    driverNames.querySelectorAll('.chip').forEach(function (button) {
      button.setAttribute('aria-pressed', Number(button.dataset.driver) === index ? 'true' : 'false');
    });
    if (reducedMotion) {
      fillDriver();
      return;
    }
    var token = ++driverToken;
    var driver = SITE.drivers[index];
    stage.classList.remove('is-first');
    stage.classList.add('is-swapping');
    Promise.all([preload(driver.photo), preload(driver.car.photo), wait(SWAP_DELAY)]).then(function () {
      if (token !== driverToken) return;
      fillDriver();
      requestAnimationFrame(function () { stage.classList.remove('is-swapping'); });
    });
  }

  function renderCrew() {
    crew.innerHTML = SITE.drivers.map(function (driver, i) {
      var car = driver.car;
      return (
        '<article class="crew__item" data-seen="driver-' + i + '">' +
          '<figure class="crew__portrait photo"><img src="' + esc(driver.photo) + '" alt="' + esc(pick(driver.name)) + '" width="1200" height="800" loading="lazy" style="object-position:' + esc(driver.focus || 'center') + '" /></figure>' +
          '<div class="crew__info">' +
            '<p class="crew__name">' + esc(pick(driver.name)) + '</p>' +
            '<p class="crew__model">' + esc(pick(car.model)) + '</p>' +
            '<p class="crew__line">' + esc(pick(driver.line)) + '</p>' +
          '</div>' +
          '<figure class="crew__car photo"><img src="' + esc(car.photo) + '" alt="' + esc(pick(car.model) + ' — ' + pick(driver.name)) + '" width="1800" height="1200" loading="lazy" style="object-position:' + esc(car.focus || 'center') + '" /></figure>' +
        '</article>'
      );
    }).join('');
    watchSeen(crew);
  }

  var PLANE = '<svg class="trip__plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';

  var TAXI = '<svg viewBox="0 0 24 13" aria-hidden="true"><g transform="matrix(-1 0 0 1 24 0)">' +
    '<rect class="track__car-light" x="10.5" y="0.5" width="4" height="2" rx="0.6"/>' +
    '<path class="track__car-body" d="M2 9.6V8.2c0-.8.6-1.5 1.4-1.6L7 6l2.7-2.7c.4-.4.9-.6 1.4-.6h4.3c.6 0 1.1.3 1.5.7L19.5 6l2.1.4c.8.2 1.4.9 1.4 1.7v1.5c0 .5-.4.9-.9.9H2.9c-.5 0-.9-.4-.9-.9z"/>' +
    '<circle class="track__wheel" cx="7" cy="10.5" r="2"/><circle class="track__wheel" cx="18" cy="10.5" r="2"/>' +
    '</g></svg>';

  function renderAbroad() {
    var farthest = farthestKm();
    var counting = kmObserver && !wide.matches;
    abroadList.innerHTML = (
      '<li class="trips__head">' +
        '<span class="trips__icon">' + TAXI + '</span>' +
        '<span class="trips__title">' + esc(t('fare.from') + ' ' + place('skopje')) + '</span>' +
      '</li>' +
      '<li class="trips__label">' + esc(t('fare.to')) + '</li>'
    ) + abroadRoutes().map(function (route) {
      var share = route.km / farthest;
      return (
        '<li>' +
          '<button class="trip' + (/Airport$/.test(route.to) ? ' trip--airport' : '') + '" type="button" data-to="' + route.to + '" aria-pressed="' + (route.to === tripKey) + '">' +
            '<span class="trip__city">' + (/Airport$/.test(route.to) ? PLANE : '') + esc(place(route.to)) + '</span>' +
            '<span class="trip__price">' + euroHtml(route.eur) + '</span>' +
            '<span class="trip__bar" style="--k:' + share.toFixed(3) + '"><span class="trip__fill"></span></span>' +
            '<span class="trip__km">' + esc((counting && !counted[route.to] ? 0 : route.km) + ' ' + t('km')) + '</span>' +
          '</button>' +
        '</li>'
      );
    }).join('');
    if (!counting) return;
    abroadList.querySelectorAll('.trip').forEach(function (row) {
      if (!counted[row.dataset.to]) kmObserver.observe(row);
    });
  }

  function countKm(row) {
    var route = findTrip(row.dataset.to);
    var duration = KM_BASE + route.km / farthestKm() * KM_SPAN;
    var start = performance.now();
    counted[route.to] = true;
    row.classList.add('is-counting');
    (function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 2);
      row.querySelector('.trip__km').textContent = Math.round(route.km * eased) + ' ' + t('km');
      if (progress < 1) requestAnimationFrame(tick);
      else row.classList.remove('is-counting');
    })(start);
  }

  function carWidth() {
    return trackCar.getBoundingClientRect().width;
  }

  function endOf(route) {
    var start = carWidth();
    return start + (track.clientWidth - start) * route.km / farthestKm();
  }

  function placeCar(x, km) {
    track.style.setProperty('--x', x.toFixed(1) + 'px');
    tripKm.textContent = Math.round(km) + ' ' + t('km');
  }

  function easeInOut(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  function arrive(route, animate) {
    placeCar(endOf(route), route.km);
    track.classList.add('is-arrived');
    journey.classList.remove('is-driving');
    tripPrice.innerHTML = priceDigitsHtml('trip', route.eur, animate);
  }

  function labelTrip(route) {
    tripKey = route.to;
    tripFrom.textContent = place('skopje');
    tripTo.textContent = place(route.to);
    track.style.setProperty('--end', endOf(route).toFixed(1) + 'px');
    abroadList.querySelectorAll('.trip').forEach(function (button) {
      button.setAttribute('aria-pressed', button.dataset.to === route.to ? 'true' : 'false');
    });
  }

  function parkAtStart(route) {
    labelTrip(route);
    tripPrice.innerHTML = priceDigitsHtml('trip', route.eur, false);
    placeCar(carWidth(), 0);
    track.classList.remove('is-arrived');
    journey.classList.add('is-driving');
  }

  function drive(route, delay) {
    cancelAnimationFrame(tripFrame);
    clearTimeout(tripTimer);
    labelTrip(route);
    if (reducedMotion) {
      arrive(route, false);
      return;
    }
    stopDwell();
    reveal(tripTo);
    tripPrice.innerHTML = priceDigitsHtml('trip', route.eur, true);
    track.classList.remove('is-arrived');
    journey.classList.add('is-driving');
    var from = carWidth();
    placeCar(from, 0);
    var duration = Math.round(DRIVE_BASE + route.km / farthestKm() * DRIVE_SPAN);

    tripTimer = setTimeout(function () {
      var start = performance.now();
      (function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = easeInOut(progress);
        placeCar(from + (endOf(route) - from) * eased, route.km * eased);
        if (progress < 1) {
          tripFrame = requestAnimationFrame(tick);
        } else {
          arrive(route, true);
          queueNextTrip();
        }
      })(start);
    }, delay || 0);
  }

  function startTrips() {
    if (tripStarted) return;
    tripStarted = true;
    drive(findTrip(tripKey));
  }

  function nextTrip() {
    var routes = abroadRoutes();
    for (var i = 0; i < routes.length; i++) {
      if (routes[i].to === tripKey) return routes[(i + 1) % routes.length];
    }
    return routes[0];
  }

  function isHeld() {
    return holds.hover || holds.focus || holds.offscreen || document.hidden;
  }

  function stopDwell() {
    clearTimeout(dwellTimer);
    dwellTimer = null;
    dwellLeft = 0;
  }

  function resumeDwell() {
    if (dwellTimer || !dwellLeft || isHeld()) return;
    dwellStart = performance.now();
    dwellTimer = setTimeout(function () {
      dwellTimer = null;
      dwellLeft = 0;
      if (autoplay && wide.matches) drive(nextTrip());
    }, dwellLeft);
  }

  function pauseDwell() {
    if (!dwellTimer) return;
    clearTimeout(dwellTimer);
    dwellTimer = null;
    dwellLeft = Math.max(0, dwellLeft - (performance.now() - dwellStart));
  }

  function queueNextTrip() {
    if (!autoplay || !wide.matches) return;
    stopDwell();
    dwellLeft = TRIP_DWELL;
    resumeDwell();
  }

  function updateHold() {
    if (isHeld()) pauseDwell();
    else resumeDwell();
  }

  function setAutoplay(on) {
    autoplay = on;
    journey.setAttribute('aria-live', on ? 'off' : 'polite');
    if (!on) stopDwell();
  }

  function pickTrip(key) {
    setAutoplay(false);
    tripStarted = true;
    var box = journey.getBoundingClientRect();
    var hidden = box.top < header.getBoundingClientRect().bottom || box.bottom > window.innerHeight;
    if (hidden) {
      journey.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
    drive(findTrip(key), hidden ? SCROLL_WAIT : 0);
  }

  function refreshTrip() {
    var route = findTrip(tripKey);
    if (journey.classList.contains('is-driving') && tripStarted) return;
    if (!tripStarted) {
      parkAtStart(route);
      return;
    }
    labelTrip(route);
    arrive(route, false);
  }

  function relativeCenter(el, base) {
    var box = el.getBoundingClientRect();
    return { x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top };
  }

  function buildThread() {
    if (!wide.matches) {
      thread.setAttribute('hidden', '');
      threadSamples = [];
      return;
    }
    thread.removeAttribute('hidden');

    var base = main.getBoundingClientRect();
    var container = document.querySelector('#ceni .container');
    var contentLeft = container.getBoundingClientRect().left + parseFloat(getComputedStyle(container).paddingLeft) - base.left;
    var mx = contentLeft - Math.min(44, contentLeft / 2);
    var r = Math.min(THREAD_RADIUS, contentLeft - mx - 2);
    var dot = r < THREAD_RADIUS ? 4 : 6;
    threadEnd.setAttribute('r', dot);
    threadHead.setAttribute('r', dot - 1);

    var points = Array.prototype.filter.call(document.querySelectorAll('[data-thread]'), function (el) {
      return el.getClientRects().length > 0;
    }).map(function (el) {
      return relativeCenter(el, base);
    });
    var endEl = document.querySelector('[data-thread-end]');
    var endBox = endEl.getBoundingClientRect();
    var endY = endBox.top - base.top + parseFloat(getComputedStyle(endEl).fontSize) * 0.5;

    var at = points[0];
    var d = 'M' + at.x + ' ' + at.y;
    var length = 0;
    var samples = [{ s: 0, x: at.x, y: at.y }];
    function to(x, y) {
      length += Math.sqrt((x - at.x) * (x - at.x) + (y - at.y) * (y - at.y));
      at = { x: x, y: y };
      samples.push({ s: length, x: x, y: y });
    }
    function line(x, y) {
      d += ' L' + x + ' ' + y;
      to(x, y);
    }
    function curve(cx, cy, x, y) {
      var x0 = at.x;
      var y0 = at.y;
      d += ' Q' + cx + ' ' + cy + ' ' + x + ' ' + y;
      for (var k = 1; k <= THREAD_CURVE_STEPS; k++) {
        var t = k / THREAD_CURVE_STEPS;
        var u = 1 - t;
        to(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y);
      }
    }
    function down(toY) {
      var y = at.y;
      line(mx + r, y);
      curve(mx, y, mx, y + r);
      line(mx, toY - r);
    }
    for (var i = 1; i < points.length; i++) {
      var p = points[i];
      down(p.y);
      curve(mx, p.y, mx + r, p.y);
      line(p.x, p.y);
    }
    down(endY + r);

    thread.setAttribute('height', main.offsetHeight);
    thread.setAttribute('width', main.offsetWidth);
    threadBase.setAttribute('d', d);
    threadDrawn.setAttribute('d', d);
    threadEnd.setAttribute('cx', mx);
    threadEnd.setAttribute('cy', endY);

    threadLength = length;
    threadDrawn.style.strokeDasharray = threadLength;
    threadSamples = samples;
    drawThread();
  }

  function drawThread() {
    if (thread.hasAttribute('hidden') || !threadSamples.length) return;
    var target = reducedMotion
      ? Infinity
      : window.innerHeight * 0.62 - main.getBoundingClientRect().top;
    var lo = 0;
    var hi = threadSamples.length - 1;
    if (threadSamples[0].y > target) {
      hi = -1;
    } else {
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        if (threadSamples[mid].y <= target) lo = mid; else hi = mid - 1;
      }
    }
    var sample = hi < 0 ? threadSamples[0] : threadSamples[hi];
    var next = threadSamples[hi + 1];
    var f = hi >= 0 && next && next.y > sample.y ? Math.min((target - sample.y) / (next.y - sample.y), 1) : 0;
    var drawn = hi < 0 ? 0 : sample.s + (next ? (next.s - sample.s) * f : 0);
    var done = drawn >= threadLength - 1;
    threadDrawn.style.strokeDashoffset = threadLength - drawn;
    threadHead.setAttribute('cx', next ? sample.x + (next.x - sample.x) * f : sample.x);
    threadHead.setAttribute('cy', next ? sample.y + (next.y - sample.y) * f : sample.y);
    threadHead.classList.toggle('is-hidden', hi < 0 || done);
    threadEnd.classList.toggle('is-reached', done);
  }

  function buildRail() {
    if (wide.matches) {
      rail.setAttribute('hidden', '');
      railStops = [];
      return;
    }
    rail.removeAttribute('hidden');
    var base = main.getBoundingClientRect();
    var endEl = document.querySelector('[data-thread-end]');
    railStart = document.getElementById('pocetna').getBoundingClientRect().bottom - base.top;
    railEnd = endEl.getBoundingClientRect().top - base.top + parseFloat(getComputedStyle(endEl).fontSize) * 0.5;
    railStops = Array.prototype.filter.call(document.querySelectorAll('[data-stop]'), function (el) {
      return el.getClientRects().length > 0;
    }).map(function (el) {
      return { el: el, y: el.getBoundingClientRect().top - base.top + parseFloat(getComputedStyle(el, '::before').top) };
    });
    rail.style.top = railStart + 'px';
    rail.style.height = railEnd - railStart + 'px';
    drawRail();
  }

  function drawRail() {
    if (!railStops.length) return;
    var target = reducedMotion
      ? Infinity
      : window.innerHeight * RAIL_AT - main.getBoundingClientRect().top;
    var reached = railStart;
    railStops.forEach(function (stop) {
      var on = stop.y <= target;
      stop.el.classList.toggle('is-reached', on);
      if (on) reached = stop.y;
    });
    var done = railEnd <= target;
    rail.classList.toggle('is-done', done);
    railFill.style.height = (done ? railEnd : reached) - railStart + 'px';
  }

  var seenObserver = !reducedMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        seenObserver.unobserve(el);
        seen[el.dataset.seen] = true;
        el.style.setProperty('--wait', batch++ * SEEN_STAGGER + 'ms');
        el.classList.add('is-in');
      });
    }, { threshold: 0.35 })
    : null;

  var kmObserver = !reducedMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        kmObserver.unobserve(entry.target);
        countKm(entry.target);
      });
    }, { rootMargin: '0px 0px -25% 0px' })
    : null;

  function watchSeen(root) {
    root.querySelectorAll('[data-seen]').forEach(function (el) {
      if (!seenObserver || seen[el.dataset.seen]) {
        el.classList.add('is-in');
        return;
      }
      seenObserver.observe(el);
    });
  }

  function updateSwitches() {
    document.querySelectorAll('.lang-switch').forEach(function (group) {
      group.dataset.active = lang;
    });
    document.querySelectorAll('[data-lang]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.dataset.lang === lang ? 'true' : 'false');
    });
  }

  function translatePage() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      el.alt = t(el.getAttribute('data-i18n-alt'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('[data-site-name]').forEach(function (el) {
      el.textContent = pick(SITE.name);
    });
    document.querySelectorAll('[data-brand]').forEach(function (el) {
      var words = pick(SITE.name).split(' ');
      el.innerHTML = esc(words.shift()) + (words.length ? '<span>' + esc(words.join(' ')) + '</span>' : '');
    });
    updateSwitches();
  }

  function bindContacts() {
    var viberUrl = 'viber://chat?number=' + encodeURIComponent(SITE.viberNumber);
    document.querySelectorAll('[data-call]').forEach(function (el) { el.href = 'tel:' + SITE.phoneNumber; });
    document.querySelectorAll('[data-viber]').forEach(function (el) { el.href = viberUrl; });
    document.querySelectorAll('[data-phone]').forEach(function (el) { el.textContent = SITE.phoneDisplay; });
    document.querySelectorAll('[data-call-label]').forEach(function (el) { el.setAttribute('aria-label', t('btn.call') + ' ' + SITE.phoneDisplay); });
  }

  function render() {
    translatePage();
    setAutoplay(autoplay);
    renderFares();
    showFare(fareIndex, false);
    renderTours();
    renderDriverNames();
    fillDriver();
    renderCrew();
    renderAbroad();
    refreshTrip();
    bindContacts();
  }

  function setLanguage(next) {
    if (next === lang) return;
    lang = next;
    saveLanguage();
    updateSwitches();
    closeMenu();
    document.body.classList.add('is-switching');
    setTimeout(function () {
      render();
      document.body.classList.remove('is-switching');
    }, SWITCH_DELAY);
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    drawThread();
    drawRail();
    if (reducedMotion) return;
    var view = window.innerHeight;
    parallaxEls.forEach(function (img) {
      if (!wide.matches) {
        img.style.transform = '';
        return;
      }
      var box = img.getBoundingClientRect();
      if (box.bottom < 0 || box.top > view) return;
      var offset = (box.top + box.height / 2 - view / 2) / view;
      img.style.transform = 'translate3d(0,' + (offset * -28).toFixed(2) + 'px,0) scale(1.1)';
    });
  }

  function markMissingPhoto(img) {
    var box = img.closest && img.closest('.photo');
    if (img.tagName === 'IMG' && box) box.classList.add('is-missing');
  }

  function watch(el, options, callback) {
    if (!('IntersectionObserver' in window)) {
      callback();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      callback();
    }, options);
    observer.observe(el);
  }

  function initReveals() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var items = document.querySelectorAll('[data-reveal]');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) {
      var group = Array.prototype.filter.call(el.parentElement.children, function (sibling) {
        return sibling.hasAttribute('data-reveal');
      });
      el.style.setProperty('--d', group.indexOf(el) * REVEAL_STAGGER + 'ms');
      observer.observe(el);
    });
    document.documentElement.classList.add('js-reveal');
    setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      });
    }, REVEAL_FAILSAFE);
  }

  fareList.addEventListener('click', function (e) {
    var button = e.target.closest('.fare');
    if (button && Number(button.dataset.fare) !== fareIndex) showFare(Number(button.dataset.fare), true);
  });

  driverNames.addEventListener('click', function (e) {
    var button = e.target.closest('.chip');
    if (button) setDriver(Number(button.dataset.driver));
  });

  abroadList.addEventListener('click', function (e) {
    var button = e.target.closest('.trip');
    if (!button) return;
    if (wide.matches) pickTrip(button.dataset.to);
  });

  document.querySelectorAll('.faq__q').forEach(function (button) {
    button.addEventListener('click', function () {
      var open = button.closest('.faq__item').classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.querySelectorAll('[data-lang]').forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.dataset.lang); });
  });

  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  var scrollQueued = false;
  window.addEventListener('scroll', function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      onScroll();
    });
  }, { passive: true });

  var layoutQueued = false;
  function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(function () {
      layoutQueued = false;
      refreshTrip();
      buildThread();
      buildRail();
      });
  }
  var layoutTimer = null;
  function queueLayoutSettled() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(queueLayout, LAYOUT_SETTLE);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(queueLayoutSettled).observe(main);
  }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', queueLayout);
  if (document.fonts) document.fonts.ready.then(queueLayout);

  if (!reducedMotion && 'IntersectionObserver' in window) stage.classList.add('is-waiting');
  watch(stage, { threshold: 0.3 }, function () { stage.classList.remove('is-waiting'); });
  watch(track, { threshold: 1, rootMargin: '0px 0px -12% 0px' }, startTrips);
  [journey, abroadList].forEach(function (el) {
    el.addEventListener('mouseenter', function () { holds.hover = true; updateHold(); });
    el.addEventListener('mouseleave', function () { holds.hover = false; updateHold(); });
  });
  abroadList.addEventListener('focusin', function () { holds.focus = true; updateHold(); });
  abroadList.addEventListener('focusout', function () { holds.focus = false; updateHold(); });
  document.addEventListener('visibilitychange', updateHold);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      holds.offscreen = !entries[0].isIntersecting;
      updateHold();
    }, { threshold: 0.4 }).observe(journey);
  } else {
    holds.offscreen = false;
  }
  updateHold();

  if ('IntersectionObserver' in window) {
    var navLinks = nav.querySelectorAll('a');
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach(function (section) { navObserver.observe(section); });
  }

  document.addEventListener('error', function (e) { markMissingPhoto(e.target); }, true);
  document.querySelectorAll('.photo img').forEach(function (img) {
    if (img.complete && img.src && img.naturalWidth === 0) markMissingPhoto(img);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  render();
  initReveals();
  onScroll();
  SITE.drivers.forEach(function (driver) {
    setTimeout(function () { preload(driver.photo); preload(driver.car.photo); }, 1500);
  });
})();
