import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, PublicUser } from './auth.service';

const SESSION_COOKIE = 'sdu_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS,
  };
}

function sessionToken(request: Request): string | undefined {
  const value = request.cookies?.[SESSION_COOKIE];
  return typeof value === 'string' ? value : undefined;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({
    schema: {
      example: {
        displayName: 'Aruzhan Student',
        email: 'aruzhan@sdu.edu.kz',
        password: 'ExamplePass123',
        confirmPassword: 'ExamplePass123',
      },
    },
  })
  @ApiCreatedResponse({ description: 'Account created. Password hash is never returned.' })
  @ApiBadRequestResponse({ description: 'Invalid registration details.' })
  @ApiConflictResponse({ description: 'An account with this email already exists.' })
  register(@Body() body: unknown): Promise<PublicUser> {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    schema: {
      example: { email: 'aruzhan@sdu.edu.kz', password: 'ExamplePass123' },
    },
  })
  @ApiOkResponse({ description: 'Signed in. A session is set in an HTTP-only cookie.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: PublicUser }> {
    const result = await this.authService.login(body);
    response.cookie(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
    return { user: result.user };
  }

  @Get('me')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOkResponse({ description: 'Current authenticated user.' })
  @ApiUnauthorizedResponse({ description: 'No valid session.' })
  me(@Req() request: Request): Promise<PublicUser> {
    return this.authService.getCurrentUser(sessionToken(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiNoContentResponse({ description: 'Session invalidated and cookie cleared.' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(sessionToken(request));
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
