import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ClubsController } from './clubs/clubs.controller';
import { ClubsService } from './clubs/clubs.service';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { HealthController } from './health/health.controller';
import { LocationsController } from './locations/locations.controller';
import { NewsController } from './news/news.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AuthController,
    ClubsController,
    HealthController,
    NewsController,
    EventsController,
    LocationsController,
  ],
  providers: [AuthService, ClubsService, EventsService],
})
export class AppModule {}
