import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JsonLoggerService } from './logger/logger.service';

async function bootstrap() {
  const port = parseInt(process.env.PORT ?? '8000', 10);
  const host = '0.0.0.0';
  const isLocal = process.env.NODE_ENV === 'local';

  const app = await NestFactory.create(AppModule, {
    logger: isLocal ? ['log', 'error', 'warn', 'debug', 'verbose'] : new JsonLoggerService(),
  });

  const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
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
            'playlist-modify-public': 'playlist-modify-public',
            'playlist-modify-private': 'playlist-modify-private',
            'user-read-private': 'user-read-private',
            'user-read-email': 'user-read-email',
            'user-top-read': 'user-top-read',
            'user-library-read': 'user-library-read',
            'user-follow-read': 'user-follow-read',
            'user-library-modify': 'user-library-modify',
          },
        },
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  await app.listen(port, host);
  Logger.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
