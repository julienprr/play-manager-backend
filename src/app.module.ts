import { Module } from '@nestjs/common';
import { SpotifyAuthModule } from './spotify-auth/spotify-auth.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SpotifyAuthModule,
    PlaylistsModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
