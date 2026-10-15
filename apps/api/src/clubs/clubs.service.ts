import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const EVENT_CATEGORIES = ['concert', 'sport', 'talk', 'tech', 'social'] as const;

interface CreateEventInput {
  category: typeof EVENT_CATEGORIES[number];
  startsAt: Date;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  price: number;
  capacity: number;
  locationId: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new BadRequestException(`"${key}" must be a string.`);
  }
  return value.trim();
}

function readNumber(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BadRequestException(`"${key}" must be a number.`);
  }
  return value;
}

function isEventCategory(value: string): value is typeof EVENT_CATEGORIES[number] {
  return EVENT_CATEGORIES.some((category) => category === value);
}

function parseCreateEvent(body: unknown): CreateEventInput {
  if (!isRecord(body)) {
    throw new BadRequestException('Event details are required.');
  }

  const category = readText(body, 'category');
  if (!isEventCategory(category)) {
    throw new BadRequestException('Choose a valid event category.');
  }

  const title = {
    ru: readText(body, 'titleRu'),
    en: readText(body, 'titleEn'),
  };
  const description = {
    ru: readText(body, 'descriptionRu'),
    en: readText(body, 'descriptionEn'),
  };
  if (!title.ru || !title.en || title.ru.length > 160 || title.en.length > 160) {
    throw new BadRequestException('Event titles must contain 1 to 160 characters in both languages.');
  }
  if (!description.ru || !description.en ||
      description.ru.length > 3000 || description.en.length > 3000) {
    throw new BadRequestException('Event descriptions must contain 1 to 3000 characters in both languages.');
  }

  const startsAt = new Date(readText(body, 'startsAt'));
  if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    throw new BadRequestException('Event start time must be a valid future date.');
  }

  const price = readNumber(body, 'price');
  if (!Number.isInteger(price) || price < 0 || price > 100_000_000) {
    throw new BadRequestException('Price must be a whole number between 0 and 100000000.');
  }

  const capacity = readNumber(body, 'capacity');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 2000) {
    throw new BadRequestException('Capacity must be a whole number between 1 and 2000.');
  }

  const locationId = body.locationId === null || body.locationId === ''
    ? null
    : readText(body, 'locationId');
  if (locationId === '') {
    throw new BadRequestException('Choose a valid campus location.');
  }

  return {
    category,
    startsAt,
    title,
    description,
    price,
    capacity,
    locationId,
  };
}

@Injectable()
export class ClubsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.clubMembership.findMany({
      where: { userId },
      orderBy: { clubId: 'asc' },
      select: {
        clubId: true,
        role: true,
        club: { select: { id: true, name: true } },
      },
    });
    return memberships.map(({ clubId, role, club }) => ({ clubId, role, name: club.name }));
  }

  async createEvent(userId: string, clubId: string, body: unknown) {
    const membership = await this.prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { role: true },
    });
    if (membership?.role !== 'ADMIN') {
      throw new ForbiddenException('Only an administrator of this club can create events.');
    }

    const input = parseCreateEvent(body);
    if (input.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: input.locationId },
        select: { id: true },
      });
      if (!location) {
        throw new NotFoundException(`Location "${input.locationId}" was not found.`);
      }
    }

    const event = await this.prisma.event.create({
      data: {
        id: randomUUID(),
        category: input.category,
        clubId,
        startsAt: input.startsAt,
        title: input.title as Prisma.InputJsonValue,
        description: input.description as Prisma.InputJsonValue,
        price: input.price,
        capacity: input.capacity,
        locationId: input.locationId,
      },
      include: { club: true, location: true },
    });
    return { ...event, remainingSeats: event.capacity - event.soldCount };
  }
}
