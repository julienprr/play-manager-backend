import { Module } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { SpotifyAuthModule } from 'src/spotify-auth/spotify-auth.module';
import { PrismaService } from 'src/prisma.service';
import { SpotifyAuthService } from 'src/spotify-auth/spotify-auth.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [SpotifyAuthModule],
  providers: [PlaylistsService, PrismaService, SpotifyAuthService, AuthService],
  controllers: [PlaylistsController],
})
export class PlaylistsModule {}
