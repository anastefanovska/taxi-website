/*
  Единствено место за податоците на бизнисот.
  Single place for the business data.

  Текстот (имиња, описи, типови возила) е во js/i18n.js под клучевите `crew.*`,
  бидејќи мора да постои и на македонски и на англиски.
  Text (names, descriptions, vehicle types) lives in js/i18n.js under `crew.*`,
  because it has to exist in both Macedonian and English.
*/

window.SITE_CONFIG = {
  businessName: 'Вардар Такси',

  phoneNumber: '+38970123456',
  phoneDisplay: '070 123 456',
  phoneIntlDisplay: '+389 70 123 456',
  email: 'kontakt@vardartaksi.mk',

  viberUrl: 'viber://chat?number=%2B38970123456',
  whatsappUrl: 'https://wa.me/38970123456',
  smsUrl: 'sms:+38970123456',
  googleMapsUrl: 'https://www.google.com/maps/place/Skopje/@41.9981,21.4254,12z',

  /*
    Возач + неговото возило. Заменете ги патеките со вистински фотографии
    (на пр. assets/images/driver-1.jpg, assets/images/car-1.jpg) — ништо друго
    не треба да се менува во HTML-от.

    Driver + their own car. Replace the paths with real photos
    (e.g. assets/images/driver-1.jpg, assets/images/car-1.jpg) — nothing else
    in the HTML needs to change.
  */
  crew: [
    {
      id: 'd1',
      driverPhoto: 'assets/images/driver-1.svg',
      vehiclePhoto: 'assets/images/car-1.svg',
      phoneNumber: '+38970123456',
      phoneDisplay: '070 123 456'
    },
    {
      id: 'd2',
      driverPhoto: 'assets/images/driver-2.svg',
      vehiclePhoto: 'assets/images/car-2.svg',
      phoneNumber: '+38970123457',
      phoneDisplay: '070 123 457'
    }
  ],

  prices: {
    city: '150',
    airport: '1.200'
  }
};
