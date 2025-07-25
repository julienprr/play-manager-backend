import { ConsoleLogger, ConsoleLoggerOptions, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JsonLoggerService } from './logger/logger.service';

async function bootstrap() {
  const port = parseInt(process.env.PORT ?? '8000', 10);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  const host = '0.0.0.0';

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger('App', {
      colors: true,
      json: false,
    } as ConsoleLoggerOptions),
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
    origin: process.env.FRONTEND_URL?.split(','),
    credentials: true,
  });

  const logger = new JsonLoggerService();
  app.useLogger(logger);

  await app.listen(port, host);
  Logger.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
