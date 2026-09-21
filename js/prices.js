window.PRICES = {
  places: {
    city:         ['Низ Скопје', 'Within Skopje'],
    skopje:       ['Скопје', 'Skopje'],
    airport:      ['Аеродром Скопје', 'Skopje Airport'],
    kumanovo:     ['Куманово', 'Kumanovo'],
    veles:        ['Велес', 'Veles'],
    tetovo:       ['Тетово', 'Tetovo'],
    bitola:       ['Битола', 'Bitola'],
    ohrid:        ['Охрид', 'Ohrid'],
    pristina:     ['Приштина', 'Pristina'],
    thessaloniki: ['Солун', 'Thessaloniki'],
    sofia:        ['Софија', 'Sofia'],
    tirana:       ['Тирана', 'Tirana'],
    belgrade:     ['Белград', 'Belgrade'],
    podgorica:    ['Подгорица', 'Podgorica']
  },

  routes: [
    { from: 'skopje',  to: 'city',         meter: true },
    { from: 'skopje',  to: 'airport',      mkd: 1500 },
    { from: 'skopje',  to: 'kumanovo',     mkd: 1700 },
    { from: 'skopje',  to: 'tetovo',       mkd: 1800 },
    { from: 'skopje',  to: 'veles',        mkd: 2000 },
    { from: 'skopje',  to: 'bitola',       mkd: 5500 },
    { from: 'skopje',  to: 'ohrid',        mkd: 6500 },

    { from: 'airport', to: 'skopje',       mkd: 1500 },
    { from: 'airport', to: 'kumanovo',     mkd: 1850 },
    { from: 'airport', to: 'veles',        mkd: 2500 },
    { from: 'airport', to: 'tetovo',       mkd: 3700 },
    { from: 'airport', to: 'bitola',       mkd: 6100 },
    { from: 'airport', to: 'ohrid',        mkd: 7800 },

    { from: 'skopje',  to: 'pristina',     mkd: 5500,  km: 90 },
    { from: 'skopje',  to: 'thessaloniki', mkd: 8600,  km: 230 },
    { from: 'skopje',  to: 'sofia',        mkd: 11100, km: 240 },
    { from: 'skopje',  to: 'tirana',       mkd: 11700, km: 290 },
    { from: 'skopje',  to: 'podgorica',    mkd: 15400, km: 370 },
    { from: 'skopje',  to: 'belgrade',     mkd: 16000, km: 430 }
  ]
};
