import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpotifyAuthModule } from './spotify-auth/spotify-auth.module';
import { SpotifyAuthService } from './spotify-auth/spotify-auth.service';
import { PlaylistsModule } from './playlists/playlists.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SpotifyAuthModule,
    PlaylistsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SpotifyAuthService],
})
export class AppModule {}
