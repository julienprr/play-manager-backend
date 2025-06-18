import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, LogLevel } from '@nestjs/common';

async function bootstrap() {
  const port = parseInt(process.env.PORT ?? '8000', 10);
  const host = '0.0.0.0';
  const levels = (process.env.LOG_LEVEL?.split(',') as LogLevel[]) || ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: levels,
  });

  const config = new DocumentBuilder()
    .setTitle('Play Manager API')
    .setDescription('API pour gérer les playlists Spotify')
    .setVersion('1.0')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://accounts.spotify.com/authorize',
          tokenUrl: 'https://accounts.spotify.com/api/token',
          scopes: {
            'playlist-read-private': 'Read private playlists',
          },
        },
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  });

  await app.listen(port, host);
  Logger.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
