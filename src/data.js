// ──────────────────────────────────────────────────────────────
//  RIKOSZET — Bar & Klub Gier · treści, godziny, cennik, zasoby
// ──────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'RIKOSZET',
  tagline: 'Bar & Klub Gier',
  claim: 'Bilard, rzutki i karaoke pod jednym dachem starej rozlewni.',
  address: 'ul. Słodowa 8, 50-266 Wrocław',
  phone: '+48 71 307 08 08',
  email: 'rezerwacje@rikoszet.pl',
  socials: [
    { id: 'ig', label: 'Instagram', handle: '@rikoszet.wro' },
    { id: 'fb', label: 'Facebook', handle: '/rikoszetwro' },
    { id: 'tt', label: 'TikTok', handle: '@rikoszet' },
  ],
};

// Godziny otwarcia: [otwarcie, zamknięcie] w minutach od północy.
// Zamknięcie > 1440 oznacza, że bar gra do rana następnego dnia.
// Indeks 0 = niedziela (jak Date.getDay()).
export const HOURS = [
  { day: 'Niedziela', open: 14 * 60, close: 22 * 60 },
  { day: 'Poniedziałek', open: 16 * 60, close: 24 * 60 },
  { day: 'Wtorek', open: 16 * 60, close: 24 * 60 },
  { day: 'Środa', open: 16 * 60, close: 24 * 60 },
  { day: 'Czwartek', open: 16 * 60, close: 24 * 60 },
  { day: 'Piątek', open: 16 * 60, close: 26 * 60 },
  { day: 'Sobota', open: 14 * 60, close: 26 * 60 },
];

export const fmtTime = (min) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Stan otwarcia w danym momencie (uwzględnia granie do rana). */
export function openState(now = new Date()) {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const today = HOURS[day];
  const yesterday = HOURS[(day + 6) % 7];

  if (yesterday.close > 1440 && minutes < yesterday.close - 1440) {
    return { open: true, until: yesterday.close, label: `Otwarte do ${fmtTime(yesterday.close)}` };
  }
  if (minutes >= today.open && minutes < Math.min(today.close, 1440)) {
    return { open: true, until: today.close, label: `Otwarte do ${fmtTime(today.close)}` };
  }
  if (minutes < today.open) {
    return { open: false, label: `Otwieramy dziś o ${fmtTime(today.open)}` };
  }
  const tomorrow = HOURS[(day + 1) % 7];
  return { open: false, label: `Otwieramy jutro o ${fmtTime(tomorrow.open)}` };
}

// ── Tryby widoku (cały budynek / parter / parter+piętro) ─────
export const MODE_VIEWS = {
  full: { pos: [17, 12.8, 42], target: [1, 3.4, 0] },
  parter: { pos: [13, 27, 26], target: [-3, 0.4, -0.6] },
  pietro: { pos: [13, 29, 24], target: [-1, 4.8, 0] },
};

// ── Atrakcje / hotspoty ──────────────────────────────────────
// anchor    – etykieta na elewacji (tryb „full")
// anchorIn  – etykieta we wnętrzu (tryb przekroju)
// view      – tryb + ujęcie kamery + strefa podświetlenia [x,y,z,r]
export const ATTRACTIONS = [
  {
    id: 'bar',
    name: 'Bar główny',
    kicker: 'Parter · serce lokalu',
    anchor: [3.2, 3.4, 6.4],
    anchorIn: [-3.5, 3.4, -1.2],
    modes: ['full', 'parter'],
    view: {
      mode: 'parter',
      camera: { pos: [4.5, 13, 13], target: [-3.5, 0.6, -1.6] },
      zone: [-3.5, 0.16, -1.8, 3.4],
    },
    art: 'bar',
    desc: [
      'Dziewięciometrowy kontuar z dębowej deski, dziesięć kranów z piwem rzemieślniczym i koktajle, które bartenderzy ćwiczą dłużej niż niejeden zawodnik break-a.',
      'W lodówkach zawsze coś bezalkoholowego, a w kuchni proste, porządne jedzenie barowe: smashburgery, skrzydełka i frytki z parmezanem.',
    ],
    facts: [
      ['Krany', '10 × kraft + 2 × lager'],
      ['Koktajle', 'karta sezonowa, 14 pozycji'],
      ['Kuchnia', 'do godz. 22:00'],
      ['Happy hours', 'pn–czw 16:00–18:00, −20%'],
    ],
    cta: { type: 'booking', resource: 'loza', label: 'Zarezerwuj lożę' },
  },
  {
    id: 'bilard',
    name: 'Strefa bilarda',
    kicker: 'Piętro · 5 stołów',
    anchor: [-2.5, 7.6, 6.4],
    anchorIn: [-1.8, 7.6, 0.2],
    modes: ['full', 'pietro'],
    view: {
      mode: 'pietro',
      camera: { pos: [4, 17, 14], target: [-2, 5.0, 0.4] },
      zone: [-1.8, 4.7, 0.2, 4.6],
    },
    art: 'bilard',
    desc: [
      'Pięć dziewięciostopowych stołów turniejowych pod oryginalnym stropem z 1926 roku. Sukno wymieniamy co sezon, kije ważymy i prostujemy — przesada? Może. Ale rykoszety lubią precyzję.',
      'Każdy stół rezerwujesz na konkretną godzinę i wybierasz go sam na planie sali — narożny przy oknie ma najlepsze światło.',
    ],
    facts: [
      ['Stoły', '5 × 9ft, sukno Simonis'],
      ['Cena', '35 zł / h za stół'],
      ['Przed 18:00', '25 zł / h (pn–czw)'],
      ['Sprzęt', 'kije i talk w cenie'],
    ],
    cta: { type: 'booking', resource: 'bilard', label: 'Zarezerwuj stół' },
  },
  {
    id: 'rzutki',
    name: 'Strefa rzutek',
    kicker: 'Parter · 4 tory',
    anchor: [7.2, 3.4, -5.7],
    anchorIn: [5.2, 3.2, -3.0],
    modes: ['full', 'parter'],
    view: {
      mode: 'parter',
      camera: { pos: [7.5, 11, 8.5], target: [5.2, 1.2, -3.6] },
      zone: [5.2, 0.16, -3.4, 2.8],
    },
    art: 'rzutki',
    desc: [
      'Cztery tory steel dart z tarczami sizalowymi i elektroniczną punktacją na tabletach — system sam liczy 501, cricket i osiem innych wariantów.',
      'W środy gra tu liga amatorska, w pozostałe dni tory są do wzięcia. Rzutki dostaniesz przy barze, własne lotki mile widziane.',
    ],
    facts: [
      ['Tory', '4 × steel dart, sizal'],
      ['Punktacja', 'elektroniczna, 10 gier'],
      ['Cena', '25 zł / h za tor'],
      ['Liga', 'środy od 19:00'],
    ],
    cta: { type: 'booking', resource: 'rzutki', label: 'Zarezerwuj tor' },
  },
  {
    id: 'scena',
    name: 'Scena & karaoke',
    kicker: 'Hala · koncerty na żywo',
    anchor: [-16, 5.4, 5.2],
    anchorIn: [-18.5, 4.6, 0],
    modes: ['full', 'parter'],
    view: {
      mode: 'parter',
      camera: { pos: [-8, 13, 12], target: [-17.5, 1.2, -0.3] },
      zone: [-19.2, 0.16, 0, 3.6],
    },
    art: 'scena',
    desc: [
      'Dawna hala rozlewni mieści scenę z pełnym nagłośnieniem, parkiet i kulę dyskotekową rozmiaru XXL. W czwartki gramy koncerty, w piątki mikrofon przejmujecie wy.',
      'Baza karaoke to ponad 4000 utworów — od Krawczyka po Dawida Podsiadło. Odwagi dodaje promocja na shoty dla śpiewających.',
    ],
    facts: [
      ['Koncerty', 'czwartki 20:00, wstęp wolny'],
      ['Karaoke', 'piątki od 21:00'],
      ['Baza utworów', '4000+ (PL/EN)'],
      ['Nagłośnienie', 'pełen front + monitory'],
    ],
    cta: { type: 'program', label: 'Zobacz program tygodnia' },
  },
  {
    id: 'salka',
    name: 'Salka eventowa',
    kicker: 'Piętro · imprezy do 40 osób',
    anchor: [-1.5, 7.6, -5.7],
    anchorIn: [7.2, 7.4, 0],
    modes: ['full', 'pietro'],
    view: {
      mode: 'pietro',
      camera: { pos: [12.5, 14, 9], target: [7, 5.2, 0] },
      zone: [7.2, 4.7, 0, 2.7],
    },
    art: 'salka',
    desc: [
      'Osobna sala za szklaną ścianą, z własnym barkiem, nagłośnieniem i widokiem na stoły bilardowe. Urodziny, wieczory kawalerskie, integracje — bierzecie salę, my ogarniamy resztę.',
      'W pakiecie urodzinowym dorzucamy dekoracje, tort od zaprzyjaźnionej cukierni i godzinę bilarda na rozgrzewkę.',
    ],
    facts: [
      ['Pojemność', 'do 40 osób'],
      ['Wynajem', 'od 800 zł / 4 h'],
      ['Barek', 'własny, z obsługą'],
      ['Pakiety', 'urodzinowy · firmowy'],
    ],
    cta: { type: 'booking', resource: 'salka', label: 'Zarezerwuj salkę' },
  },
  {
    id: 'ogrodek',
    name: 'Ogródek letni',
    kicker: 'Patio · maj–wrzesień',
    anchor: [17, 2.6, 3.6],
    anchorIn: [17, 2.6, 3.6],
    modes: ['full', 'parter', 'pietro'],
    view: {
      mode: 'full',
      camera: { pos: [30, 7, 22], target: [16, 2, 1] },
      zone: null,
    },
    art: 'ogrodek',
    desc: [
      'Drewniany taras między ceglanymi murami: parasole, girlandy i stoliki z widokiem na zachód słońca nad Odrą. Latem działa tu letni bar z lemoniadami i aperolem.',
      'Psy mile widziane — miska z wodą stoi przy wejściu, a obok znajdziecie stojaki na rowery.',
    ],
    facts: [
      ['Miejsca', '60 na tarasie'],
      ['Sezon', 'maj – wrzesień'],
      ['Letni bar', 'lemoniady · spritze'],
      ['Udogodnienia', 'koce · psy OK · rowery'],
    ],
    cta: { type: 'booking', resource: 'loza', label: 'Zarezerwuj stolik' },
  },
  {
    id: 'historia',
    name: 'Historia budynku',
    kicker: 'Rozlewnia z 1926 roku',
    anchor: [-7.5, 9.8, 5.6],
    anchorIn: [-7.5, 9.8, 5.6],
    modes: ['full'],
    view: {
      mode: 'full',
      camera: { pos: [-16, 14, 26], target: [-3, 6, 0] },
      zone: null,
    },
    art: 'historia',
    desc: [
      'Budynek przy Słodowej 8 powstał w 1926 roku jako rozlewnia Browaru Miejskiego. Cegła, stalowe okna i żeliwne słupy przetrwały do dziś — my tylko odkurzyliśmy je z lat farby i przywróciliśmy do życia.',
    ],
    facts: [
      ['Rocznik', '1926'],
      ['Dawniej', 'rozlewnia browaru'],
      ['Materiał', 'cegła · stal · żeliwo'],
      ['Status', 'budynek zabytkowy'],
    ],
    cta: { type: 'contact', label: 'Jak do nas trafić' },
  },
];

// ── Zasoby rezerwacyjne ──────────────────────────────────────
export const RESOURCES = {
  bilard: {
    id: 'bilard',
    label: 'Stół bilardowy',
    icon: 'bilard',
    units: 5,
    unitName: (n) => `Stół ${n}`,
    pricePerHour: 35,
    offPeak: { price: 25, note: 'pn–czw przed 18:00' },
    durations: [1, 2, 3],
    map: 'bilard',
    blurb: '5 stołów 9ft · kije i talk w cenie',
  },
  rzutki: {
    id: 'rzutki',
    label: 'Tor do rzutek',
    icon: 'rzutki',
    units: 4,
    unitName: (n) => `Tor ${n}`,
    pricePerHour: 25,
    durations: [1, 2],
    map: 'rzutki',
    blurb: '4 tory steel dart · punktacja elektroniczna',
  },
  loza: {
    id: 'loza',
    label: 'Loża / stolik',
    icon: 'loza',
    units: 4,
    unitName: (n) => `Loża ${n}`,
    pricePerHour: 0,
    minSpend: 150,
    durations: [2, 3],
    map: 'loza',
    blurb: '4 loże do 8 osób · bez opłaty, min. barowe 150 zł',
  },
  salka: {
    id: 'salka',
    label: 'Salka eventowa',
    icon: 'salka',
    units: 1,
    unitName: () => 'Salka',
    durations: [4, 6],
    basePrice: { 4: 800, 6: 1100 },
    packages: [
      { id: 'none', name: 'Sama salka', desc: 'Sala, nagłośnienie, obsługa barku', price: 0 },
      { id: 'bday', name: 'Pakiet urodzinowy', desc: 'Dekoracje, tort, 1 h bilarda gratis', price: 250 },
      { id: 'firm', name: 'Pakiet firmowy', desc: 'Catering fingerfood, faktura VAT', price: 45, perPerson: true },
    ],
    guests: { min: 10, max: 40, default: 16 },
    blurb: 'do 40 osób · własny barek · od 800 zł',
  },
};

// ── Program tygodnia ─────────────────────────────────────────
export const PROGRAM = [
  { day: 'Poniedziałek', name: 'Wieczór planszówek', time: '18:00', desc: 'Półka pełna gier przy barze, obsługa tłumaczy zasady.' },
  { day: 'Wtorek', name: 'Pool Academy', time: '18:30', desc: 'Darmowe mini-lekcje bilarda z instruktorem, zapisy przy barze.' },
  { day: 'Środa', name: 'Liga rzutek', time: '19:00', desc: 'Runda ligi amatorskiej 501 double-out. Dołączyć może każdy.' },
  { day: 'Czwartek', name: 'Koncert na żywo', time: '20:00', desc: 'Lokalne składy na scenie hali. Wstęp wolny.' },
  { day: 'Piątek', name: 'Karaoke Night', time: '21:00', desc: '4000+ utworów, shoty dla śpiewających, parkiet do 2:00.' },
  { day: 'Sobota', name: 'DJ & Late Pool', time: '20:00', desc: 'Winyle, funk i happy hours na bilard po 23:00.' },
  { day: 'Niedziela', name: 'Turniej 8-ball', time: '17:00', desc: 'Otwarte eliminacje, wpisowe 20 zł, pula na bar.' },
];

// ── Cennik (modal) ───────────────────────────────────────────
export const PRICING = [
  {
    group: 'Gry', rows: [
      ['Bilard (stół / h)', '35 zł'],
      ['Bilard pn–czw do 18:00', '25 zł'],
      ['Rzutki (tor / h)', '25 zł'],
      ['Wypożyczenie lotek premium', '10 zł'],
    ],
  },
  {
    group: 'Rezerwacje', rows: [
      ['Loża (do 8 osób)', '0 zł · min. barowe 150 zł'],
      ['Salka eventowa 4 h', 'od 800 zł'],
      ['Salka eventowa 6 h', 'od 1100 zł'],
      ['Pakiet urodzinowy', '+250 zł'],
    ],
  },
  {
    group: 'Bar', rows: [
      ['Piwo z kranu 0,5 l', '14–18 zł'],
      ['Koktajl autorski', '26–32 zł'],
      ['Lemoniada / 0%', '12–16 zł'],
      ['Smashburger + frytki', '34 zł'],
    ],
  },
];

export const STORAGE_KEY = 'rikoszet_bookings_v1';
