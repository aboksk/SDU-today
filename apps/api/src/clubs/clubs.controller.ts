import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ClubsService } from './clubs.service';

@ApiTags('clubs')
@ApiCookieAuth('sdu_session')
@Controller('clubs')
export class ClubsController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(ClubsService) private readonly clubsService: ClubsService,
  ) {}

  @Get('mine')
  @ApiOkResponse({ description: 'Clubs where the current user is a member.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async mine(@Req() request: Request) {
    const user = await this.currentUser(request);
    return this.clubsService.listForUser(user.id);
  }

  @Post(':clubId/events')
  @ApiCreatedResponse({ description: 'Event created by a club administrator.' })
  @ApiForbiddenResponse({ description: 'The current user is not an administrator of this club.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  async createEvent(
    @Param('clubId') clubId: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    const user = await this.currentUser(request);
    return this.clubsService.createEvent(user.id, clubId, body);
  }

  private currentUser(request: Request) {
    const token = request.cookies?.sdu_session;
    if (typeof token !== 'string') {
      throw new UnauthorizedException('Authentication required.');
    }
    return this.authService.getCurrentUser(token);
  }
}
