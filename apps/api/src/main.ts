import 'dotenv/config';
import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (request.url === '/api') {
      request.url = '/';
    } else if (request.url.startsWith('/api/')) {
      request.url = request.url.slice('/api'.length);
    }
    next();
  });
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SDU Today API')
    .setDescription('SDU Today API for authentication, news, events, and campus locations.')
    .setVersion('1.0.0')
    .addCookieAuth('sdu_session', { type: 'apiKey', in: 'cookie' })
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
