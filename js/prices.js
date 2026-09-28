window.PRICES = {
  currency: 'EUR',

  places: {
    skopje:          ['Скопје', 'Skopje'],
    airport:         ['Меѓународен Аеродром Скопје', 'Skopje International Airport'],
    kumanovo:        ['Куманово', 'Kumanovo'],
    tetovo:          ['Тетово', 'Tetovo'],
    veles:           ['Велес', 'Veles'],
    bitola:          ['Битола', 'Bitola'],
    ohrid:           ['Охрид', 'Ohrid'],
    matka:           ['Матка', 'Matka'],
    pristina:        ['Приштина', 'Pristina'],
    pristinaAirport: ['Меѓународен Аеродром Приштина', 'Pristina International Airport'],
    nis:             ['Ниш', 'Nis'],
    thessaloniki:    ['Солун', 'Thessaloniki'],
    sofia:           ['Софија', 'Sofia'],
    sofiaAirport:    ['Меѓународен Аеродром Софија', 'Sofia International Airport'],
    tirana:          ['Тирана', 'Tirana'],
    podgorica:       ['Подгорица', 'Podgorica'],
    budva:           ['Будва', 'Budva'],
    belgrade:        ['Белград', 'Belgrade'],
    sarajevo:        ['Сараево', 'Sarajevo'],
    athens:          ['Атина', 'Athens'],
    zagreb:          ['Загреб', 'Zagreb']
  },

  routes: [
    { type: 'airport', from: 'skopje',  to: 'airport',  eur: 23 },
    { type: 'airport', from: 'airport', to: 'kumanovo', eur: 35 },
    { type: 'airport', from: 'airport', to: 'tetovo',   eur: 50 },
    { type: 'airport', from: 'airport', to: 'veles',    eur: 50 },
    { type: 'airport', from: 'airport', to: 'bitola',   eur: 110 },
    { type: 'airport', from: 'airport', to: 'ohrid',    eur: 130 },

    {
      type: 'private',
      id:   'matka',
      from: 'skopje',
      to:   'matka',
      via:  ['skopje', 'matka', 'skopje'],
      note: ['2 часа чекање', '2 hours waiting'],
      eur:  50
    },
    {
      type:  'private',
      id:    'tour',
      title: ['Скопје тура', 'Skopje tour'],
      stops: [
        ['Македонско Село', 'Macedonian Village'],
        ['Средно Водно', 'Sredno Vodno'],
        ['Панорама', 'Panorama']
      ],
      eur: 50
    },
    {
      type:  'private',
      id:    'business',
      title: ['Business day in Skopje', 'Business day in Skopje'],
      quote: true
    },

    { type: 'international', from: 'skopje', to: 'pristina',        eur: 80,  km: 100 },
    { type: 'international', from: 'skopje', to: 'pristinaAirport', eur: 85,  km: 120 },
    { type: 'international', from: 'skopje', to: 'nis',             eur: 150, km: 200 },
    { type: 'international', from: 'skopje', to: 'thessaloniki',    eur: 180, km: 240 },
    { type: 'international', from: 'skopje', to: 'sofia',           eur: 180, km: 240 },
    { type: 'international', from: 'skopje', to: 'sofiaAirport',    eur: 180, km: 250 },
    { type: 'international', from: 'skopje', to: 'tirana',          eur: 290, km: 350 },
    { type: 'international', from: 'skopje', to: 'podgorica',       eur: 300, km: 410 },
    { type: 'international', from: 'skopje', to: 'budva',           eur: 300, km: 430 },
    { type: 'international', from: 'skopje', to: 'belgrade',        eur: 280, km: 430 },
    { type: 'international', from: 'skopje', to: 'sarajevo',        eur: 650, km: 620 },
    { type: 'international', from: 'skopje', to: 'athens',          eur: 600, km: 700 },
    { type: 'international', from: 'skopje', to: 'zagreb',          eur: 670, km: 820 }
  ]
};
