import { Controller, Get, Headers, Inject, Res } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @ApiHeader({
    name: 'If-None-Match',
    required: false,
    description: 'ETag from an earlier response.',
  })
  @ApiOkResponse({ description: 'Campus locations with an ETag response header.' })
  @ApiResponse({ status: 304, description: 'The cached locations are still current.' })
  async list(
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() response: Response,
  ) {
    const locations = await this.prisma.location.findMany({
      orderBy: [{ block: 'asc' }, { floor: 'asc' }, { y: 'asc' }, { x: 'asc' }],
    });
    const body = JSON.stringify(locations);
    const etag = `"${createHash('sha256').update(body).digest('base64url')}"`;
    response.setHeader('ETag', etag);

    if (ifNoneMatch === etag) return response.status(304).send();
    return response.status(200).json(locations);
  }
}
