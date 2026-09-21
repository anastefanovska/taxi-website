(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var SWITCH_DELAY = 180;
  var LIGHTBOX_DELAY = 250;
  var DRIVER_DELAY = 200;
  var CAR_SVG = '<svg class="route__car" viewBox="0 0 24 13" aria-hidden="true"><rect x="10.5" y="0.5" width="4" height="2" rx="0.6"/><path class="route__car-body" d="M2 9.6V8.2c0-.8.6-1.5 1.4-1.6L7 6l2.7-2.7c.4-.4.9-.6 1.4-.6h4.3c.6 0 1.1.3 1.5.7L19.5 6l2.1.4c.8.2 1.4.9 1.4 1.7v1.5c0 .5-.4.9-.9.9H2.9c-.5 0-.9-.4-.9-.9z"/><path class="route__car-window" d="M10.6 4.2h2.2V6H8.9zM14 4.2h1.5c.3 0 .5.1.7.3L17.6 6H14z"/><circle cx="7" cy="10.5" r="2"/><circle cx="18" cy="10.5" r="2"/></svg>';
  var FARE_ORIGINS = ['skopje', 'airport'];

  var lang = readSavedLanguage();
  var fareFrom = 'skopje';
  var fareTo = 'airport';
  var activeDriver = 0;

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var fromSelect = document.getElementById('fareFrom');
  var toSelect = document.getElementById('fareTo');
  var fareSwap = document.getElementById('fareSwap');
  var farePriceEl = document.getElementById('farePrice');
  var fareNoteEl = document.getElementById('fareNote');
  var driverTabsEl = document.getElementById('driverTabs');
  var driverPanelEl = document.getElementById('driverPanel');

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

  function formatMkd(amount) {
    var separator = lang === 'en' ? ',' : '.';
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, separator) + ' ' + t('currency');
  }

  function priceType(route) {
    if (route.meter) return 'meter';
    if (route.mkd || route.eur) return route.startsAt ? 'from' : 'fixed';
    return 'quote';
  }

  function priceAmount(route) {
    return route.mkd ? formatMkd(route.mkd) : '€' + route.eur;
  }

  function tagHtml(key, before) {
    return '<small class="price__tag' + (before ? ' price__tag--before' : '') + '">' + esc(t(key)) + '</small>';
  }

  function priceHtml(route, className) {
    var type = priceType(route);
    if (type === 'quote') return '<a class="price-ask" data-call href="#kontakt">' + esc(t('price.quote')) + '</a>';
    if (type === 'meter') return '<span class="' + className + ' is-meter">' + esc(t('price.meter')) + '</span>';
    return '<span class="' + className + '">' + (type === 'from' ? tagHtml('price.from', true) : '') + esc(priceAmount(route)) + '</span>';
  }

  function routeFareHtml(route) {
    var type = priceType(route);
    if (type === 'quote') return '<span class="route__fare">' + priceHtml(route) + '</span>';
    var amount = '<span class="route__price">' + esc(priceAmount(route)) + '</span>';
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

  function photoHtml(src, alt, className, position) {
    var style = position ? ' style="object-position:' + esc(position) + '"' : '';
    return '<div class="photo ' + (className || '') + '"><img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy"' + style + ' /></div>';
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

  function renderAbroad() {
    var routes = routesFrom('skopje', true).sort(function (a, b) { return a.km - b.km; });
    var farthest = Math.max.apply(null, routes.map(function (route) { return route.km; }));

    abroadList.innerHTML = routes.map(function (route) {
      return (
        '<li class="route" style="--distance:' + (route.km / farthest).toFixed(3) + '">' +
          '<span class="route__city">' + esc(place(route.to)) + '</span>' +
          '<span class="route__track">' +
            '<span class="route__line">' + CAR_SVG + '</span>' +
            '<span class="route__km">~' + route.km + ' ' + esc(t('km')) + '</span>' +
          '</span>' +
          routeFareHtml(route) +
        '</li>'
      );
    }).join('');
  }

  function driveCars() {
    var cars = Array.prototype.slice.call(abroadList.querySelectorAll('.route__car'));
    if (!cars.length) return;

    var box = abroadList.getBoundingClientRect();
    var viewport = window.innerHeight;
    var progress = reducedMotion ? 1 : Math.min(Math.max((viewport * 0.9 - box.top) / (box.height + viewport * 0.2), 0), 1);
    var trips = cars.map(function (car) { return Math.max(car.parentElement.offsetWidth - car.getBoundingClientRect().width - 6, 0); });
    var longest = Math.max.apply(null, trips);

    cars.forEach(function (car, i) {
      car.style.transform = 'translateX(' + Math.min(progress * longest, trips[i]).toFixed(1) + 'px)';
    });
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
    farePriceEl.innerHTML = type === 'meter' || type === 'quote'
      ? esc(t(type === 'meter' ? 'price.meter' : 'price.quote'))
      : (type === 'from' ? tagHtml('price.from') : '') + esc(priceAmount(route));
    farePriceEl.classList.toggle('is-text', type === 'meter' || type === 'quote');
    fareNoteEl.textContent = t('fare.note.' + type);

    if (animate) {
      farePriceEl.classList.remove('is-updated');
      void farePriceEl.offsetWidth;
      farePriceEl.classList.add('is-updated');
    }
  }

  function renderDriverTabs() {
    driverTabsEl.innerHTML = SITE.drivers.map(function (driver, i) {
      return (
        '<button class="driver-tab" type="button" role="tab" data-driver="' + i + '" aria-controls="driverPanel" aria-selected="' + (i === activeDriver) + '">' +
          '<span>' + esc(pick(driver.name)) + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function selectDriverTab() {
    driverTabsEl.querySelectorAll('[data-driver]').forEach(function (tab) {
      tab.setAttribute('aria-selected', Number(tab.dataset.driver) === activeDriver ? 'true' : 'false');
    });
  }

  function renderDriver() {
    var driver = SITE.drivers[activeDriver];
    var name = pick(driver.name);
    var car = driver.car;
    var model = pick(car.model);
    var thumbs = driver.photos.slice(1).map(function (src) {
      return photoHtml(src, name + ' — ' + t('drivers.photo'));
    }).join('');

    driverPanelEl.innerHTML =
      '<div class="feature__photos">' +
        photoHtml(driver.photos[0], name, 'feature__main', driver.focus) +
        (thumbs ? '<div class="feature__thumbs">' + thumbs + '</div>' : '') +
      '</div>' +
      '<div class="feature__info">' +
        '<h3 class="feature__name">' + esc(name) + '</h3>' +
        '<p class="feature__line">' + t('quote.open') + esc(pick(driver.line)) + t('quote.close') + '</p>' +
        '<div class="feature__car">' +
          photoHtml(car.photo, model, 'feature__car-photo') +
          '<div>' +
            '<p class="feature__model">' + esc(model) + '</p>' +
            '<ul class="feature__specs">' + car.features.map(function (f) { return '<li>' + esc(pick(f)) + '</li>'; }).join('') + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>';

    selectDriverTab();
    driverPanelEl.setAttribute('aria-label', name);
    preparePhotos();
  }

  function showDriver(index) {
    if (index === activeDriver) return;
    activeDriver = index;
    selectDriverTab();
    driverPanelEl.classList.add('is-changing');
    setTimeout(function () {
      renderDriver();
      driverPanelEl.classList.remove('is-changing');
    }, DRIVER_DELAY);
  }

  function preloadDriverPhotos() {
    SITE.drivers.forEach(function (driver) {
      driver.photos.concat(driver.car.photo).forEach(function (src) {
        new Image().src = src;
      });
    });
  }

  function preparePhotos() {
    document.querySelectorAll('.photo img').forEach(function (img) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
    });
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
    renderDriverTabs();
    renderDriver();
    bindContacts();
    preparePhotos();
    driveCars();
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

  function openLightbox(img) {
    lightboxPhotos = Array.prototype.slice.call(img.closest('section').querySelectorAll('.photo img'));
    lightboxIndex = lightboxPhotos.indexOf(img);
    lightboxOpener = img;

    var single = lightboxPhotos.length < 2;
    lightboxPrev.hidden = single;
    lightboxNext.hidden = single;

    showLightboxPhoto();
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
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

  driverTabsEl.addEventListener('click', function (e) {
    var tab = e.target.closest('[data-driver]');
    if (tab) showDriver(Number(tab.dataset.driver));
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

  document.addEventListener('click', function (e) {
    if (e.target.matches('.photo img')) openLightbox(e.target);
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight' && lightboxPhotos.length > 1) stepLightbox(1);
      if (e.key === 'ArrowLeft' && lightboxPhotos.length > 1) stepLightbox(-1);
      return;
    }
    if (e.key === 'Escape') closeMenu();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.photo img')) {
      e.preventDefault();
      openLightbox(e.target);
    }
  });

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    driveCars();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', driveCars);
  onScroll();

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
  preloadDriverPhotos();
})();
