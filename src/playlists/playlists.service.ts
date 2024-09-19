import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';
import { SpotifyAuthService } from 'src/spotify-auth/spotify-auth.service';
import { TopItemOptionsDto, TypeOption } from './dto/top-item-options.dto';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  async getUserPlaylists({ userId }: { userId: string }) {
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
        params: { limit: 10 },
      });

      const playlists = response.data.items.map((item) => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.images[0]?.url || '',
          public: item.public,
        };
      });

      return { playlists };
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async getOneUserPlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Fetching single user playlist from Spotify');

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

      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
      });

      const playlist = response.data;

      console.log(playlist.tracks.total);

      return { playlist };
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async getUserTopItems({ userId, type, options }: { userId: string; type: string; options: TopItemOptionsDto }) {
    this.logger.log(`Fetching user top ${type} from Spotify`);

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

      const params: { time_range?: string; limit?: number; offset?: number } = {};
      if (options.time_range) params.time_range = options.time_range;
      if (options.limit) params.limit = options.limit;
      if (options.offset) params.offset = options.offset;

      const response = await axios.get(`https://api.spotify.com/v1/me/top/${type}`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: params,
      });

      let topItems = [];
      if (type == TypeOption.ARTISTS) {
        topItems = response.data.items.map((item) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            imageUrl: item.images[0]?.url || '',
          };
        });
      }

      if (type == TypeOption.TRACKS) {
        topItems = response.data.items.map((item) => {
          return {
            id: item.id,
            name: item.name,
            artistName: item.artists[0].name,
            albumName: item.album.name,
            isExplicit: item.explicit,
            imageUrl: item.album.images[0]?.url || '',
          };
        });
      }

      return { topItems };
    } catch (error) {
      this.logger.error('Failed to fetch top items', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }
}
