import { Module } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { SpotifyAuthModule } from 'src/spotify-auth/spotify-auth.module';

@Module({
  imports: [SpotifyAuthModule],
  providers: [PlaylistsService],
  controllers: [PlaylistsController],
})
export class PlaylistsModule {}
