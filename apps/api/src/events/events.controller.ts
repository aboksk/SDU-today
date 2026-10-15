import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(EventsService) private readonly eventsService: EventsService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Events with their remaining seat counts.' })
  async list() {
    const events = await this.prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
      include: { club: true, location: true },
    });
    return events.map((event) => ({
      ...event,
      remainingSeats: event.capacity - event.soldCount,
    }));
  }

  @Get(':id/attendees')
  @ApiCookieAuth('sdu_session')
  @ApiOkResponse({ description: 'Names of attendees, visible only to registered users.' })
  @ApiForbiddenResponse({ description: 'Register for the event to see its attendees.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async attendees(@Param('id') id: string, @Req() request: Request) {
    const user = await this.currentUser(request);
    return this.eventsService.listAttendees(user.id, id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'One event and its capacity information.' })
  @ApiNotFoundResponse({ description: 'Event not found.' })
  async get(@Param('id') id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { club: true, location: true },
    });
    if (!event) throw new NotFoundException(`Event "${id}" was not found.`);
    return {
      ...event,
      remainingSeats: event.capacity - event.soldCount,
    };
  }

  @Get('registrations/me')
  @ApiCookieAuth('sdu_session')
  @ApiOkResponse({ description: 'Events registered by the current user.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async myRegistrations(@Req() request: Request) {
    const user = await this.currentUser(request);
    return this.eventsService.listForUser(user.id);
  }

  @Post(':id/register')
  @ApiCookieAuth('sdu_session')
  @ApiCreatedResponse({ description: 'The current user is registered for this event.' })
  @ApiNotFoundResponse({ description: 'Event not found.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async register(@Param('id') id: string, @Req() request: Request) {
    const user = await this.currentUser(request);
    return this.eventsService.register(user.id, id);
  }

  @Post(':id/pay')
  @ApiCookieAuth('sdu_session')
  @ApiCreatedResponse({
    description: 'Records a simulated payment and registers the current user. No real charge is made.',
  })
  @ApiNotFoundResponse({ description: 'Event not found.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async simulatePayment(@Param('id') id: string, @Req() request: Request) {
    const user = await this.currentUser(request);
    return this.eventsService.simulatePayment(user.id, id);
  }

  private currentUser(request: Request) {
    const token = request.cookies?.sdu_session;
    if (typeof token !== 'string') {
      throw new UnauthorizedException('Authentication required.');
    }
    return this.authService.getCurrentUser(token);
  }
}
