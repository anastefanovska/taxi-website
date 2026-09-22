(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var SWITCH_DELAY = 180;
  var LIGHTBOX_DELAY = 250;
  var DIGIT_STAGGER = 35;
  var DRIVE_BASE = 700;
  var DRIVE_SPAN = 2300;
  var THROW_TIME = 450;
  var SWIPE_MIN = 40;
  var HINT_TIME = 1100;
  var HINT_STAGGER = 250;
  var CAR_SVG = '<svg class="trip__car" viewBox="0 0 24 13" aria-hidden="true"><rect class="trip__car-light" x="10.5" y="0.5" width="4" height="2" rx="0.6"/><path class="trip__car-body" d="M2 9.6V8.2c0-.8.6-1.5 1.4-1.6L7 6l2.7-2.7c.4-.4.9-.6 1.4-.6h4.3c.6 0 1.1.3 1.5.7L19.5 6l2.1.4c.8.2 1.4.9 1.4 1.7v1.5c0 .5-.4.9-.9.9H2.9c-.5 0-.9-.4-.9-.9z"/><path class="trip__car-window" d="M10.6 4.2h2.2V6H8.9zM14 4.2h1.5c.3 0 .5.1.7.3L17.6 6H14z"/><circle cx="7" cy="10.5" r="2"/><circle cx="18" cy="10.5" r="2"/></svg>';
  var FARE_ORIGINS = ['skopje', 'airport'];
  var ICONS = {
    seats:  '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    bags:   '<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M9 12v4M15 12v4"/>',
    ac:     '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',
    child:  '<circle cx="12" cy="5.5" r="2.5"/><path d="M7 21v-6l-2-3.5L8.5 9h7l3.5 2.5-2 3.5v6"/>',
    card:   '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    charge: '<path d="M13 3 6 13h5l-1 8 7-10h-5z"/>',
    wifi:   '<path d="M4.5 9.5a11 11 0 0 1 15 0M7.8 13a6 6 0 0 1 8.4 0"/><circle cx="12" cy="17" r="1.2"/>'
  };

  var lang = readSavedLanguage();
  var fareFrom = 'skopje';
  var fareTo = 'airport';
  var lastFareNumber = '';
  var tripKey = null;
  var tripKm = 0;
  var tripFarthest = 1;
  var tripFrame = null;
  var tripTimer = null;
  var swipeStart = null;
  var swiped = false;

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var fromSelect = document.getElementById('fareFrom');
  var toSelect = document.getElementById('fareTo');
  var fareSwap = document.getElementById('fareSwap');
  var farePriceEl = document.getElementById('farePrice');
  var fareNoteEl = document.getElementById('fareNote');
  var driversEl = document.getElementById('drivers');

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCount = document.getElementById('lightboxCount');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPhotos = [];
  var lightboxIndex = 0;
  var lightboxOpener = null;
  var touchStartX = null;
  var abroadList = document.getElementById('abroad');
  var tripsEl = document.getElementById('trips');
  var tripRoad = document.getElementById('tripRoad');
  var tripToEl = document.getElementById('tripTo');
  var tripOdo = document.getElementById('tripOdo');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function fullPlace(key) {
    var full = PRICES.fullNames && PRICES.fullNames[key];
    return full ? pick(full) : place(key);
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatNumber(amount) {
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
  }

  function priceType(route) {
    if (route.meter) return 'meter';
    if (route.mkd || route.eur) return route.startsAt ? 'from' : 'fixed';
    return 'quote';
  }

  function amountHtml(route) {
    var number = esc(route.mkd ? formatNumber(route.mkd) : String(route.eur));
    return route.mkd
      ? number + '<small class="amount__cur">' + esc(t('currency')) + '</small>'
      : '<small class="amount__cur amount__cur--before">€</small>' + number;
  }

  function fareAmountHtml(route, animate) {
    var number = route.mkd ? formatNumber(route.mkd) : String(route.eur);
    var offset = lastFareNumber.length - number.length;
    var digits = number.split('').map(function (char, i) {
      var rolling = animate && lastFareNumber.charAt(i + offset) !== char;
      var style = rolling ? ' style="animation-delay:' + (number.length - 1 - i) * DIGIT_STAGGER + 'ms"' : '';
      return '<span class="fare__digit' + (rolling ? ' is-rolling' : '') + '"' + style + '>' + esc(char) + '</span>';
    }).join('');
    lastFareNumber = number;
    return route.mkd
      ? digits + '<small class="amount__cur">' + esc(t('currency')) + '</small>'
      : '<small class="amount__cur amount__cur--before">€</small>' + digits;
  }

  function tagHtml(key, before) {
    return '<small class="price__tag' + (before ? ' price__tag--before' : '') + '">' + esc(t(key)) + '</small>';
  }

  function priceHtml(route, className) {
    var type = priceType(route);
    if (type === 'quote') return '<a class="price-ask" data-call href="#kontakt">' + esc(t('price.quote')) + '</a>';
    if (type === 'meter') return '<span class="' + className + ' is-meter">' + esc(t('price.meter')) + '</span>';
    return '<span class="' + className + '">' + (type === 'from' ? tagHtml('price.from', true) : '') + amountHtml(route) + '</span>';
  }

  function routeFareHtml(route) {
    var type = priceType(route);
    if (type === 'quote') return '<span class="route__fare">' + priceHtml(route) + '</span>';
    var amount = '<span class="route__price">' + amountHtml(route) + '</span>';
    if (type === 'from') return '<span class="route__fare">' + tagHtml('price.from') + amount + '</span>';
    return '<span class="route__fare">' + amount + '</span>';
  }

  function findRoute(from, to) {
    for (var i = 0; i < PRICES.routes.length; i++) {
      var route = PRICES.routes[i];
      if (route.from === from && route.to === to) return route;
    }
    return null;
  }

  function isAbroad(route) {
    return Boolean(route.km);
  }

  function routesFrom(from, abroad) {
    return PRICES.routes.filter(function (route) {
      return route.from === from && isAbroad(route) === abroad;
    });
  }

  function canSwap() {
    return FARE_ORIGINS.indexOf(fareTo) !== -1 && Boolean(findRoute(fareTo, fareFrom));
  }

  function galleryShots(driver) {
    var name = pick(driver.name);
    var model = pick(driver.car.model);
    var shots = [];
    var count = Math.max(driver.photos.length, driver.car.photos.length);
    for (var i = 0; i < count; i++) {
      if (driver.photos[i]) shots.push({ src: driver.photos[i], alt: name });
      if (driver.car.photos[i]) shots.push({ src: driver.car.photos[i], alt: model + ' — ' + name });
    }
    return shots;
  }

  function deckHtml(driver) {
    var shots = galleryShots(driver);
    var bars = shots.length < 2 ? '' : '<div class="deck__bars" aria-hidden="true">' + shots.map(function (shot, i) {
      return '<span' + (i === 0 ? ' class="is-seen"' : '') + '></span>';
    }).join('') + '</div>';
    var cards = shots.map(function (shot, i) {
      return (
        '<figure class="deck__card photo" data-pos="' + i + '">' +
          '<img src="' + esc(shot.src) + '" alt="' + esc(shot.alt) + '"' + (i > 2 ? ' loading="lazy"' : '') + ' />' +
        '</figure>'
      );
    }).join('');
    var arrows = shots.length < 2 ? '' :
      '<button class="deck__arrow deck__arrow--prev" type="button" data-step="-1" aria-label="' + esc(t('lightbox.prev')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<button class="deck__arrow deck__arrow--next" type="button" data-step="1" aria-label="' + esc(t('lightbox.next')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
    return (
      '<div class="deck" data-index="0" tabindex="0" role="group" aria-label="' + esc(pick(driver.name)) + '">' +
        bars + cards + arrows +
      '</div>'
    );
  }

  function stepDeck(deck, direction) {
    var cards = deck.querySelectorAll('.deck__card');
    var count = cards.length;
    if (count < 2) return false;
    var index = Number(deck.dataset.index);
    var next = (index + direction + count) % count;
    if (direction > 0 && !reducedMotion) {
      var leaving = cards[index];
      leaving.classList.add('is-thrown');
      setTimeout(function () { leaving.classList.remove('is-thrown'); }, THROW_TIME);
    }
    deck.dataset.index = next;
    cards.forEach(function (card, i) { card.dataset.pos = (i - next + count) % count; });
    deck.querySelectorAll('.deck__bars span').forEach(function (bar, i) { bar.classList.toggle('is-seen', i <= next); });
    return true;
  }

  function plateHtml(number) {
    return '<p class="plate">' + esc(number) + '</p>';
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

  function renderPriceList(elementId, routes) {
    document.getElementById(elementId).innerHTML = routes.map(function (route) {
      return (
        '<li data-from="' + route.from + '" data-to="' + route.to + '">' +
          '<span class="price-list__route">' + esc(fullPlace(route.to)) + '</span>' +
          priceHtml(route, 'price-list__price') +
        '</li>'
      );
    }).join('');
  }

  function abroadRoutes() {
    return routesFrom('skopje', true).sort(function (a, b) { return a.km - b.km; });
  }

  function setOdometer(km) {
    tripOdo.innerHTML = esc(String(Math.round(km)).padStart(3, '0')) + '<small>' + esc(t('km')) + '</small>';
  }

  function placeCar(km, duration) {
    tripRoad.style.setProperty('--drive', duration + 'ms');
    tripRoad.style.setProperty('--pos', (km / tripFarthest).toFixed(4));
  }

  function renderAbroad() {
    var routes = abroadRoutes();
    tripFarthest = routes[routes.length - 1].km;

    tripRoad.innerHTML = '<span class="trip__trail"></span><span class="trip__ghost"></span><span class="trip__pin"></span>' + CAR_SVG;
    tripRoad.style.setProperty('--target', tripKey ? (findRoute('skopje', tripKey).km / tripFarthest).toFixed(4) : 1);
    placeCar(tripKm, 0);
    setOdometer(tripKm);
    showDestination();

    abroadList.innerHTML = routes.map(function (route) {
      return (
        '<li>' +
          '<button class="route" type="button" data-to="' + route.to + '" aria-pressed="' + (route.to === tripKey) + '">' +
            '<span class="route__place">' +
              '<span class="route__city">' + esc(place(route.to)) + '</span>' +
              '<span class="route__km">~' + route.km + ' ' + esc(t('km')) + '</span>' +
            '</span>' +
            routeFareHtml(route) +
          '</button>' +
        '</li>'
      );
    }).join('');
  }

  function showDestination() {
    tripToEl.textContent = tripKey ? place(tripKey) : t('trips.pick');
    tripToEl.classList.toggle('is-empty', !tripKey);
  }

  function easeInOut(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  function driveTo(key) {
    var from = tripKm;
    var to = key ? findRoute('skopje', key).km : tripFarthest;
    var duration = reducedMotion ? 0 : Math.round(DRIVE_BASE + Math.abs(to - from) / tripFarthest * DRIVE_SPAN);
    var car = tripRoad.querySelector('.trip__car');
    var pin = tripRoad.querySelector('.trip__pin');
    var start = performance.now();

    tripKey = key;
    showDestination();
    abroadList.querySelectorAll('.route').forEach(function (button) {
      button.setAttribute('aria-pressed', button.dataset.to === key ? 'true' : 'false');
    });
    tripRoad.style.setProperty('--target', (to / tripFarthest).toFixed(4));
    car.classList.toggle('is-reverse', to < from);
    pin.classList.remove('is-arrived');
    placeCar(to, duration);

    cancelAnimationFrame(tripFrame);
    clearTimeout(tripTimer);
    tripTimer = setTimeout(function () { pin.classList.add('is-arrived'); }, duration);
    (function tick(now) {
      var progress = duration ? Math.min((now - start) / duration, 1) : 1;
      tripKm = from + (to - from) * easeInOut(progress);
      setOdometer(tripKm);
      if (progress < 1) tripFrame = requestAnimationFrame(tick);
    })(start);
  }

  function optionsHtml(keys) {
    return keys.map(function (key) {
      return '<option value="' + key + '">' + esc(place(key)) + '</option>';
    }).join('');
  }

  function destinationsHtml(from) {
    return optionsHtml(routesFrom(from, false).map(function (route) { return route.to; }));
  }

  function renderFareOptions() {
    fromSelect.innerHTML = optionsHtml(FARE_ORIGINS);
    fromSelect.value = fareFrom;
    renderDestinations();
  }

  function renderDestinations() {
    toSelect.innerHTML = destinationsHtml(fareFrom);
    if (!findRoute(fareFrom, fareTo)) fareTo = toSelect.options[0].value;
    toSelect.value = fareTo;
    fareSwap.disabled = !canSwap();
  }

  function updateFare(animate) {
    var route = findRoute(fareFrom, fareTo);
    var type = priceType(route);
    var isText = type === 'meter' || type === 'quote';
    if (isText) lastFareNumber = '';
    farePriceEl.innerHTML = isText
      ? '<span class="fare__digit' + (animate ? ' is-rolling' : '') + '">' + esc(t('price.' + type)) + '</span>'
      : (type === 'from' ? tagHtml('price.from') : '') + fareAmountHtml(route, animate);
    farePriceEl.classList.toggle('is-text', isText);
    fareNoteEl.textContent = t('fare.note.' + type);
  }

  function renderDrivers() {
    driversEl.innerHTML = SITE.drivers.map(function (driver) {
      var name = pick(driver.name);
      var car = driver.car;
      var model = pick(car.model);
      return (
        '<article class="driver">' +
          deckHtml(driver) +
          '<div class="driver__id">' +
            '<div>' +
              '<h3 class="driver__name">' + esc(name) + '</h3>' +
              '<p class="driver__model">' + esc(model) + '</p>' +
            '</div>' +
            (car.plate ? plateHtml(car.plate) : '') +
          '</div>' +
          '<ul class="driver__specs">' + car.features.map(function (feature) {
            return '<li><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[feature.icon] || '') + '</svg><span>' + esc(pick(feature.text)) + '</span></li>';
          }).join('') + '</ul>' +
        '</article>'
      );
    }).join('');
  }

  function markMissingPhoto(img) {
    if (img.tagName === 'IMG' && img.parentElement.classList.contains('photo')) {
      img.parentElement.classList.add('is-missing');
    }
  }

  function render() {
    translatePage();
    renderPriceList('popularRoutes', routesFrom('skopje', false));
    renderPriceList('airportRoutes', routesFrom('airport', false));
    renderAbroad();
    renderFareOptions();
    updateFare(false);
    renderDrivers();
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

  function showLightboxPhoto() {
    var source = lightboxPhotos[lightboxIndex];
    lightboxImg.classList.remove('is-shown');
    lightboxImg.src = source.currentSrc || source.src;
    lightboxImg.alt = source.alt;
    lightboxCount.textContent = lightboxPhotos.length > 1 ? (lightboxIndex + 1) + ' / ' + lightboxPhotos.length : '';
  }

  function openLightbox(deck) {
    lightboxPhotos = Array.prototype.slice.call(deck.querySelectorAll('.deck__card img'));
    lightboxIndex = Number(deck.dataset.index);
    lightboxOpener = deck;

    var single = lightboxPhotos.length < 2;
    lightboxPrev.hidden = single;
    lightboxNext.hidden = single;

    showLightboxPhoto();
    lightbox.hidden = false;
    document.documentElement.classList.add('no-scroll');
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    setTimeout(function () { lightbox.hidden = true; }, LIGHTBOX_DELAY);
    if (lightboxOpener) lightboxOpener.focus({ preventScroll: true });
  }

  function stepLightbox(direction) {
    lightboxIndex = (lightboxIndex + direction + lightboxPhotos.length) % lightboxPhotos.length;
    showLightboxPhoto();
  }

  fromSelect.addEventListener('change', function () {
    fareFrom = fromSelect.value;
    renderDestinations();
    updateFare(true);
  });

  toSelect.addEventListener('change', function () {
    fareTo = toSelect.value;
    fareSwap.disabled = !canSwap();
    updateFare(true);
  });

  fareSwap.addEventListener('click', function () {
    var from = fareFrom;
    fareFrom = fareTo;
    fareTo = from;
    fromSelect.value = fareFrom;
    renderDestinations();
    updateFare(true);
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

  lightboxImg.addEventListener('load', function () { lightboxImg.classList.add('is-shown'); });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', function () { stepLightbox(-1); });
  lightboxNext.addEventListener('click', function () { stepLightbox(1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchStartX === null || lightboxPhotos.length < 2) return;
    var distance = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) stepLightbox(distance < 0 ? 1 : -1);
    touchStartX = null;
  });

  driversEl.addEventListener('click', function (e) {
    var deck = e.target.closest('.deck');
    if (!deck) return;
    var arrow = e.target.closest('.deck__arrow');
    if (arrow) return stepDeck(deck, Number(arrow.dataset.step));
    if (!swiped) openLightbox(deck);
  });

  driversEl.addEventListener('keydown', function (e) {
    var deck = e.target;
    if (!deck.classList || !deck.classList.contains('deck')) return;
    if (e.key === 'ArrowRight') stepDeck(deck, 1);
    else if (e.key === 'ArrowLeft') stepDeck(deck, -1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(deck);
    }
  });

  driversEl.addEventListener('touchstart', function (e) {
    var deck = e.target.closest('.deck');
    swipeStart = deck ? { deck: deck, x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });

  driversEl.addEventListener('touchend', function (e) {
    if (!swipeStart) return;
    var dx = e.changedTouches[0].clientX - swipeStart.x;
    var dy = e.changedTouches[0].clientY - swipeStart.y;
    var deck = swipeStart.deck;
    swipeStart = null;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    swiped = true;
    setTimeout(function () { swiped = false; }, 400);
    stepDeck(deck, dx < 0 ? 1 : -1);
  });

  abroadList.addEventListener('click', function (e) {
    var button = e.target.closest('.route');
    if (!button) return;
    tripRoad.classList.remove('is-previewing');
    driveTo(button.dataset.to);
  });

  abroadList.addEventListener('mouseover', function (e) {
    var button = e.target.closest('.route');
    if (!button || button.dataset.to === tripKey) return tripRoad.classList.remove('is-previewing');
    tripRoad.style.setProperty('--preview', (findRoute('skopje', button.dataset.to).km / tripFarthest).toFixed(4));
    tripRoad.classList.add('is-previewing');
  });

  abroadList.addEventListener('mouseleave', function () {
    tripRoad.classList.remove('is-previewing');
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight' && lightboxPhotos.length > 1) stepLightbox(1);
      if (e.key === 'ArrowLeft' && lightboxPhotos.length > 1) stepLightbox(-1);
      return;
    }
    if (e.key === 'Escape') closeMenu();
  });

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function watchOnce(el, threshold, callback) {
    if (!('IntersectionObserver' in window)) return callback();
    var watcher = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      watcher.disconnect();
      callback();
    }, { threshold: threshold });
    watcher.observe(el);
  }

  watchOnce(tripsEl, 0.4, function () { driveTo(null); });
  watchOnce(driversEl, 0.5, function () {
    if (reducedMotion) return;
    driversEl.querySelectorAll('.deck').forEach(function (deck, i) {
      if (deck.querySelectorAll('.deck__card').length < 2) return;
      setTimeout(function () {
        deck.classList.add('is-hinting');
        setTimeout(function () { deck.classList.remove('is-hinting'); }, HINT_TIME);
      }, i * HINT_STAGGER);
    });
  });

  if ('IntersectionObserver' in window) {
    var navLinks = nav.querySelectorAll('a');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    navLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) observer.observe(section);
    });
  }

  document.addEventListener('error', function (e) { markMissingPhoto(e.target); }, true);
  document.querySelectorAll('.photo img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissingPhoto(img);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
