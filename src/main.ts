import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const port = process.env.PORT;

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
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

  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
