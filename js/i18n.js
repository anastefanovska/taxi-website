(function (window, document) {
  'use strict';

  var STORAGE_KEY = 'vardar-lang';
  var DEFAULT_LANG = 'mk';

  var DICT = {
    mk: {
      'meta.title': 'Вардар Такси — Такси превоз во Скопје 24/7 | Јави се: 070 123 456',
      'meta.description': 'Вардар Такси — професионален такси превоз во Скопје и околината. Достапни 24/7, аеродромски трансфери, меѓуградски превоз и фиксни цени договорени однапред. Јавете се на 070 123 456.',
      'meta.ogTitle': 'Вардар Такси — Такси превоз во Скопје 24/7',
      'meta.ogDescription': 'Брзо, безбедно и точно до секоја адреса. Достапни 24 часа, 7 дена во неделата.',

      'brand.name': 'ВАРДАР',
      'brand.word': 'ТАКСИ',
      'brand.full': 'Вардар Такси',

      'a11y.skip': 'Оди на главна содржина',
      'a11y.brandHome': 'Вардар Такси — почетна',
      'a11y.mainNav': 'Главна навигација',
      'a11y.footerNav': 'Подножје навигација',
      'a11y.language': 'Јазик',
      'a11y.openMenu': 'Отвори мени',
      'a11y.closeMenu': 'Затвори мени',

      'nav.home': 'Почетна',
      'nav.about': 'За нас',
      'nav.services': 'Услуги',
      'nav.pricing': 'Цени',
      'nav.area': 'Подрачје',
      'nav.contact': 'Контакт',

      'cta.call': 'Јави се',
      'cta.callNow': 'Јави се веднаш',
      'cta.request': 'Побарај превоз',
      'cta.askPrice': 'Прашај за цена',
      'cta.viber': 'Пиши на Viber',
      'cta.sms': 'СМС',

      'hero.badge': 'Достапни 24/7 — Скопје и околината',
      'hero.title': 'Брзо, безбедно и <span class="hl">точно на време</span> — до секоја адреса.',
      'hero.lead': 'Личен такси превоз со проверен возач. Едно јавување е доволно — возилото е пред вас за неколку минути, а цената ја знаете однапред.',
      'hero.fact1': 'просечно доаѓање',
      'hero.fact2n': '12+ години',
      'hero.fact2': 'искуство на пат',
      'hero.fact3': 'секој ден во годината',
      'hero.imageAlt': 'Такси возило на улица во Скопје ноќе',
      'hero.plateTitle': 'Лиценциран превоз',
      'hero.plateText': 'Регистрирано и осигурано возило',

      'trust.label': 'Зошто да ни верувате',
      'trust.t1': 'Достапност 24/7',
      'trust.s1': 'Ден, ноќ, викенд и празник.',
      'trust.t2': 'Брз одговор',
      'trust.s2': 'Се јавуваме во првите секунди.',
      'trust.t3': 'Безбедно возење',
      'trust.s3': 'Мирно, трезвено и одговорно.',
      'trust.t4': 'Аеродромски трансфери',
      'trust.s4': 'Со следење на летот.',

      'crew.eyebrow': 'За нас',
      'crew.title': 'Запознајте ги возачите',
      'crew.lead': 'Кај нас знаете однапред кој доаѓа по вас и со кое возило. Двајца возачи, две возила — без непознати.',
      'crew.carousel': 'Возачи и нивните возила',
      'crew.role': 'Професионален возач',
      'crew.vehicleLabel': 'Доаѓа со ова возило',
      'crew.prev': 'Претходен возач',
      'crew.next': 'Следен возач',
      'crew.slideLabel': 'Возач {n} од {total}',
      'crew.spec1': '4 патници',
      'crew.spec2': 'Клима',

      'crew.d1Name': 'Дарко',
      'crew.d1Quote': '„Го знам градот. Доаѓам брзо и возам мирно.“',
      'crew.d1Alt': 'Дарко — професионален такси возач',
      'crew.d1Call': 'Јави се на Дарко',
      'crew.d1Tag1': 'Градски возења',
      'crew.d1Tag2': 'Го знае Скопје',
      'crew.d1Car': 'Седан · црна боја',
      'crew.d1CarDesc': 'Удобен седан за секојдневни возења низ градот.',
      'crew.d1CarAlt': 'Црн седан — возилото на Дарко',
      'crew.d1Spec3': '2 куфери',

      'crew.d2Name': 'Марко',
      'crew.d2Quote': '„Ноќни смени и рани летови — секогаш на време.“',
      'crew.d2Alt': 'Марко — професионален такси возач',
      'crew.d2Call': 'Јави се на Марко',
      'crew.d2Tag1': 'Ноќна смена',
      'crew.d2Tag2': 'Аеродром',
      'crew.d2Car': 'Седан · сива боја',
      'crew.d2CarDesc': 'Со повеќе простор за багаж — за аеродром и подолги релации.',
      'crew.d2CarAlt': 'Сив седан — возилото на Марко',
      'crew.d2Spec3': '3 куфери',

      'services.eyebrow': 'Услуги',
      'services.title': 'Превоз за секоја потреба',
      'services.lead': 'Кажете ја релацијата — останатото е наша работа.',
      'services.s1': 'Градски превоз',
      'services.s1d': 'Брзо и удобно низ цело Скопје.',
      'services.s2': 'Аеродромски трансфер',
      'services.s2d': 'Превоз до и од аеродром, со следење на летот.',
      'services.s3': 'Меѓуградски превоз',
      'services.s3d': 'Охрид, Битола, Тетово и други градови.',
      'services.s4': 'Хотелски трансфер',
      'services.s4d': 'Пречек и помош со багажот.',
      'services.s5': 'Деловни патувања',
      'services.s5d': 'Точен превоз за состаноци и гости.',
      'services.s6': 'Закажано возење',
      'services.s6d': 'Договорете го возењето еден ден однапред.',

      'pricing.eyebrow': 'Цени',
      'pricing.title': 'Јасни цени, без изненадувања',
      'pricing.lead': 'Ориентациони цени за најчестите релации. Точната цена ја договараме пред поаѓање.',
      'pricing.from': 'Од',
      'pricing.den': 'ден.',
      'pricing.tag': 'Најбарано',
      'pricing.p1': 'Градски превоз',
      'pricing.p1d': 'Релации во рамки на Скопје. Ноќна тарифа по договор.',
      'pricing.p2': 'Аеродром Скопје',
      'pricing.p2d': 'Фиксна цена во двата правца, со чекање до 45 минути.',
      'pricing.p3': 'Меѓуградски превоз',
      'pricing.p3v': 'По договор',
      'pricing.p3d': 'Цената зависи од градот и од тоа дали е во еден правец.',
      'pricing.note': 'Цените се ориентациони и зависат од релацијата, времето на чекање, бројот на патници и багажот. Плаќање во готово или на сметка.',

      'how.eyebrow': 'Како функционира',
      'how.title': 'Три чекори до вашето возење',
      'how.s1': 'Јавете се',
      'how.s1link': 'Едно јавување на {phone}, во било кое време.',
      'how.s2': 'Кажете каде сте',
      'how.s2d': 'Адреса или позната точка во близина — доволно е за да ве најдеме.',
      'how.s3': 'Пристигнуваме',
      'how.s3d': 'Обично за 5 до 10 минути, зависно од локацијата и сообраќајот.',

      'why.eyebrow': 'Зошто ние',
      'why.title': 'Мали работи што прават разлика',
      'why.w1': 'Безбедно возење',
      'why.w1d': 'Исправни возила и возачи што не брзаат непотребно.',
      'why.w2': 'Достапни 24/7',
      'why.w2d': 'И ноќе, и на празник, и во рани зори.',
      'why.w3': 'Го познаваме Скопје',
      'why.w3d': 'Најкраток пат до вашата адреса, без обиколки.',
      'why.w4': 'Чисти возила',
      'why.w4d': 'Уредна внатрешност и клима во секое возење.',
      'why.w5': 'Цена договорена однапред',
      'why.w5d': 'Ја кажуваме по телефон и таа важи на крајот.',
      'why.w6': 'Исти луѓе секој пат',
      'why.w6d': 'Не е диспечер — доаѓа возач што веќе го знаете.',

      'area.eyebrow': 'Подрачје на работа',
      'area.title': 'Скопје и околината',
      'area.lead': 'Ги покриваме сите градски општини, а по договор возиме и надвор од градот.',
      'area.a1': 'Центар',
      'area.a2': 'Карпош',
      'area.a3': 'Аеродром',
      'area.a4': 'Кисела Вода',
      'area.a5': 'Ѓорче Петров',
      'area.a6': 'Чаир',
      'area.a7': 'Бутел',
      'area.a8': 'Гази Баба',
      'area.a9': 'Драчево',
      'area.a10': 'Сарај',
      'area.a11': 'Илинден',
      'area.a12': 'Петровец',
      'area.note': 'Меѓуградски релации: Тетово, Куманово, Велес, Битола, Охрид и останатите градови.',
      'area.maps': 'Отвори во Google Maps',
      'area.mapAlt': 'Илустрирана мапа на подрачјето на работа во Скопје',
      'area.mapCaption': 'Ориентациски приказ на подрачјето на работа',

      'contact.eyebrow': 'Контакт',
      'contact.title': 'Едно јавување е доволно',
      'contact.lead': 'Најбрзо е по телефон. Ако сте во странство или ви е попогодно да пишувате — достапни сме и на Viber и WhatsApp.',
      'contact.hoursTitle': 'Работно време',
      'contact.hoursText': '24 часа, 7 дена во неделата',
      'contact.hoursShort': 'Достапни 24/7',
      'contact.placeTitle': 'Локација',
      'contact.placeText': 'Скопје, Северна Македонија',
      'contact.appsTitle': 'Viber / WhatsApp',

      'form.title': 'Побарај превоз',
      'form.sub': 'Пополнете ги полињата и пратете ја пораката преку апликацијата што ја користите. Не се чуваат податоци на овој сајт.',
      'form.name': 'Име',
      'form.namePlaceholder': 'Вашето име',
      'form.phone': 'Телефон',
      'form.phonePlaceholder': '07X XXX XXX',
      'form.from': 'Од локација',
      'form.fromPlaceholder': 'ул. Македонија 12, Центар',
      'form.to': 'До локација',
      'form.toPlaceholder': 'Аеродром Скопје',
      'form.when': 'Кога',
      'form.whenPlaceholder': 'Веднаш / денес во 18:30',
      'form.msg': 'Забелешка',
      'form.msgPlaceholder': 'Багаж, број на патници, детско столче…',
      'form.optional': '(опционално)',
      'form.submit': 'Подготви го барањето',
      'form.resultTitle': 'Барањето е подготвено',
      'form.resultSub': 'Изберете како да го испратите:',
      'form.sendViber': 'Испрати преку Viber',
      'form.copy': 'Копирај текст',
      'form.copied': 'Копирано ✓',
      'form.hint': 'Најбрз одговор добивате ако директно се јавите на',
      'form.errRequired': 'Полето „{field}“ е задолжително.',
      'form.errPhone': 'Внесете валиден телефонски број.',
      'form.errName': 'Внесете го вашето име.',
      'form.msgHead': 'Барање за такси превоз',
      'form.msgName': 'Име',
      'form.msgPhone': 'Телефон',
      'form.msgFrom': 'Од',
      'form.msgTo': 'До',
      'form.msgWhen': 'Кога',
      'form.msgNote': 'Забелешка',

      'footer.about': 'Професионален такси превоз во Скопје и околината. Достапни секој ден, 24 часа.',
      'footer.navTitle': 'Навигација',
      'footer.contactTitle': 'Контакт',
      'footer.place': 'Скопје, Северна Македонија',
      'footer.rights': 'Сите права задржани.',
      'footer.disclaimer': 'Демонстративен сајт — податоците и цените се илустративни.'
    },

    en: {
      'meta.title': 'Vardar Taxi — Taxi in Skopje 24/7 | Call: 070 123 456',
      'meta.description': 'Vardar Taxi — professional taxi service in Skopje and the surrounding area. Available 24/7, airport transfers, intercity rides and fixed prices agreed up front. Call 070 123 456.',
      'meta.ogTitle': 'Vardar Taxi — Taxi in Skopje 24/7',
      'meta.ogDescription': 'Fast, safe and punctual to any address. Available 24 hours, 7 days a week.',

      'brand.name': 'VARDAR',
      'brand.word': 'TAXI',
      'brand.full': 'Vardar Taxi',

      'a11y.skip': 'Skip to main content',
      'a11y.brandHome': 'Vardar Taxi — home',
      'a11y.mainNav': 'Main navigation',
      'a11y.footerNav': 'Footer navigation',
      'a11y.language': 'Language',
      'a11y.openMenu': 'Open menu',
      'a11y.closeMenu': 'Close menu',

      'nav.home': 'Home',
      'nav.about': 'About us',
      'nav.services': 'Services',
      'nav.pricing': 'Prices',
      'nav.area': 'Area',
      'nav.contact': 'Contact',

      'cta.call': 'Call',
      'cta.callNow': 'Call now',
      'cta.request': 'Request a ride',
      'cta.askPrice': 'Ask for a price',
      'cta.viber': 'Message on Viber',
      'cta.sms': 'SMS',

      'hero.badge': 'Available 24/7 — Skopje and the surrounding area',
      'hero.title': 'Fast, safe and <span class="hl">right on time</span> — to any address.',
      'hero.lead': 'A personal taxi service with a driver you know. One call is enough — the car is at your door in a few minutes, and you know the price before you set off.',
      'hero.fact1': 'average arrival',
      'hero.fact2n': '12+ years',
      'hero.fact2': 'on the road',
      'hero.fact3': 'every day of the year',
      'hero.imageAlt': 'Taxi on a Skopje street at night',
      'hero.plateTitle': 'Licensed service',
      'hero.plateText': 'Registered and insured vehicle',

      'trust.label': 'Why people trust us',
      'trust.t1': 'Available 24/7',
      'trust.s1': 'Day, night, weekends and holidays.',
      'trust.t2': 'Quick answer',
      'trust.s2': 'We pick up within seconds.',
      'trust.t3': 'Safe driving',
      'trust.s3': 'Calm, sober and responsible.',
      'trust.t4': 'Airport transfers',
      'trust.s4': 'With flight tracking.',

      'crew.eyebrow': 'About us',
      'crew.title': 'Meet the drivers',
      'crew.lead': 'You know up front who is coming for you and in which car. Two drivers, two cars — no strangers.',
      'crew.carousel': 'Drivers and their cars',
      'crew.role': 'Professional driver',
      'crew.vehicleLabel': 'Arrives in this car',
      'crew.prev': 'Previous driver',
      'crew.next': 'Next driver',
      'crew.slideLabel': 'Driver {n} of {total}',
      'crew.spec1': '4 passengers',
      'crew.spec2': 'Air conditioning',

      'crew.d1Name': 'Darko',
      'crew.d1Quote': '“I know the city. I come fast and drive calmly.”',
      'crew.d1Alt': 'Darko — professional taxi driver',
      'crew.d1Call': 'Call Darko',
      'crew.d1Tag1': 'City rides',
      'crew.d1Tag2': 'Knows Skopje',
      'crew.d1Car': 'Sedan · black',
      'crew.d1CarDesc': 'A comfortable sedan for everyday rides around the city.',
      'crew.d1CarAlt': 'Black sedan — Darko’s car',
      'crew.d1Spec3': '2 suitcases',

      'crew.d2Name': 'Marko',
      'crew.d2Quote': '“Night shifts and early flights — always on time.”',
      'crew.d2Alt': 'Marko — professional taxi driver',
      'crew.d2Call': 'Call Marko',
      'crew.d2Tag1': 'Night shift',
      'crew.d2Tag2': 'Airport',
      'crew.d2Car': 'Sedan · grey',
      'crew.d2CarDesc': 'More luggage space — for airport runs and longer routes.',
      'crew.d2CarAlt': 'Grey sedan — Marko’s car',
      'crew.d2Spec3': '3 suitcases',

      'services.eyebrow': 'Services',
      'services.title': 'A ride for every need',
      'services.lead': 'Tell us the route — the rest is our job.',
      'services.s1': 'City rides',
      'services.s1d': 'Fast and comfortable across Skopje.',
      'services.s2': 'Airport transfer',
      'services.s2d': 'To and from the airport, with flight tracking.',
      'services.s3': 'Intercity rides',
      'services.s3d': 'Ohrid, Bitola, Tetovo and other cities.',
      'services.s4': 'Hotel transfer',
      'services.s4d': 'Pickup and help with the luggage.',
      'services.s5': 'Business trips',
      'services.s5d': 'Punctual rides for meetings and guests.',
      'services.s6': 'Booked in advance',
      'services.s6d': 'Arrange your ride a day ahead.',

      'pricing.eyebrow': 'Prices',
      'pricing.title': 'Clear prices, no surprises',
      'pricing.lead': 'Indicative prices for the most common routes. We agree on the exact price before you set off.',
      'pricing.from': 'From',
      'pricing.den': 'MKD',
      'pricing.tag': 'Most booked',
      'pricing.p1': 'City ride',
      'pricing.p1d': 'Routes within Skopje. Night tariff on agreement.',
      'pricing.p2': 'Skopje Airport',
      'pricing.p2d': 'Fixed price both ways, with up to 45 minutes of waiting.',
      'pricing.p3': 'Intercity ride',
      'pricing.p3v': 'On request',
      'pricing.p3d': 'The price depends on the city and on whether it is one way.',
      'pricing.note': 'Prices are indicative and depend on the route, waiting time, number of passengers and luggage. Payment in cash or by invoice.',

      'how.eyebrow': 'How it works',
      'how.title': 'Three steps to your ride',
      'how.s1': 'Call us',
      'how.s1link': 'One call to {phone}, at any time.',
      'how.s2': 'Say where you are',
      'how.s2d': 'An address or a nearby landmark — that is enough for us to find you.',
      'how.s3': 'We arrive',
      'how.s3d': 'Usually in 5 to 10 minutes, depending on the location and traffic.',

      'why.eyebrow': 'Why us',
      'why.title': 'Small things that make the difference',
      'why.w1': 'Safe driving',
      'why.w1d': 'Cars in good order and drivers who do not rush.',
      'why.w2': 'Available 24/7',
      'why.w2d': 'At night, on holidays and in the early hours.',
      'why.w3': 'We know Skopje',
      'why.w3d': 'The shortest way to your address, no detours.',
      'why.w4': 'Clean cars',
      'why.w4d': 'A tidy interior and air conditioning on every ride.',
      'why.w5': 'Price agreed up front',
      'why.w5d': 'We tell you on the phone, and that is what you pay.',
      'why.w6': 'The same people every time',
      'why.w6d': 'No dispatcher — a driver you already know comes for you.',

      'area.eyebrow': 'Service area',
      'area.title': 'Skopje and the surrounding area',
      'area.lead': 'We cover every municipality in the city, and on agreement we also drive outside it.',
      'area.a1': 'Centar',
      'area.a2': 'Karpoš',
      'area.a3': 'Aerodrom',
      'area.a4': 'Kisela Voda',
      'area.a5': 'Ǵorče Petrov',
      'area.a6': 'Čair',
      'area.a7': 'Butel',
      'area.a8': 'Gazi Baba',
      'area.a9': 'Dračevo',
      'area.a10': 'Saraj',
      'area.a11': 'Ilinden',
      'area.a12': 'Petrovec',
      'area.note': 'Intercity routes: Tetovo, Kumanovo, Veles, Bitola, Ohrid and other cities.',
      'area.maps': 'Open in Google Maps',
      'area.mapAlt': 'Illustrated map of the service area in Skopje',
      'area.mapCaption': 'An indicative view of the service area',

      'contact.eyebrow': 'Contact',
      'contact.title': 'One call is enough',
      'contact.lead': 'The phone is fastest. If you are abroad or prefer to write — we are on Viber and WhatsApp too.',
      'contact.hoursTitle': 'Working hours',
      'contact.hoursText': '24 hours, 7 days a week',
      'contact.hoursShort': 'Available 24/7',
      'contact.placeTitle': 'Location',
      'contact.placeText': 'Skopje, North Macedonia',
      'contact.appsTitle': 'Viber / WhatsApp',

      'form.title': 'Request a ride',
      'form.sub': 'Fill in the fields and send the message through the app you already use. No data is stored on this site.',
      'form.name': 'Name',
      'form.namePlaceholder': 'Your name',
      'form.phone': 'Phone',
      'form.phonePlaceholder': '07X XXX XXX',
      'form.from': 'Pickup location',
      'form.fromPlaceholder': 'Makedonija St. 12, Centar',
      'form.to': 'Destination',
      'form.toPlaceholder': 'Skopje Airport',
      'form.when': 'When',
      'form.whenPlaceholder': 'Right now / today at 18:30',
      'form.msg': 'Note',
      'form.msgPlaceholder': 'Luggage, number of passengers, child seat…',
      'form.optional': '(optional)',
      'form.submit': 'Prepare the request',
      'form.resultTitle': 'Your request is ready',
      'form.resultSub': 'Choose how to send it:',
      'form.sendViber': 'Send via Viber',
      'form.copy': 'Copy text',
      'form.copied': 'Copied ✓',
      'form.hint': 'You get the fastest answer by calling',
      'form.errRequired': 'The “{field}” field is required.',
      'form.errPhone': 'Please enter a valid phone number.',
      'form.errName': 'Please enter your name.',
      'form.msgHead': 'Taxi ride request',
      'form.msgName': 'Name',
      'form.msgPhone': 'Phone',
      'form.msgFrom': 'From',
      'form.msgTo': 'To',
      'form.msgWhen': 'When',
      'form.msgNote': 'Note',

      'footer.about': 'Professional taxi service in Skopje and the surrounding area. Available every day, 24 hours.',
      'footer.navTitle': 'Navigation',
      'footer.contactTitle': 'Contact',
      'footer.place': 'Skopje, North Macedonia',
      'footer.rights': 'All rights reserved.',
      'footer.disclaimer': 'Demo site — the details and prices are illustrative.'
    }
  };

  function list(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function pickInitialLang() {
    var stored;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      stored = null;
    }
    /* Македонскиот е стандарден; англискиот се бира преку прекинувачот
       и потоа се памети. */
    return stored && DICT[stored] ? stored : DEFAULT_LANG;
  }

  var current = DEFAULT_LANG;

  function t(key) {
    var table = DICT[current] || DICT[DEFAULT_LANG];
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null;
  }

  function format(key, values) {
    var value = t(key);
    if (value === null) return null;

    return value.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(values || {}, name)
        ? values[name]
        : match;
    });
  }

  function apply() {
    list('[data-i18n]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n'));
      if (value !== null) el.textContent = value;
    });

    list('[data-i18n-html]').forEach(function (el) {
      var value = t(el.getAttribute('data-i18n-html'));
      if (value !== null) el.innerHTML = value;
    });

    list('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var split = pair.indexOf(':');
        if (split < 1) return;

        var attr = pair.slice(0, split).trim();
        var value = t(pair.slice(split + 1).trim());
        if (attr && value !== null) el.setAttribute(attr, value);
      });
    });
  }

  function setLang(lang, persist) {
    if (!DICT[lang]) lang = DEFAULT_LANG;
    current = lang;

    document.documentElement.setAttribute('lang', lang);
    apply();

    var title = t('meta.title');
    if (title) document.title = title;

    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'mk' ? 'mk_MK' : 'en_US');

    list('.lang__btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}
    }

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  list('.lang__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'), true);
    });
  });

  window.I18N = {
    t: t,
    format: format,
    apply: apply,
    setLang: setLang,
    get lang() { return current; }
  };

  setLang(pickInitialLang(), false);

})(window, document);
