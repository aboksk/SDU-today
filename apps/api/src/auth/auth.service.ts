import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isUniversityEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    value.endsWith('@sdu.edu.kz') &&
    value.length <= 254;
}

function passwordIsValid(value: string): boolean {
  return value.length >= 8 &&
    Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;
}

function sessionTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002';
}

function publicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(body: unknown): Promise<PublicUser> {
    const input = this.readRegistration(body);
    const email = normalizedEmail(input.email);
    const displayName = input.displayName.trim();

    if (!isUniversityEmail(email)) {
      throw new BadRequestException('Use a valid university email ending with @sdu.edu.kz.');
    }
    if (displayName.length === 0 || displayName.length > 100) {
      throw new BadRequestException('Full name must contain between 1 and 100 characters.');
    }
    if (!passwordIsValid(input.password)) {
      throw new BadRequestException('Password must be at least 8 characters and no more than 72 UTF-8 bytes.');
    }
    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match.');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: { email, displayName, passwordHash },
        select: { id: true, email: true, displayName: true },
      });
      return publicUser(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async login(body: unknown): Promise<{ user: PublicUser; sessionToken: string }> {
    const input = this.readLogin(body);
    const email = normalizedEmail(input.email);
    if (!isUniversityEmail(email) || !passwordIsValid(input.password)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user?.passwordHash || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const sessionToken = randomBytes(32).toString('base64url');
    await this.prisma.authSession.create({
      data: {
        tokenHash: sessionTokenHash(sessionToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    return {
      user: publicUser(user),
      sessionToken,
    };
  }

  async getCurrentUser(sessionToken: string | undefined): Promise<PublicUser> {
    if (!sessionToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: sessionTokenHash(sessionToken) },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });
    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Authentication required.');
    }

    return publicUser(session.user);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) {
      await this.prisma.authSession.deleteMany({
        where: { tokenHash: sessionTokenHash(sessionToken) },
      });
    }
  }

  private readRegistration(body: unknown): RegisterInput {
    if (!isRecord(body)) {
      throw new BadRequestException('Registration details are required.');
    }

    const displayName = readString(body.displayName);
    const email = readString(body.email);
    const password = readString(body.password);
    const confirmPassword = readString(body.confirmPassword);
    if (displayName === null || email === null || password === null || confirmPassword === null) {
      throw new BadRequestException('Full name, university email, password, and confirmation are required.');
    }

    return { displayName, email, password, confirmPassword };
  }

  private readLogin(body: unknown): LoginInput {
    if (!isRecord(body)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const email = readString(body.email);
    const password = readString(body.password);
    if (email === null || password === null) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { email, password };
  }
}
