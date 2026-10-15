import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventPaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002';
}

function withRemainingSeats<T extends { capacity: number; soldCount: number }>(
  event: T,
) {
  return {
    ...event,
    remainingSeats: event.capacity - event.soldCount,
  };
}

@Injectable()
export class EventsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(userId: string, eventId: string) {
    return this.createRegistration(userId, eventId, false);
  }

  async simulatePayment(userId: string, eventId: string) {
    return this.createRegistration(userId, eventId, true);
  }

  private async createRegistration(userId: string, eventId: string, paid: boolean) {
    try {
      const registration = await this.prisma.$transaction(async (transaction) => {
        const event = await transaction.event.findUnique({
          where: { id: eventId },
          select: { id: true, capacity: true, price: true },
        });
        if (!event) {
          throw new NotFoundException(`Event "${eventId}" was not found.`);
        }
        if (paid && event.price <= 0) {
          throw new BadRequestException('Free events do not require simulated payment.');
        }
        if (!paid && event.price !== 0) {
          throw new BadRequestException('Paid events require simulated payment.');
        }

        const seat = await transaction.event.updateMany({
          where: { id: eventId, soldCount: { lt: event.capacity } },
          data: { soldCount: { increment: 1 } },
        });
        if (seat.count === 0) {
          throw new ConflictException('This event has no remaining places.');
        }

        return transaction.eventRegistration.create({
          data: {
            userId,
            eventId,
            paymentStatus: paid
              ? EventPaymentStatus.SIMULATED_PAID
              : EventPaymentStatus.NOT_REQUIRED,
          },
          include: {
            event: {
              include: { club: true, location: true },
            },
          },
        });
      });
      return {
        ...registration,
        event: withRemainingSeats(registration.event),
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('You are already registered for this event.');
      }
      throw error;
    }
  }

  async listForUser(userId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: { club: true, location: true },
        },
      },
    });
    return registrations.map((registration) => ({
      ...registration,
      event: withRemainingSeats(registration.event),
    }));
  }

  async listAttendees(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException(`Event "${eventId}" was not found.`);
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } },
      select: { id: true },
    });
    if (!registration) {
      throw new ForbiddenException('Register for this event to view its attendees.');
    }

    const attendees = await this.prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      select: {
        user: { select: { displayName: true } },
      },
    });
    return attendees.map(({ user }) => user.displayName);
  }
}
