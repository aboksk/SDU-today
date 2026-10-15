const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const prototypePath = path.resolve(__dirname, '..', '..', '..', 'legacy-prototype', 'app.js');
const outputPath = path.join(__dirname, 'prototype-data.json');
const source = fs.readFileSync(prototypePath, 'utf8');

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Could not find "${startMarker}" in the prototype.`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Could not find "${endMarker}" in the prototype.`);
  return source.slice(start, end);
}

function evaluateData(code, assignment) {
  const context = vm.createContext({});
  vm.runInContext(`${code}\nglobalThis.exportedData = ${assignment};`, context);
  return JSON.parse(JSON.stringify(context.exportedData));
}

const locationSource = between('const FAC={', '\nconst LOC_BY_ID');
const clubsSource = between('const CLUBS={', '\nconst ECAT=');
const eventsSource = between('const BASE_EVENTS=', '\nBASE_EVENTS.forEach');
const newsSource = between('const NEWS=', '\nNEWS.forEach');

const locations = evaluateData(locationSource, 'LOCS');
const clubs = evaluateData(clubsSource, 'CLUBS');
const events = evaluateData(eventsSource, 'BASE_EVENTS');
const news = evaluateData(newsSource, 'NEWS');

const exported = {
  source: 'legacy-prototype/app.js',
  clubs: Object.entries(clubs).map(([id, name]) => ({ id, name })),
  events: events.map((event) => ({
    id: event.id,
    category: event.cat,
    clubId: event.club,
    daysFromToday: event.d,
    time: event.time,
    title: event.title,
    description: event.desc,
    price: event.price,
    capacity: event.cap,
    soldCount: event.sold,
    locationId: event.loc,
    locationDescription: event.locText ?? null,
  })),
  news: news.map((item) => ({
    id: item.id,
    category: item.cat,
    daysFromToday: item.d,
    title: { ru: item.ru.t, en: item.en.t },
    lead: { ru: item.ru.lead, en: item.en.lead },
    body: { ru: item.ru.b, en: item.en.b },
    relatedEventId: item.ev ?? null,
  })),
  locations,
};

fs.writeFileSync(outputPath, `${JSON.stringify(exported, null, 2)}\n`);
console.log(
  `Exported ${exported.clubs.length} clubs, ${exported.events.length} events, ${exported.news.length} news, and ${exported.locations.length} locations.`,
);
