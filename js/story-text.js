(function () {
  var extra = {
    mk: {
      'ch.start':    'Почеток',
      'ch.city':     'Скопје',
      'ch.car':      'Возачите',
      'ch.air':      'Аеродром',
      'ch.local':    'Низ Скопје',
      'ch.abroad':   'Преку граница',
      'ch.road':     'Патот',
      'ch.faq':      'Прашања',
      'ch.go':       'Тргнуваме',

      'hero.say':    'Само кажи',
      'hero.where':  'КАДЕ.',
      'hero.aria':   'Само кажи каде.',

      'hello.m':        'Здраво! Јас сум Марјан.',
      'hello.i':        'Мило ми е! Јас сум Игор.',
      'drivers.kicker': 'Запознајте нѐ',
      'car.kicker':     'Возилото',
      'car.tag':        'Удобно и подготвено за пат.',
      'car.f1':         'До 3 патници',
      'car.f2':         'Багажот е во цената',
      'car.f3':         'Детско седиште',
      'car.f4':         'Клима',
      'car.gallery':    'Фотографии од возилото',
      'car.v1':         'Однапред',
      'car.v2':         'Одзади',
      'car.v3':         'Внатре',

      'board.now':   'Избрана релација',

      'tour.matka':  'Кањон Матка',
      'tour.tour':   'Скопје ноќе',
      'tour.business': 'Скопје',

      'map.hint':    'Повлечете за да ја свртите мапата.',

      'road.title':  'Патот е долг. Цената е јасна.',
      'road.lead':   'По возило, во еден правец. Гориво, патарини и багаж се вклучени.'
    },
    en: {
      'ch.start':    'Start',
      'ch.city':     'Skopje',
      'ch.car':      'The drivers',
      'ch.air':      'Airport',
      'ch.local':    'Around Skopje',
      'ch.abroad':   'Across the border',
      'ch.road':     'The road',
      'ch.faq':      'Questions',
      'ch.go':       'Let’s go',

      'hero.say':    'Just say',
      'hero.where':  'WHERE.',
      'hero.aria':   'Just say where.',

      'hello.m':        'Hi! I’m Marjan.',
      'hello.i':        'Nice to meet you! I’m Igor.',
      'drivers.kicker': 'Get to know us',
      'car.kicker':     'The car',
      'car.tag':        'Comfortable and ready to go.',
      'car.f1':         'Up to 3 passengers',
      'car.f2':         'Luggage included',
      'car.f3':         'Child seat',
      'car.f4':         'Air conditioning',
      'car.gallery':    'Photos of the car',
      'car.v1':         'Front',
      'car.v2':         'Back',
      'car.v3':         'Inside',

      'board.now':   'Selected route',

      'tour.matka':  'Matka Canyon',
      'tour.tour':   'Skopje at night',
      'tour.business': 'Skopje',

      'map.hint':    'Drag to turn the map.',

      'road.title':  'Long road. Clear price.',
      'road.lead':   'Per car, one way. Fuel, tolls and luggage included.'
    }
  };

  Object.keys(extra).forEach(function (lang) {
    Object.keys(extra[lang]).forEach(function (key) {
      window.TEXT[lang][key] = extra[lang][key];
    });
  });

  window.STORY = {
    photo: function (id, w) {
      return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + (w || 1400) + '&q=82';
    },

    places: {
      skopje:          { ll: [41.9981, 21.4254] },
      airport:         { ll: [41.9616, 21.6214] },
      pristina:        { ll: [42.6629, 21.1655], img: '1702134731681-97d4f829b4a6' },
      pristinaAirport: { ll: [42.5728, 21.0358], img: '1560814434-b7a1183d4be2' },
      nis:             { ll: [43.3209, 21.8958], img: '1724010820228-1c3e53450f54' },
      thessaloniki:    { ll: [40.6401, 22.9444], img: '1763567966641-2fd8676612b5' },
      sofia:           { ll: [42.6977, 23.3219], img: '1728884899178-037c53e62d2f' },
      sofiaAirport:    { ll: [42.6967, 23.4114], img: '1665147136748-6317acbc0bd8' },
      tirana:          { ll: [41.3275, 19.8187], img: '1624305740286-dbbccc54fb96' },
      podgorica:       { ll: [42.4304, 19.2594], img: '1702134731681-97d4f829b4a6' },
      budva:           { ll: [42.2911, 18.8403], img: '1590147534648-1ac5cca59621' },
      belgrade:        { ll: [44.7866, 20.4489], img: '1708253878764-59d78ff5e6db' },
      sarajevo:        { ll: [43.8563, 18.4131], img: '1684411070429-eef3312bb91d' },
      athens:          { ll: [37.9838, 23.7275], img: '1571759796533-4aa0e23f040c' },
      zagreb:          { ll: [45.8150, 15.9819], img: '1724010820228-1c3e53450f54' }
    },

    hero: [
      { img: '1625225190720-fe534839dab6' },
      { to: 'thessaloniki', img: '1763567966641-2fd8676612b5' },
      { to: 'budva',        img: '1590147534648-1ac5cca59621' },
      { to: 'athens',       img: '1571759796533-4aa0e23f040c' },
      { to: 'belgrade',     img: '1708253878764-59d78ff5e6db' }
    ],

    tours: {
      matka:    '1759959175828-8f6bbf894001',
      tour:     '1625225190720-fe534839dab6',
      business: '1740068567986-8e77b3f86af9'
    },

    wall: [
      '1751453764876-4406edd810c2', '1590147534648-1ac5cca59621', '1625225190720-fe534839dab6',
      '1571759796533-4aa0e23f040c', '1759959175828-8f6bbf894001', '1708253878764-59d78ff5e6db',
      '1763567966641-2fd8676612b5', '1590147175614-b5df7b440985', '1740068567986-8e77b3f86af9',
      '1665147136748-6317acbc0bd8', '1727551237046-e0172cf0b3bc', '1724010820228-1c3e53450f54',
      '1596072163669-a5379d03a98b', '1684411070429-eef3312bb91d', '1560814434-b7a1183d4be2',
      '1702134731681-97d4f829b4a6'
    ]
  };
})();
