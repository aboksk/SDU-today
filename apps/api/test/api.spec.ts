import { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { compare, hash } from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('SDU Today API', () => {
  let app: INestApplication;
  const article = {
    id: 'new-app',
    category: 'announce',
    title: { ru: 'Новости', en: 'News' },
    lead: { ru: 'Кратко', en: 'Brief' },
    body: { ru: ['Текст'], en: ['Text'] },
    publishedAt: new Date('2026-10-12T00:00:00.000Z'),
  };
  const event = {
    id: 'open-mic',
    capacity: 80,
    soldCount: 41,
    startsAt: new Date('2026-10-12T17:00:00.000Z'),
    club: { id: 'music' },
    location: { id: 'seating' },
  };
  const locations = [
    {
      id: 'D-204',
      kind: 'room',
      category: 'room',
      name: { ru: 'Аудитория D-204', en: 'Room D-204' },
      x: 488,
      y: 1688,
      block: 'D',
      floor: 2,
    },
  ];
  const authUser = {
    id: 'student-1',
    email: 'student@sdu.edu.kz',
    displayName: 'SDU Student',
    passwordHash: '',
  };
  const transactionMock = {
    event: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    eventRegistration: {
      create: vi.fn(),
    },
  };
  const createdEvent = {
    id: 'created-event',
    category: 'social',
    clubId: 'music',
    startsAt: new Date(Date.now() + 86_400_000),
    title: { ru: 'Встреча клуба', en: 'Club meetup' },
    description: { ru: 'Описание', en: 'Description' },
    price: 0,
    capacity: 40,
    soldCount: 0,
    locationId: 'D-105',
    club: { id: 'music', name: { ru: 'Музыкальный клуб', en: 'Music Club' } },
    location: { id: 'D-105', name: { ru: 'Аудитория D-105', en: 'Room D-105' } },
  };
  const prismaMock = {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    news: {
      findMany: vi.fn().mockResolvedValue([article]),
      findUnique: vi.fn().mockResolvedValue(article),
    },
    event: {
      findMany: vi.fn().mockResolvedValue([event]),
      findUnique: vi.fn().mockResolvedValue(event),
      create: vi.fn().mockResolvedValue(createdEvent),
    },
    $transaction: vi.fn(
      (callback: (transaction: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    ),
    location: {
      findMany: vi.fn().mockResolvedValue(locations),
      findUnique: vi.fn().mockResolvedValue({ id: 'D-105' }),
    },
    clubMembership: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    eventRegistration: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.authSession.create.mockResolvedValue({});
    prismaMock.authSession.findUnique.mockReset().mockResolvedValue(null);
    prismaMock.authSession.delete.mockResolvedValue({});
    prismaMock.authSession.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.eventRegistration.findMany.mockResolvedValue([]);
    prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
    prismaMock.clubMembership.findMany.mockResolvedValue([]);
    prismaMock.clubMembership.findUnique.mockResolvedValue(null);
    prismaMock.event.create.mockResolvedValue(createdEvent);
    prismaMock.location.findUnique.mockResolvedValue({ id: 'D-105' });
    transactionMock.event.findUnique.mockResolvedValue({
      id: 'open-mic',
      capacity: 80,
      price: 0,
    });
    transactionMock.event.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      userId: authUser.id,
      eventId: 'open-mic',
      event,
    });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('checks the database in the health endpoint', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
  });

  it('reports database failures from the health endpoint', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('Connection refused.'));
    await request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect({ statusCode: 503, message: 'Database is not available.' });
  });

  it('returns the news list and one article', async () => {
    const listResponse = await request(app.getHttpServer()).get('/news').expect(200);
    expect(listResponse.body).toEqual([expect.objectContaining({ id: 'new-app' })]);
    await request(app.getHttpServer())
      .get('/news/new-app')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(expect.objectContaining({ id: 'new-app' }));
      });
  });

  it('loads events from the API response', async () => {
    const response = await request(app.getHttpServer()).get('/events').expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ id: 'open-mic', remainingSeats: 39 }),
    ]);
    expect(prismaMock.event.findMany).toHaveBeenCalledOnce();
  });

  it('returns event capacity and remaining seats', async () => {
    await request(app.getHttpServer())
      .get('/events/open-mic')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(expect.objectContaining({
          id: 'open-mic',
          capacity: 80,
          soldCount: 41,
          remainingSeats: 39,
        }));
      });
  });

  it('returns locations with an ETag and supports conditional requests', async () => {
    const firstResponse = await request(app.getHttpServer())
      .get('/locations')
      .expect(200);
    const etag = firstResponse.headers.etag as string;
    expect(firstResponse.body).toEqual(locations);
    expect(etag).toMatch(/^".+"$/);

    await request(app.getHttpServer())
      .get('/locations')
      .set('If-None-Match', etag)
      .expect(304);
  });

  it('registers a university account with a password hash and normalized email', async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 'student-1',
      email: 'student@sdu.edu.kz',
      displayName: 'SDU Student',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: ' SDU Student ',
        email: ' Student@SDU.EDU.KZ ',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      })
      .expect(201);

    expect(response.body).toEqual({
      id: 'student-1',
      email: 'student@sdu.edu.kz',
      displayName: 'SDU Student',
    });
    const saved = prismaMock.user.create.mock.calls[0][0].data;
    expect(saved.email).toBe('student@sdu.edu.kz');
    expect(saved.passwordHash).not.toBe('StrongPass123!');
    await expect(compare('StrongPass123!', saved.passwordHash)).resolves.toBe(true);
  });

  it('rejects registration outside the university email domain', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Student',
        email: 'student@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      })
      .expect(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate registration', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'existing-user' });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Student',
        email: 'student@sdu.edu.kz',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      })
      .expect(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects mismatched registration passwords', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Student',
        email: 'student@sdu.edu.kz',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
      })
      .expect(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('logs in and sets an HTTP-only session cookie without returning secrets', async () => {
    const passwordHash = await hash('StrongPass123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...authUser, passwordHash });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ' Student@SDU.EDU.KZ ', password: 'StrongPass123!' })
      .expect(200);

    expect(response.body).toEqual({
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
    expect(JSON.stringify(response.body)).not.toContain(passwordHash);
    expect(prismaMock.authSession.create).toHaveBeenCalledOnce();
  });

  it('returns a generic error for invalid login credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...authUser,
      passwordHash: await hash('StrongPass123!', 4),
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: authUser.email, password: 'IncorrectPass123!' })
      .expect(401)
      .expect((response) => {
        expect(response.body.message).toBe('Invalid email or password.');
      });
  });

  it('rejects access to the current-user endpoint without a session', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('invalidates the login session on logout', async () => {
    const agent = request.agent(app.getHttpServer());
    const passwordHash = await hash('StrongPass123!', 4);
    const session = {
      id: 'session-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    };
    prismaMock.user.findUnique.mockResolvedValue({ ...authUser, passwordHash });
    prismaMock.authSession.findUnique
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(null);

    await agent
      .post('/auth/login')
      .send({ email: authUser.email, password: 'StrongPass123!' })
      .expect(200);
    await agent.get('/auth/me').expect(200);
    await agent
      .post('/auth/logout')
      .expect(204)
      .expect('set-cookie', /Expires=Thu, 01 Jan 1970/i);
    expect(prismaMock.authSession.deleteMany).toHaveBeenCalledOnce();
    await agent.get('/auth/me').expect(401);
  });

  it('prevents event registration without an authenticated session', async () => {
    await request(app.getHttpServer())
      .post('/events/open-mic/register')
      .expect(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('prevents simulated payment without an authenticated session', async () => {
    await request(app.getHttpServer())
      .post('/events/open-mic/pay')
      .expect(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('requires simulated payment to register for a paid event', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    transactionMock.event.findUnique.mockResolvedValueOnce({
      id: 'open-mic',
      capacity: 80,
      price: 2500,
    });

    await request(app.getHttpServer())
      .post('/events/open-mic/register')
      .set('Cookie', 'sdu_session=session-token')
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toBe('Paid events require simulated payment.');
      });
    expect(transactionMock.event.updateMany).not.toHaveBeenCalled();
    expect(transactionMock.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('simulates payment for a paid event and stores its payment status', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    transactionMock.event.findUnique.mockResolvedValueOnce({
      id: 'open-mic',
      capacity: 80,
      price: 2500,
    });

    await request(app.getHttpServer())
      .post('/events/open-mic/pay')
      .set('Cookie', 'sdu_session=session-token')
      .expect(201);

    expect(transactionMock.eventRegistration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: authUser.id,
          eventId: 'open-mic',
          paymentStatus: 'SIMULATED_PAID',
        },
      }),
    );
  });

  it('does not simulate a payment for a free event', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });

    await request(app.getHttpServer())
      .post('/events/open-mic/pay')
      .set('Cookie', 'sdu_session=session-token')
      .expect(400);
    expect(transactionMock.event.updateMany).not.toHaveBeenCalled();
    expect(transactionMock.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('registers an authenticated user for an event and lists their registrations', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    prismaMock.eventRegistration.findMany.mockResolvedValue([
      { id: 'registration-1', eventId: 'open-mic', event },
    ]);
    const registrationResponse = await request(app.getHttpServer())
      .post('/events/open-mic/register')
      .set('Cookie', 'sdu_session=session-token');
    expect(
      registrationResponse.status,
      JSON.stringify({
        body: registrationResponse.body,
        sessionLookups: prismaMock.authSession.findUnique.mock.calls,
      }),
    ).toBe(201);
    expect(registrationResponse.body).toEqual(expect.objectContaining({
      id: 'registration-1',
      userId: authUser.id,
      eventId: 'open-mic',
    }));
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(transactionMock.event.updateMany).toHaveBeenCalledWith({
      where: { id: 'open-mic', soldCount: { lt: 80 } },
      data: { soldCount: { increment: 1 } },
    });

    await request(app.getHttpServer())
      .get('/events/registrations/me')
      .set('Cookie', 'sdu_session=session-token')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([expect.objectContaining({
          id: 'registration-1',
          eventId: 'open-mic',
          event: expect.objectContaining({
            id: 'open-mic',
            remainingSeats: 39,
          }),
        })]);
      });
    expect(prismaMock.eventRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: authUser.id } }),
    );
  });

  it('prevents duplicate event registrations', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    transactionMock.eventRegistration.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Duplicate registration.', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await request(app.getHttpServer())
      .post('/events/open-mic/register')
      .set('Cookie', 'sdu_session=session-token')
      .expect(409)
      .expect((response) => {
        expect(response.body.message).toBe('You are already registered for this event.');
      });
  });

  it('prevents registration for an event that does not exist', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    transactionMock.event.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .post('/events/missing/register')
      .set('Cookie', 'sdu_session=session-token')
      .expect(404);
    expect(transactionMock.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('prevents registration when the event is full', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    transactionMock.event.updateMany.mockResolvedValueOnce({ count: 0 });
    await request(app.getHttpServer())
      .post('/events/open-mic/register')
      .set('Cookie', 'sdu_session=session-token')
      .expect(409)
      .expect((response) => {
        expect(response.body.message).toBe('This event has no remaining places.');
      });
    expect(transactionMock.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('requires authentication to view personal event registrations', async () => {
    await request(app.getHttpServer())
      .get('/events/registrations/me')
      .expect(401);
  });

  it('shows attendee names only to a user registered for the event', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    prismaMock.eventRegistration.findUnique.mockResolvedValue({ id: 'registration-1' });
    prismaMock.eventRegistration.findMany.mockResolvedValue([
      { user: { displayName: authUser.displayName } },
      { user: { displayName: 'Another Student' } },
    ]);

    await request(app.getHttpServer())
      .get('/events/open-mic/attendees')
      .set('Cookie', 'sdu_session=session-token')
      .expect(200)
      .expect([authUser.displayName, 'Another Student']);
    expect(prismaMock.eventRegistration.findMany).toHaveBeenCalledWith({
      where: { eventId: 'open-mic' },
      orderBy: { createdAt: 'asc' },
      select: { user: { select: { displayName: true } } },
    });
  });

  it('does not reveal attendees to users who are not registered', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });

    await request(app.getHttpServer())
      .get('/events/open-mic/attendees')
      .set('Cookie', 'sdu_session=session-token')
      .expect(403);
    expect(prismaMock.eventRegistration.findMany).not.toHaveBeenCalled();
  });

  it('requires authentication to view event attendees', async () => {
    await request(app.getHttpServer())
      .get('/events/open-mic/attendees')
      .expect(401);
  });

  it('creates an event for a club administrator', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    prismaMock.clubMembership.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const payload = {
      category: 'social',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      titleRu: 'Встреча клуба',
      titleEn: 'Club meetup',
      descriptionRu: 'Описание',
      descriptionEn: 'Description',
      price: 0,
      capacity: 40,
      locationId: 'D-105',
    };

    await request(app.getHttpServer())
      .post('/clubs/music/events')
      .set('Cookie', 'sdu_session=session-token')
      .send(payload)
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual(expect.objectContaining({
          id: expect.any(String),
          clubId: 'music',
          title: { ru: payload.titleRu, en: payload.titleEn },
          remainingSeats: 40,
        }));
      });
    expect(prismaMock.clubMembership.findUnique).toHaveBeenCalledWith({
      where: { userId_clubId: { userId: authUser.id, clubId: 'music' } },
      select: { role: true },
    });
    expect(prismaMock.event.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        clubId: 'music',
        category: 'social',
        capacity: 40,
        locationId: 'D-105',
      }),
      include: { club: true, location: true },
    }));
  });

  it('does not allow a regular club member to create events', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    prismaMock.clubMembership.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await request(app.getHttpServer())
      .post('/clubs/music/events')
      .set('Cookie', 'sdu_session=session-token')
      .send({})
      .expect(403);
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it('validates the event form on the server', async () => {
    prismaMock.authSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
    prismaMock.clubMembership.findUnique.mockResolvedValue({ role: 'ADMIN' });

    await request(app.getHttpServer())
      .post('/clubs/music/events')
      .set('Cookie', 'sdu_session=session-token')
      .send({ category: 'invalid' })
      .expect(400);
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });
});
