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
      });

      const playlists = response.data.items.map((item) => {
        return {
          id: item.id,
          name: item.name,
          ownerName: item.owner.display_name,
          description: item.description,
          imageUrl: item.images ? item.images[0]?.url : '',
          public: item.public,
          tracksNumber: item.tracks.total || 0,
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
    console.log('userId: ', userId);

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

  private sortTracksByAlbumAndDate(tracks) {
    const albumsMap = new Map<string, { albumName: string; releaseDate: string; tracks: any[] }>();

    tracks.forEach((track) => {
      if (track.track.album?.id) {
        const albumId = track.track.album.id;
        if (!albumsMap.has(albumId)) {
          albumsMap.set(albumId, {
            albumName: track.track.album.name,
            releaseDate: track.track.album.release_date, // Format 'YYYY-MM-DD'
            tracks: [],
          });
        }

        albumsMap.get(albumId)!.tracks.push(track);
      }
    });

    // Convertir la map en tableau et trier
    const albumsArray = Array.from(albumsMap.values());

    albumsArray.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    albumsArray.forEach((album) => {
      album.tracks.sort((a, b) => a.track_number - b.track_number);
    });

    return albumsArray.flatMap((album) => album.tracks);
  }

  async reorganizePlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Reorganizing playlist', playlistId);

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

      // Fetch all tracks from the playlist, handling pagination if needed
      let allTracks: any[] = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });
        const playlistData = response.data;
        allTracks = allTracks.concat(playlistData.items);
        nextUrl = playlistData.next;
        console.log(`${allTracks.length} tracks retrieved`);
        console.log(allTracks[0]);
      }

      const validTracks = allTracks.filter(
        (item) => item.track && item.track.uri && item.track.id && item.track.album.id,
      );

      // console.log(validTracks[0]);

      console.log(`${validTracks.length} valid tracks to sort`);

      // Group and sort as needed, then update the playlist
      const sortedTracks = this.sortTracksByAlbumAndDate(validTracks);
      console.log('sortedTracks', sortedTracks.length);

      // Chunk the sorted tracks for deletion and re-adding in groups of 100
      const trackUrisToRemove = validTracks.map((item) => item.track.uri);
      const chunkSize = 100;

      for (let i = 0; i < trackUrisToRemove.length; i += chunkSize) {
        const chunk = trackUrisToRemove.slice(i, i + chunkSize);
        console.log(`deleting ${i} to ${i + chunkSize}`);

        await axios.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
          data: {
            tracks: chunk.map((uri) => ({ uri })),
          },
        });
      }
      console.log('All tracks have been deleted');

      // Re-add the tracks in sorted order
      const sortedTrackUris = sortedTracks.map((track) => track.track.uri);
      console.log('sortedTrackUris', sortedTrackUris.length);

      for (let i = 0; i < sortedTrackUris.length; i += chunkSize) {
        const chunk = sortedTrackUris.slice(i, i + chunkSize);
        console.log(`adding ${i} to ${i + chunkSize}`);
        console.log(chunk);

        await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
          data: {
            uris: chunk,
          },
        });
      }

      return { message: 'Playlist successfully reorganized.' };
    } catch (error) {
      this.logger.error('Failed to reorganize playlist', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async addFavoritePlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Adding favorite', playlistId);

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

      if (existingUser.favoritePlaylists.includes(playlistId)) {
        return {
          error: true,
          message: "La playlist fait déjà partie des favoris de l'utilisateur.",
        };
      } else {
        const updatedFavorite = existingUser.favoritePlaylists.concat(playlistId);
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            favoritePlaylists: updatedFavorite,
          },
        });

        return {
          error: false,
          message: "La playlist a bien été ajouté aux favoris de l'utilisateur.",
        };
      }
    } catch (error) {
      this.logger.error("L'ajout du favoris a échoué", error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async removeFavoritePlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Removing favorite', playlistId);

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

      if (!existingUser.favoritePlaylists.includes(playlistId)) {
        return {
          error: true,
          message: "La playlist ne fait pas partie des favoris de l'utilisateur.",
        };
      } else {
        const updatedPlaylists = existingUser.favoritePlaylists.filter((playlistId) => playlistId !== playlistId);
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            favoritePlaylists: updatedPlaylists,
          },
        });

        return {
          error: false,
          message: "La playlist a bien été retirée des favoris de l'utilisateur.",
        };
      }
    } catch (error) {
      this.logger.error('La supression du favoris a échouée', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }
}
