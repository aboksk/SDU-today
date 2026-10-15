import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type Translation = { ru: string; en: string };
type PrototypeLocation = {
  id: string;
  kind: string;
  cat: string;
  x: number;
  y: number;
  block: string;
  floor?: number;
  row?: string;
  ru: string;
  en: string;
  kw?: string;
};
type PrototypeData = {
  clubs: Array<{ id: string; name: Translation }>;
  events: Array<{
    id: string;
    category: string;
    clubId: string;
    daysFromToday: number;
    time: string;
    title: Translation;
    description: Translation;
    price: number;
    capacity: number;
    soldCount: number;
    locationId: string | null;
    locationDescription: Translation | null;
  }>;
  news: Array<{
    id: string;
    category: string;
    daysFromToday: number;
    title: Translation;
    lead: Translation;
    body: { ru: string[]; en: string[] };
    relatedEventId: string | null;
  }>;
  locations: PrototypeLocation[];
};

const prisma = new PrismaClient();
const blocksWithRoomFloors = ['D', 'E', 'F', 'G', 'H'];

function dateFromToday(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function eventStart(days: number, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = dateFromToday(days);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

async function main(): Promise<void> {
  const dataPath = join(__dirname, 'prototype-data.json');
  const data = JSON.parse(await readFile(dataPath, 'utf8')) as PrototypeData;
  const floorPlans = blocksWithRoomFloors.flatMap((block) =>
    [1, 2, 3].map((floor) => ({
      id: `${block}-${floor}`,
      block,
      floor,
      imagePath: 'legacy-prototype/assets/map.webp',
      mapWidth: 1382,
      mapHeight: 2576,
    })),
  );
  const locations = data.locations.map((location) => ({
    id: location.id,
    kind: location.kind,
    category: location.cat,
    name: { ru: location.ru, en: location.en } as Prisma.InputJsonValue,
    keywords: location.kw ?? '',
    x: location.x,
    y: location.y,
    block: location.block,
    floor: location.floor ?? null,
    row: location.row ?? null,
    floorPlanId:
      location.floor === undefined
        ? null
        : `${location.block}-${location.floor}`,
  }));
  const events = data.events.map((event) => ({
    id: event.id,
    category: event.category,
    clubId: event.clubId,
    startsAt: eventStart(event.daysFromToday, event.time),
    title: event.title as Prisma.InputJsonValue,
    description: event.description as Prisma.InputJsonValue,
    price: event.price,
    capacity: event.capacity,
    soldCount: event.soldCount,
    locationId: event.locationId,
    locationDescription: event.locationDescription as
      | Prisma.InputJsonValue
      | undefined,
  }));
  const news = data.news.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title as Prisma.InputJsonValue,
    lead: item.lead as Prisma.InputJsonValue,
    body: item.body as Prisma.InputJsonValue,
    publishedAt: dateFromToday(item.daysFromToday),
    relatedEventId: item.relatedEventId,
  }));

  await prisma.$transaction(async (tx) => {
    for (const club of data.clubs) {
      await tx.club.upsert({
        where: { id: club.id },
        update: { name: club.name as Prisma.InputJsonValue },
        create: {
          id: club.id,
          name: club.name as Prisma.InputJsonValue,
        },
      });
    }
    for (const floorPlan of floorPlans) {
      await tx.floorPlan.upsert({
        where: { id: floorPlan.id },
        update: floorPlan,
        create: floorPlan,
      });
    }
    for (const location of locations) {
      await tx.location.upsert({
        where: { id: location.id },
        update: location,
        create: location,
      });
    }
    for (const event of events) {
      await tx.event.upsert({
        where: { id: event.id },
        update: event,
        create: event,
      });
    }
    for (const item of news) {
      await tx.news.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  });

  console.log(
    `Seeded ${data.clubs.length} clubs, ${events.length} events, ${news.length} news, ${locations.length} locations, and ${floorPlans.length} floor plans.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
