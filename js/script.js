(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var SWITCH_DELAY = 180;
  var SWAP_DELAY = 160;
  var DIGIT_STAGGER = 30;
  var DRIVE_BASE = 700;
  var DRIVE_SPAN = 1500;
  var SCROLL_WAIT = 380;
  var REVEAL_STAGGER = 80;
  var REVEAL_FAILSAFE = 1500;
  var THREAD_RADIUS = 22;
  var THREAD_STEP = 6;
  var FIRST_TRIP = 'thessaloniki';

  var lang = readSavedLanguage();
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fareIndex = 0;
  var driverIndex = 0;
  var driverToken = 0;
  var tripKey = FIRST_TRIP;
  var tripStarted = false;
  var tripFrame = null;
  var tripTimer = null;
  var lastPrice = {};
  var threadSamples = [];
  var threadLength = 0;

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

  function nudge(el) {
    if (reducedMotion || !el.animate) return;
    el.animate(
      [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' }
    );
  }

  function fillTokens(text) {
    var trips = abroadRoutes();
    return text
      .replace('{tripCount}', trips.length)
      .replace('{tripFirst}', place(trips[0].to))
      .replace('{tripLast}', place(trips[trips.length - 1].to));
  }

  var PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-1.8l-7.9-4.9V3.4a1.6 1.6 0 0 0-3.2 0v5.4L2 13.7v1.8l7.9-2.4v5.3l-2.2 1.6v1.5l3.8-1.1 3.8 1.1v-1.5l-2.2-1.6v-5.3z"/></svg>';

  function fareGroupHtml(route) {
    var landing = route.from === 'airport';
    return (
      '<li class="fares__group' + (landing ? ' fares__group--landing' : '') + '">' +
        '<span class="fares__icon">' + PLANE + '</span>' +
        '<span class="fares__title">' + esc(t(landing ? 'fare.fromAirport' : 'fare.toAirport')) + '</span>' +
      '</li>'
    );
  }

  function renderFares() {
    var from = null;
    fareList.innerHTML = routesOf('airport').map(function (route, i) {
      var group = route.from !== from ? fareGroupHtml(route) : '';
      from = route.from;
      return group + (
        '<li>' +
          '<button class="fare" type="button" data-fare="' + i + '" aria-pressed="' + (i === fareIndex) + '">' +
            '<span class="fare__route">' +
              '<span class="fare__from">' + esc(place(route.from)) + ' <span class="arrow">→</span></span>' +
              '<span class="fare__to">' + esc(place(route.to)) + '</span>' +
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

  function tourSub(tour) {
    if (tour.note) return pick(tour.note);
    if (tour.stops) return tour.stops.map(pick).join(' · ');
    return '';
  }

  function renderTours() {
    document.getElementById('tours').innerHTML = routesOf('private').map(function (tour) {
      var sub = tourSub(tour);
      var price = tour.quote
        ? '<p class="tour__price tour__price--quote">' + esc(t('price.quote')) + '</p>'
        : '<p class="tour__price">' + euroHtml(tour.eur) + '</p>';
      return (
        '<li class="tour">' +
          '<div>' +
            '<p class="tour__title">' + tourTitleHtml(tour) + '</p>' +
            (sub ? '<p class="tour__sub">' + esc(sub) + '</p>' : '') +
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

  function renderAbroad() {
    var farthest = farthestKm();
    abroadList.innerHTML = abroadRoutes().map(function (route) {
      return (
        '<li>' +
          '<button class="trip" type="button" data-to="' + route.to + '" aria-pressed="' + (route.to === tripKey) + '">' +
            '<span class="trip__city">' + esc(place(route.to)) + '</span>' +
            '<span class="trip__price">' + euroHtml(route.eur) + '</span>' +
            '<span class="trip__bar"><span style="width:' + (route.km / farthest * 100).toFixed(1) + '%"></span></span>' +
            '<span class="trip__km">' + esc(route.km + ' ' + t('km')) + '</span>' +
          '</button>' +
        '</li>'
      );
    }).join('');
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
    nudge(tripTo);
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
        }
      })(start);
    }, delay || 0);
  }

  function startTrips() {
    if (tripStarted) return;
    tripStarted = true;
    drive(findTrip(tripKey));
  }

  function pickTrip(key) {
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

    var d = 'M' + points[0].x + ' ' + points[0].y;
    var y = points[0].y;
    function down(toY) {
      return ' H' + (mx + r) + ' Q' + mx + ' ' + y + ' ' + mx + ' ' + (y + r) + ' V' + (toY - r);
    }
    for (var i = 1; i < points.length; i++) {
      var p = points[i];
      d += down(p.y) + ' Q' + mx + ' ' + p.y + ' ' + (mx + r) + ' ' + p.y + ' H' + p.x;
      y = p.y;
    }
    d += down(endY + r);

    thread.setAttribute('height', main.offsetHeight);
    thread.setAttribute('width', main.offsetWidth);
    threadBase.setAttribute('d', d);
    threadDrawn.setAttribute('d', d);
    threadEnd.setAttribute('cx', mx);
    threadEnd.setAttribute('cy', endY);

    threadLength = threadDrawn.getTotalLength();
    threadDrawn.style.strokeDasharray = threadLength;
    threadSamples = [];
    for (var s = 0; s <= threadLength; s += THREAD_STEP) {
      var point = threadDrawn.getPointAtLength(s);
      threadSamples.push({ s: s, x: point.x, y: point.y });
    }
    var last = threadDrawn.getPointAtLength(threadLength);
    threadSamples.push({ s: threadLength, x: last.x, y: last.y });
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
    var drawn = hi < 0 ? 0 : sample.s;
    var done = drawn >= threadLength - 1;
    threadDrawn.style.strokeDashoffset = threadLength - drawn;
    threadHead.setAttribute('cx', sample.x);
    threadHead.setAttribute('cy', sample.y);
    threadHead.classList.toggle('is-hidden', hi < 0 || done);
    threadEnd.classList.toggle('is-reached', done);
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
      el.innerHTML = fillTokens(t(el.getAttribute('data-i18n')));
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
    renderFares();
    showFare(fareIndex, false);
    renderTours();
    renderDriverNames();
    fillDriver();
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
    if (button) pickTrip(button.dataset.to);
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
    });
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(queueLayout).observe(main);
  }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', queueLayout);
  if (document.fonts) document.fonts.ready.then(queueLayout);

  if (!reducedMotion && 'IntersectionObserver' in window) stage.classList.add('is-waiting');
  watch(stage, { threshold: 0.3 }, function () { stage.classList.remove('is-waiting'); });
  watch(track, { threshold: 1, rootMargin: '0px 0px -12% 0px' }, startTrips);

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
