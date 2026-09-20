(function () {
  'use strict';

  var CONFIG = {
    phoneIntl: '+38970123456',
    phonePretty: '070 123 456'
  };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopQuery = window.matchMedia('(min-width: 900px)');

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
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
    return header ? header.offsetHeight : 66;
  }

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

    function open() {
      isOpen = true;
      nav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Затвори мени');
      document.body.classList.add('is-locked');
      if (scrim) scrim.hidden = false;
    }

    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Отвори мени');
      document.body.classList.remove('is-locked');
      if (scrim) scrim.hidden = true;
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

      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 12;

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
      var top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 12;
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

        var delay = Math.min(index, 4) * 70;
        setTimeout(function () {
          entry.target.classList.add('is-visible');
        }, delay);

        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach(function (el) { observer.observe(el); });
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

    var LABELS = {
      name: 'Име',
      phone: 'Телефон',
      from: 'Од локација',
      to: 'До локација'
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

      Object.keys(LABELS).forEach(function (id) {
        var field = form.elements[id];
        if (!field) return;

        var value = field.value.trim();
        var message = '';

        if (!value) {
          message = 'Полето „' + LABELS[id] + '“ е задолжително.';
        } else if (id === 'phone' && !isPhoneValid(value)) {
          message = 'Внесете валиден телефонски број.';
        } else if (id === 'name' && value.length < 2) {
          message = 'Внесете го вашето име.';
        }

        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });

      return firstInvalid;
    }

    function setSendLinks(message) {
      var encoded = message ? encodeURIComponent(message) : '';
      var digits = CONFIG.phoneIntl.replace(/\D/g, '');
      var viber = $('#sendViber');
      var whatsapp = $('#sendWhatsapp');
      var sms = $('#sendSms');

      if (viber) {
        viber.href = 'viber://chat?number=' + encodeURIComponent(CONFIG.phoneIntl) +
          (encoded ? '&text=' + encoded : '');
      }
      if (whatsapp) {
        whatsapp.href = 'https://wa.me/' + digits + (encoded ? '?text=' + encoded : '');
      }
      if (sms) {
        var separator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
        sms.href = 'sms:' + CONFIG.phoneIntl + (encoded ? separator + 'body=' + encoded : '');
      }
    }

    function buildMessage() {
      var get = function (id) {
        return form.elements[id] ? form.elements[id].value.trim() : '';
      };

      var lines = [
        'Барање за такси превоз',
        '',
        'Име: ' + get('name'),
        'Телефон: ' + get('phone'),
        'Од: ' + get('from'),
        'До: ' + get('to')
      ];

      if (get('when')) lines.push('Кога: ' + get('when'));
      if (get('msg')) lines.push('Забелешка: ' + get('msg'));

      return lines.join('\n');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var invalid = validate();
      if (invalid) {
        invalid.focus();
        return;
      }

      var message = buildMessage();
      setSendLinks(message);

      if (preview) preview.textContent = message;

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

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = preview ? preview.textContent : '';
        if (!text) return;

        var done = function () {
          var original = copyBtn.textContent;
          copyBtn.textContent = 'Копирано ✓';
          setTimeout(function () { copyBtn.textContent = original; }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }

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
      });
    }
  })();

  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
