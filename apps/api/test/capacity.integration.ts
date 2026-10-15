import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();
const clubId = 'capacity-check-test';
const eventId = `capacity-check-${process.pid}`;
const userId = `capacity-user-${process.pid}`;
const userEmail = `capacity-${process.pid}@sdu.edu.kz`;

describe('database event capacity constraint', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.club.upsert({
      where: { id: clubId },
      update: {},
      create: { id: clubId, name: { ru: 'Тест', en: 'Test' } },
    });
    await prisma.user.create({
      data: {
        id: userId,
        email: userEmail,
        displayName: 'Capacity Test User',
      },
    });
    await prisma.event.create({
      data: {
        id: eventId,
        category: 'test',
        clubId,
        startsAt: new Date(),
        title: { ru: 'Тест', en: 'Test' },
        description: { ru: 'Тест', en: 'Test' },
        capacity: 2,
        soldCount: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.club.deleteMany({ where: { id: clubId } });
    await prisma.$disconnect();
  });

  it('rejects soldCount greater than capacity in PostgreSQL itself', async () => {
    await expect(
      prisma.$executeRaw(
        Prisma.sql`UPDATE "Event" SET "soldCount" = 3 WHERE "id" = ${eventId}`,
      ),
    ).rejects.toThrow();
    const unchanged = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(unchanged.soldCount).toBe(0);
  });

  it('enforces one registration per user and event in PostgreSQL', async () => {
    await prisma.eventRegistration.create({
      data: { userId, eventId },
    });
    await expect(
      prisma.eventRegistration.create({
        data: { userId, eventId },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.eventRegistration.count({ where: { userId, eventId } }),
    ).resolves.toBe(1);
  });
});
