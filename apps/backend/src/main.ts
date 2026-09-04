import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 5000;
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.WEB_URL ||
    'https://ecommerce-banglashop.netlify.app';

  // Security & Middleware
  const cookieMiddleware = typeof cookieParser === 'function' ? cookieParser : (cookieParser as { default: typeof cookieParser }).default;
  app.use(cookieMiddleware());

  const allowedOrigins = Array.from(
    new Set(
      [
        'https://ecommerce-banglashop.netlify.app',
        frontendUrl,
        'http://localhost:3000',
        ...(process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
          : []),
      ].filter(Boolean)
    )
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Prefix & Filters
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}/api/v1`);
}

bootstrap();
