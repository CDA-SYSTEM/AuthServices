import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription(
      'Servicio de autenticacion y administracion de usuarios para la plataforma CDA System. Incluye JWT, refresh tokens, roles, y cache generico sobre Redis para compartir listas entre microservicios.',
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Flujos de autenticacion, renovacion de tokens, usuarios y control de acceso.')
    .addTag('Cache', 'Cache Redis compartido para listas y objetos reutilizables entre servicios.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
