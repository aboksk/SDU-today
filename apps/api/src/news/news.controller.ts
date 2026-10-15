import { Controller, Get, Inject, NotFoundException, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'News ordered from newest to oldest.' })
  list() {
    return this.prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
  }

  @Get(':id')
  @ApiOkResponse({ description: 'One news article.' })
  @ApiNotFoundResponse({ description: 'News article not found.' })
  async get(@Param('id') id: string) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) throw new NotFoundException(`News "${id}" was not found.`);
    return news;
  }
}
