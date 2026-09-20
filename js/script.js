(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopQuery = window.matchMedia('(min-width: 900px)');

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function t(key, fallback) {
    var value = window.I18N ? window.I18N.t(key) : null;
    return value === null || value === undefined ? fallback : value;
  }

  function format(key, values, fallback) {
    var value = window.I18N && window.I18N.format
      ? window.I18N.format(key, values)
      : null;
    return value === null || value === undefined ? fallback : value;
  }

  function throttle(fn, wait) {
    var last = 0;
    var timer = null;
    return function () {
      var now = Date.now();
      var args = arguments;
      var remaining = wait - (now - last);

      if (remaining <= 0) {
        clearTimeout(timer);
        timer = null;
        last = now;
        fn.apply(null, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          last = Date.now();
          timer = null;
          fn.apply(null, args);
        }, remaining);
      }
    };
  }

  function headerHeight() {
    var header = $('#header');
    return header ? header.offsetHeight : 60;
  }

  var CFG = window.SITE_CONFIG || {};
  var CREW = CFG.crew || [];

  function telHref(number) {
    return 'tel:' + String(number).replace(/[\s()-]/g, '');
  }

  (function applyConfig() {
    if (!window.SITE_CONFIG) return;

    $$('[data-call]').forEach(function (el) {
      var which = el.getAttribute('data-call');
      var number = CFG.phoneNumber;

      if (which !== 'main') {
        var member = CREW[parseInt(which, 10) - 1];
        if (member && member.phoneNumber) number = member.phoneNumber;
      }

      if (number) el.setAttribute('href', telHref(number));
    });

    if (CFG.phoneDisplay) {
      $$('[data-phone]').forEach(function (el) { el.textContent = CFG.phoneDisplay; });
    }

    if (CFG.phoneIntlDisplay) {
      $$('[data-phone-intl]').forEach(function (el) { el.textContent = CFG.phoneIntlDisplay; });
    }

    if (CFG.email) {
      $$('[data-email]').forEach(function (el) {
        el.textContent = CFG.email;
        el.setAttribute('href', 'mailto:' + CFG.email);
      });
    }

    var links = {
      viber: CFG.viberUrl,
      whatsapp: CFG.whatsappUrl,
      sms: CFG.smsUrl,
      maps: CFG.googleMapsUrl
    };

    $$('[data-link]').forEach(function (el) {
      var url = links[el.getAttribute('data-link')];
      if (url) el.setAttribute('href', url);
    });

    var prices = CFG.prices || {};
    $$('[data-price]').forEach(function (el) {
      var value = prices[el.getAttribute('data-price')];
      if (value) el.textContent = value;
    });

    $$('[data-crew-photo]').forEach(function (el) {
      var member = CREW[parseInt(el.getAttribute('data-crew-photo'), 10) - 1];
      if (member && member.driverPhoto) el.setAttribute('src', member.driverPhoto);
    });

    $$('[data-crew-car]').forEach(function (el) {
      var member = CREW[parseInt(el.getAttribute('data-crew-car'), 10) - 1];
      if (member && member.vehiclePhoto) el.setAttribute('src', member.vehiclePhoto);
    });
  })();

  /* Реченици што содржат телефонски линк — текстот доаѓа од преводот,
     а бројот од config.js. */
  (function phraseWithPhone() {
    var nodes = $$('[data-step-phone]');
    if (!nodes.length) return;

    function render() {
      nodes.forEach(function (node) {
        var link = $('a', node);
        if (!link) return;

        if (CFG.phoneDisplay) link.textContent = CFG.phoneDisplay;

        var template = t(node.getAttribute('data-step-phone'), null);
        if (template === null || template.indexOf('{phone}') === -1) return;

        var parts = template.split('{phone}');
        node.textContent = '';
        node.appendChild(document.createTextNode(parts[0]));
        node.appendChild(link);
        node.appendChild(document.createTextNode(parts.slice(1).join('{phone}')));
      });
    }

    render();
    document.addEventListener('langchange', render);
  })();

  var Nav = (function () {
    var nav = $('#nav');
    var burger = $('#burger');
    var scrim = $('#navScrim');
    var isOpen = false;

    if (!nav || !burger) return { close: function () {} };

    function focusables() {
      return $$('a[href], button:not([disabled])', nav).filter(function (el) {
        return el.offsetParent !== null;
      });
    }

    function syncLabel() {
      burger.setAttribute('aria-label', isOpen
        ? t('a11y.closeMenu', 'Затвори мени')
        : t('a11y.openMenu', 'Отвори мени'));
    }

    function open() {
      isOpen = true;
      nav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      if (scrim) scrim.hidden = false;
      syncLabel();
    }

    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (scrim) scrim.hidden = true;
      syncLabel();
      if (returnFocus) burger.focus();
    }

    burger.addEventListener('click', function () {
      isOpen ? close(false) : open();
    });

    if (scrim) {
      scrim.addEventListener('click', function () { close(false); });
    }

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        close(true);
        return;
      }

      if (event.key !== 'Tab') return;

      var items = focusables();
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('langchange', syncLabel);

    function handleBreakpoint(event) {
      if (event.matches) close(false);
    }

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', handleBreakpoint);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(handleBreakpoint);
    }

    return { close: close };
  })();

  (function stickyHeader() {
    var header = $('#header');
    if (!header) return;

    var onScroll = throttle(function () {
      header.classList.toggle('is-stuck', window.scrollY > 12);
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  (function scrollspy() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;

      var section = document.querySelector(id);
      if (!section) return;

      map[id.slice(1)] = link;
      sections.push(section);
    });

    var visible = {};

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      var bestId = null;
      var bestRatio = 0;

      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) {
          bestRatio = visible[id];
          bestId = id;
        }
      });

      links.forEach(function (link) { link.classList.remove('is-active'); });

      if (bestId && map[bestId]) {
        map[bestId].classList.add('is-active');
      }
    }, {
      rootMargin: '-25% 0px -45% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach(function (section) { observer.observe(section); });
  })();

  (function smoothAnchors() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      Nav.close(false);

      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      if (history.replaceState) history.replaceState(null, '', hash);
    });
  })();

  (function hashOnLoad() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    var target;
    try {
      target = document.querySelector(hash);
    } catch (e) {
      return;
    }
    if (!target) return;

    var settled = 0;

    function align() {
      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
      settled = Math.round(window.scrollY);
    }

    align();

    window.addEventListener('load', function () {
      if (Math.abs(window.scrollY - settled) < 4) align();
    });
  })();

  (function revealOnScroll() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) return;

        var delay = Math.min(index, 3) * 60;
        setTimeout(function () {
          entry.target.classList.add('is-visible');
        }, delay);

        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* Слајдер: возач + неговото возило */
  (function crew() {
    var root = $('#crew');
    if (!root) return;

    var viewport = $('#crewViewport', root);
    var slides = $$('[data-crew-slide]', root);
    var picks = $$('[data-crew-go]', root);
    var prevBtn = $('[data-crew-prev]', root);
    var nextBtn = $('[data-crew-next]', root);
    var indexOut = $('[data-crew-index]', root);
    var totalOut = $('[data-crew-total]', root);

    if (!viewport || slides.length < 2) return;

    var index = 0;

    if (totalOut) totalOut.textContent = String(slides.length);

    function labelSlides() {
      slides.forEach(function (slide, i) {
        var label = format('crew.slideLabel', { n: i + 1, total: slides.length }, null);
        if (label) slide.setAttribute('aria-label', label);
      });
    }

    function sync() {
      picks.forEach(function (btn, i) {
        var active = i === index;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
      });

      if (indexOut) indexOut.textContent = String(index + 1);
    }

    function offsetOf(i) {
      return slides[i].offsetLeft - slides[0].offsetLeft;
    }

    function go(next, fromUser) {
      var total = slides.length;
      index = ((next % total) + total) % total;

      viewport.scrollTo({
        left: offsetOf(index),
        behavior: prefersReducedMotion || !fromUser ? 'auto' : 'smooth'
      });

      sync();
    }

    picks.forEach(function (btn, i) {
      btn.addEventListener('click', function () { go(i, true); });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1, true); });

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(index - 1, true);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(index + 1, true);
      }
    });

    /* Свајп / скрол — најблискиот слајд станува активен. */
    viewport.addEventListener('scroll', throttle(function () {
      var position = viewport.scrollLeft;
      var closest = 0;
      var smallest = Infinity;

      slides.forEach(function (slide, i) {
        var distance = Math.abs(offsetOf(i) - position);
        if (distance < smallest) {
          smallest = distance;
          closest = i;
        }
      });

      if (closest !== index) {
        index = closest;
        sync();
      }
    }, 120), { passive: true });

    window.addEventListener('resize', throttle(function () {
      viewport.scrollTo({ left: offsetOf(index), behavior: 'auto' });
    }, 200));

    document.addEventListener('langchange', labelSlides);

    labelSlides();
    sync();
  })();

  (function callBar() {
    var bar = $('#callBar');
    var hero = $('#hero');
    var contact = $('#contact');
    if (!bar || !hero) return;

    var contactVisible = false;

    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        contactVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.12 }).observe(contact);
    }

    function update() {
      if (desktopQuery.matches) {
        bar.classList.remove('is-visible');
        bar.setAttribute('aria-hidden', 'true');
        return;
      }

      var pastHero = window.scrollY > hero.offsetHeight * 0.6;
      var show = pastHero && !contactVisible;

      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    window.addEventListener('scroll', throttle(update, 120), { passive: true });
    window.addEventListener('resize', throttle(update, 200));
    update();
  })();

  (function rideForm() {
    var form = $('#rideForm');
    if (!form) return;

    var result = $('#formResult');
    var preview = $('#msgPreview');
    var copyBtn = $('#copyBtn');

    var FIELD_KEYS = {
      name: 'form.name',
      phone: 'form.phone',
      from: 'form.from',
      to: 'form.to'
    };

    function setError(field, message) {
      var wrap = field.closest('.field');
      var slot = wrap ? $('[data-error-for="' + field.id + '"]', wrap) : null;

      if (wrap) wrap.classList.toggle('has-error', Boolean(message));
      if (slot) slot.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function isPhoneValid(value) {
      return (value.replace(/\D/g, '') || '').length >= 6;
    }

    function validate() {
      var firstInvalid = null;

      Object.keys(FIELD_KEYS).forEach(function (id) {
        var field = form.elements[id];
        if (!field) return;

        var value = field.value.trim();
        var message = '';

        if (!value) {
          message = format('form.errRequired', { field: t(FIELD_KEYS[id], id) }, 'Задолжително поле.');
        } else if (id === 'phone' && !isPhoneValid(value)) {
          message = t('form.errPhone', 'Внесете валиден телефонски број.');
        } else if (id === 'name' && value.length < 2) {
          message = t('form.errName', 'Внесете го вашето име.');
        }

        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });

      return firstInvalid;
    }

    function setSendLinks(message) {
      var encoded = message ? encodeURIComponent(message) : '';
      var intl = CFG.phoneNumber || '+38970123456';
      var digits = intl.replace(/\D/g, '');
      var viber = $('#sendViber');
      var whatsapp = $('#sendWhatsapp');
      var sms = $('#sendSms');

      if (viber) {
        viber.href = 'viber://chat?number=' + encodeURIComponent(intl) +
          (encoded ? '&text=' + encoded : '');
      }
      if (whatsapp) {
        whatsapp.href = 'https://wa.me/' + digits + (encoded ? '?text=' + encoded : '');
      }
      if (sms) {
        var separator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
        sms.href = 'sms:' + intl + (encoded ? separator + 'body=' + encoded : '');
      }
    }

    function buildMessage() {
      var get = function (id) {
        return form.elements[id] ? form.elements[id].value.trim() : '';
      };

      var lines = [
        t('form.msgHead', 'Барање за такси превоз'),
        '',
        t('form.msgName', 'Име') + ': ' + get('name'),
        t('form.msgPhone', 'Телефон') + ': ' + get('phone'),
        t('form.msgFrom', 'Од') + ': ' + get('from'),
        t('form.msgTo', 'До') + ': ' + get('to')
      ];

      if (get('when')) lines.push(t('form.msgWhen', 'Кога') + ': ' + get('when'));
      if (get('msg')) lines.push(t('form.msgNote', 'Забелешка') + ': ' + get('msg'));

      return lines.join('\n');
    }

    function publish(message) {
      setSendLinks(message);
      if (preview) preview.textContent = message;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var invalid = validate();
      if (invalid) {
        invalid.focus();
        return;
      }

      publish(buildMessage());

      if (result) {
        result.hidden = false;
        result.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest'
        });
      }
    });

    setSendLinks('');

    form.addEventListener('input', function (event) {
      var field = event.target;
      if (field.closest('.field.has-error')) setError(field, '');
    });

    /* Пораката и грешките се преведуваат заедно со страницата. */
    document.addEventListener('langchange', function () {
      if (result && !result.hidden) publish(buildMessage());
      if ($('.field.has-error', form)) validate();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = preview ? preview.textContent : '';
        if (!text) return;

        var done = function () {
          var original = copyBtn.textContent;
          copyBtn.textContent = t('form.copied', 'Копирано ✓');
          setTimeout(function () { copyBtn.textContent = original; }, 1800);
        };

        function fallbackCopy() {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(area);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    }
  })();

  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
