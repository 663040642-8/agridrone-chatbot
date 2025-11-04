import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp: express.Application = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1); 

  const allowedOrigin = process.env.CORS_ORIGIN || 'https://agridrone-chatbot.vercel.app';
  
  app.enableCors({
    origin: allowedOrigin, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    allowedHeaders: 'Content-Type, Accept, Authorization', 
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();