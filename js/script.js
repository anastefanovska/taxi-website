(function () {
  var SITE = window.SITE;
  var PRICES = window.PRICES;
  var TEXT = window.TEXT;
  var SWITCH_DELAY = 180;
  var LIGHTBOX_DELAY = 250;
  var DRIVER_DELAY = 200;

  var lang = readSavedLanguage();
  var fareFrom = PRICES.local[0][0];
  var fareTo = PRICES.local[0][1];
  var activeDriver = 0;

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var priceGroupsEl = document.getElementById('priceGroups');
  var fromSelect = document.getElementById('fareFrom');
  var toSelect = document.getElementById('fareTo');
  var farePriceEl = document.getElementById('farePrice');
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

  function formatPrice(amount) {
    if (typeof amount !== 'number') return amount;
    var separator = lang === 'en' ? ',' : '.';
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, separator) + ' ' + t('currency');
  }

  function findPrice(from, to) {
    var reverse = null;
    for (var i = 0; i < PRICES.local.length; i++) {
      var route = PRICES.local[i];
      if (route[0] === from && route[1] === to) return route[2];
      if (route[0] === to && route[1] === from) reverse = route[2];
    }
    return reverse;
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
  }

  function byPrice(a, b) {
    return typeof a[2] === 'number' && typeof b[2] === 'number' ? a[2] - b[2] : 0;
  }

  function renderRouteGroups(container, routes) {
    var groups = {};
    var order = [];

    routes.forEach(function (route) {
      if (!groups[route[0]]) {
        groups[route[0]] = [];
        order.push(route[0]);
      }
      groups[route[0]].push(route);
    });

    container.innerHTML = order.map(function (from) {
      return (
        '<div class="price-group">' +
          '<p class="plate"><span>' + esc(t('prices.from')) + '</span>' + esc(place(from)) + '</p>' +
          '<ul class="price-list">' +
            groups[from].slice().sort(byPrice).map(function (route, i) {
              var lead = route[3]
                ? '<span class="plate plate--country">' + esc(route[3]) + '</span>'
                : '<span class="price-list__n">' + (i < 9 ? '0' : '') + (i + 1) + '</span>';
              return (
                '<li data-from="' + route[0] + '" data-to="' + route[1] + '">' +
                  lead +
                  '<span class="price-list__route"><span class="arrow">→</span> ' + esc(place(route[1])) + '</span>' +
                  (route[2] === null
                    ? '<a class="price-list__ask" data-call href="#kontakt">' + esc(t('prices.ask')) + '</a>'
                    : '<span class="price-list__price">' + esc(formatPrice(route[2])) + '</span>') +
                '</li>'
              );
            }).join('') +
          '</ul>' +
        '</div>'
      );
    }).join('');
  }

  function optionsHtml(keys) {
    return keys.map(function (key) {
      return '<option value="' + key + '">' + esc(place(key)) + '</option>';
    }).join('');
  }

  function allPlaces() {
    var places = [];
    PRICES.local.forEach(function (route) {
      if (places.indexOf(route[0]) === -1) places.push(route[0]);
      if (places.indexOf(route[1]) === -1) places.push(route[1]);
    });
    return places;
  }

  function destinationsFrom(from) {
    return allPlaces().filter(function (key) {
      return key !== from && findPrice(from, key) !== null;
    });
  }

  function renderFareOptions() {
    fromSelect.innerHTML = optionsHtml(allPlaces());
    fromSelect.value = fareFrom;
    renderDestinations();
  }

  function renderDestinations() {
    var destinations = destinationsFrom(fareFrom);
    if (destinations.indexOf(fareTo) === -1) fareTo = destinations[0];
    toSelect.innerHTML = optionsHtml(destinations);
    toSelect.value = fareTo;
  }

  function updateFare(animate) {
    farePriceEl.textContent = formatPrice(findPrice(fareFrom, fareTo));

    if (animate) {
      farePriceEl.classList.remove('is-updated');
      void farePriceEl.offsetWidth;
      farePriceEl.classList.add('is-updated');
    }

    var rows = priceGroupsEl.querySelectorAll('li');
    var exact = priceGroupsEl.querySelector('li[data-from="' + fareFrom + '"][data-to="' + fareTo + '"]');
    var selected = exact || priceGroupsEl.querySelector('li[data-from="' + fareTo + '"][data-to="' + fareFrom + '"]');
    rows.forEach(function (li) { li.classList.toggle('is-selected', li === selected); });
  }

  function renderAirport() {
    document.getElementById('airportRoute').innerHTML =
      esc(place('airport')) + ' <span class="arrow">→</span> ' + esc(place('skopje'));
    document.getElementById('airportPrice').textContent = formatPrice(findPrice('airport', 'skopje'));
  }

  function renderDriverTabs() {
    driverTabsEl.innerHTML = SITE.drivers.map(function (driver, i) {
      return (
        '<button class="driver-tab" type="button" role="tab" data-driver="' + i + '" aria-controls="driverPanel" aria-selected="' + (i === activeDriver) + '">' +
          '<span class="driver-tab__plate">' + esc(driver.plate) + '</span>' +
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
            '<p class="feature__drives">' + esc(t('drivers.drives')) + '</p>' +
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
    renderRouteGroups(priceGroupsEl, PRICES.local);
    renderRouteGroups(document.getElementById('abroad'), PRICES.abroad);
    renderFareOptions();
    updateFare(false);
    renderAirport();
    renderDriverTabs();
    renderDriver();
    bindContacts();
    preparePhotos();
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
    updateFare(true);
  });

  document.getElementById('fareSwap').addEventListener('click', function () {
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

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
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
