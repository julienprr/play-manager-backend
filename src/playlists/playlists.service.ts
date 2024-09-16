import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';
import { SpotifyAuthService } from 'src/spotify-auth/spotify-auth.service';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  async getUserPlaylists({ userId }: { userId: string }): Promise<any> {
    this.logger.log('Fetching user playlists from Spotify');

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error("L'utilisateur n'existe pas");
      }

      const { spotify_access_token } = await this.spotifyAuthService.getSpotifyAccessToken({ userId: userId });

      if (!spotify_access_token) {
        throw new Error("Aucun token d'accès Spotify n'a été trouvé");
      }

      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }
}
