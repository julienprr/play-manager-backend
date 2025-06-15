import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';
import { SpotifyAuthService } from 'src/spotify-auth/spotify-auth.service';
import { plainToInstance } from 'class-transformer';
import { PlaylistItemDto } from './dto/playlist-item.dto';

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

      const playlistsData = response.data.items.map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          ownerName: item.owner.display_name,
          description: item.description,
          totalTracks: item.tracks.total || 0,
          imageUrl: item.images[0]?.url || '',
          public: item.public,
          isFavorite: existingUser.favoritePlaylists.includes(item.id),
          autoSort: existingUser.autoSortPlaylists.includes(item.id),
        };
      });

      const playlists = plainToInstance(PlaylistItemDto, playlistsData);

      return { playlists };
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async getUserPlaylistById({ userId, playlistId }: { userId: string; playlistId: string }) {
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

      if (playlistId === 'liked-tracks') {
        const response = await axios.get(`https://api.spotify.com/v1/me/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const likedTracksPlaylist = {
          id: 'liked-tracks',
          name: 'Titres Likés',
          description: 'Les titres que vous avez ajoutés à vos favoris sur Spotify.',
          tracks: response.data,
          // tracks: response.data.items.map((item) => ({
          //   id: item.track.id,
          //   name: item.track.name,
          //   artistName: item.track.artists[0]?.name || '',
          //   albumName: item.track.album?.name || '',
          //   isExplicit: item.track.explicit,
          //   imageUrl: item.track.album?.images[0]?.url || '',
          //   duration: item.track.duration_ms,
          // })),
          total: response.data.total,
          uri: 'spotify:user:liked-tracks',
        };

        return { playlist: likedTracksPlaylist };
      } else {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const playlist = {
          id: response.data.id,
          name: response.data.name,
          ownerName: response.data.owner.display_name,
          description: response.data.description,
          totalTracks: response.data.tracks.total || 0,
          imageUrl: response.data.images[0]?.url || '',
          public: response.data.public,
          isFavorite: existingUser.favoritePlaylists.includes(response.data.id),
          autoSort: existingUser.autoSortPlaylists.includes(response.data.id),
          tracks: response.data.tracks.items.map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artistName: item.track.artists[0]?.name || '',
            albumName: item.track.album?.name || '',
            isExplicit: item.track.explicit,
            imageUrl: item.track.album?.images[0]?.url || '',
            duration: item.track.duration_ms,
          })),
        };
        return { playlist };
      }
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async getUserTopTracks({ userId }: { userId: string }) {
    this.logger.log(`Fetching user top tracks from Spotify`);

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

      const shortTermRes = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'short_term', limit: 30 },
      });

      const mediumTermRes = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'medium_term', limit: 30 },
      });

      const longTermRes = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'long_term', limit: 30 },
      });

      const shortTermItems = shortTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        isExplicit: item.explicit,
        imageUrl: item.album.images[0]?.url || '',
        duration: item.duration_ms,
      }));

      const mediumTermItems = mediumTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        isExplicit: item.explicit,
        imageUrl: item.album.images[0]?.url || '',
        duration: item.duration_ms,
      }));

      const longTermItems = longTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        isExplicit: item.explicit,
        imageUrl: item.album.images[0]?.url || '',
        duration: item.duration_ms,
      }));

      return {
        short_term: shortTermItems,
        medium_term: mediumTermItems,
        long_term: longTermItems,
      };
    } catch (error) {
      this.logger.error('Failed to fetch top tracks', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async getUserTopArtists({ userId }: { userId: string }) {
    this.logger.log(`Fetching user top artists from Spotify`);

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

      const shortTermRes = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'short_term', limit: 30 },
      });

      const mediumTermRes = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'medium_term', limit: 30 },
      });

      const longTermRes = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
        params: { time_range: 'long_term', limit: 30 },
      });

      const shortTermItems = shortTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.images[0]?.url || '',
        spotifyUrl: item.external_urls.spotify,
        followers: item.followers.total,
      }));

      const mediumTermItems = mediumTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.images[0]?.url || '',
        spotifyUrl: item.external_urls.spotify,
        followers: item.followers.total,
      }));

      const longTermItems = longTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.images[0]?.url || '',
        spotifyUrl: item.external_urls.spotify,
        followers: item.followers.total,
      }));

      return {
        short_term: shortTermItems,
        medium_term: mediumTermItems,
        long_term: longTermItems,
      };
    } catch (error) {
      this.logger.error('Failed to fetch top artists', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  private sortTracksByAlbumAndDate(tracks: any[]) {
    const albumsMap = new Map<string, { albumName: string; releaseDate: string; tracks: any[] }>();

    tracks.forEach((track) => {
      if (track.track.album?.id) {
        const albumId = track.track.album.id;
        if (!albumsMap.has(albumId)) {
          albumsMap.set(albumId, {
            albumName: track.track.album.name,
            releaseDate: track.track.album.release_date,
            tracks: [],
          });
        }

        albumsMap.get(albumId)!.tracks.push(track);
      }
    });

    // Convertir la map en tableau et trier
    const albumsArray = Array.from(albumsMap.values());
    albumsArray.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    // Trier les pistes dans chaque album par `track_number`
    albumsArray.forEach((album) => {
      album.tracks.sort((a, b) => a.track.track_number - b.track.track_number);
    });

    return albumsArray.flatMap((album) => album.tracks);
  }

  private async retriveTracks({
    playlistId,
    spotify_access_token,
  }: {
    playlistId: string;
    spotify_access_token: string;
  }) {
    let retrievedTracks: any[] = [];

    if (playlistId == 'liked-tracks') {
      let nextUrl = `https://api.spotify.com/v1/me/tracks?limit=50`;

      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const playlistData = response.data;
        retrievedTracks = retrievedTracks.concat(playlistData.items);
        nextUrl = playlistData.next;
      }
    } else {
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const playlistData = response.data;
        retrievedTracks = retrievedTracks.concat(playlistData.items);
        nextUrl = playlistData.next;
      }
    }
    console.log(`${retrievedTracks.length} tracks retrieved`);

    return retrievedTracks;
  }

  private async deleteTracks({
    tracks,
    playlistId,
    spotify_access_token,
  }: {
    tracks: any[];
    playlistId: string;
    spotify_access_token: string;
  }) {
    let chunkSize: number;
    if (playlistId == 'liked-tracks') {
      chunkSize = 50;
      const trackUrisToRemove = tracks.map((item) => item.track.id);
      console.log(trackUrisToRemove);

      for (let i = 0; i < trackUrisToRemove.length; i += chunkSize) {
        const chunk = trackUrisToRemove.slice(i, i + chunkSize);
        console.log(`deleting tracks ${i} to ${i + chunkSize}`);

        await axios.delete(`https://api.spotify.com/v1/me/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
          data: {
            ids: chunk,
          },
        });
      }
    } else {
      chunkSize = 100;
      const trackUrisToRemove = tracks.map((item) => item.track.uri);

      console.log(trackUrisToRemove);

      for (let i = 0; i < trackUrisToRemove.length; i += chunkSize) {
        const chunk = trackUrisToRemove.slice(i, i + chunkSize);
        console.log(`deleting tracks ${i} to ${i + chunkSize}`);

        await axios.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
          data: {
            tracks: chunk.map((uri) => ({ uri })),
          },
        });
      }
    }
    console.log('All tracks have been deleted');
  }

  private async addTracks({
    tracks,
    playlistId,
    spotify_access_token,
  }: {
    tracks: any[];
    playlistId: string;
    spotify_access_token: string;
  }) {
    let chunkSize: number;
    if (playlistId == 'liked-tracks') {
      const tracksIds = tracks.map((track) => track.track.id);
      console.log('tracks: ', tracksIds.length);
      chunkSize = Math.min(50, tracksIds.length);

      for (let i = 0; i < tracksIds.length; i += chunkSize) {
        const chunk = tracksIds.slice(i, i + chunkSize);
        console.log(`adding tracks ${i} to ${i + chunkSize}`);

        await axios.put(
          `https://api.spotify.com/v1/me/tracks`,
          {
            ids: chunk,
          },
          { headers: { Authorization: `Bearer ${spotify_access_token}` } },
        );
      }
    } else {
      const tracksUris = tracks.map((track) => track.track.uri);
      console.log('tracks: ', tracksUris.length);
      chunkSize = Math.min(100, tracksUris.length);

      for (let i = 0; i < tracksUris.length; i += chunkSize) {
        const chunk = tracksUris.slice(i, i + chunkSize);
        console.log(`adding tracks ${i} to ${i + chunkSize}`);

        await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            uris: chunk,
          },
          { headers: { Authorization: `Bearer ${spotify_access_token}` } },
        );
      }
    }
    console.log('All tracks added successfuly');
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
      const allTracks = await this.retriveTracks({ playlistId, spotify_access_token });

      const validTracks = allTracks.filter(
        (item) => item.track && item.track.uri && item.track.id && item.track.album.id,
      );

      console.log(`${validTracks.length} valid tracks to sort`);
      // Group and sort as needed, then update the playlist
      const sortedTracks = this.sortTracksByAlbumAndDate(validTracks);
      console.log(`${sortedTracks.length} track sorted`);

      // delete all tracks
      await this.deleteTracks({ tracks: validTracks, playlistId, spotify_access_token });

      // Re-add the tracks in sorted order
      await this.addTracks({ tracks: sortedTracks, playlistId, spotify_access_token });

      return { error: false, message: 'Playlist successfully reorganized.' };
    } catch (error) {
      this.logger.error('Failed to reorganize playlist', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async copyPlaylistContent({
    userId,
    playlistSourceId,
    playlistDestinationId,
  }: {
    userId: string;
    playlistSourceId: string;
    playlistDestinationId: string;
  }) {
    this.logger.log(`Coping content from playlist ${playlistSourceId} to playlist ${playlistDestinationId}`);

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
      const sourceTracks = await this.retriveTracks({ playlistId: playlistSourceId, spotify_access_token });

      const validTracks = sourceTracks.filter(
        (item) => item.track && item.track.uri && item.track.id && item.track.album.id,
      );

      console.log(`${validTracks.length} tracks to copy`);

      if (playlistDestinationId === 'new-playlist') {
        const sourcePlaylistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistSourceId}`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const sourcePlaylist = sourcePlaylistResponse.data;
        console.log(sourcePlaylist.name, sourcePlaylist.id);
        console.log(existingUser.spotifyUserId);

        const newPlaylistResponse = await axios.post(
          `https://api.spotify.com/v1/users/${existingUser.spotifyUserId}/playlists`,
          {
            headers: { Authorization: `Bearer ${spotify_access_token}` },
            data: {
              name: `${sourcePlaylist.name} copy`,
              description: sourcePlaylist.description,
              public: sourcePlaylist.public,
            },
          },
        );

        const newPlaylist = newPlaylistResponse.data;

        this.logger.log(`The new playlist with id ${newPlaylist.id} has been created`);
        await this.cleanPlaylist({ userId, playlistId: newPlaylist.id });
      } else {
        // delete all tracks from the destination playlist
        await this.cleanPlaylist({ userId, playlistId: playlistDestinationId });
      }

      // Re-add the tracks in the destination playlist
      await this.addTracks({ tracks: validTracks, playlistId: playlistDestinationId, spotify_access_token });

      this.logger.log('The playlist has been copied succesfully');
      return { error: false, message: 'Playlist successfully copied.' };
    } catch (error) {
      this.logger.error('Failed to copie playlist', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async cleanPlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log(`Cleaning playlist with id ${playlistId}`);

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
      const tracks = await this.retriveTracks({ playlistId, spotify_access_token });

      if (tracks.length > 0) {
        await this.deleteTracks({ tracks, playlistId, spotify_access_token });
      }

      return { error: false, message: 'Playlist successfully cleaned.' };
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

  async addAutoSortPlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Adding auto sorted', playlistId);

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

      if (existingUser.autoSortPlaylists.includes(playlistId)) {
        return {
          error: true,
          message: 'La playlist est déjà en auto sorted.',
        };
      } else {
        const updatedAutoSort = existingUser.autoSortPlaylists.concat(playlistId);
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            autoSortPlaylists: updatedAutoSort,
          },
        });

        return {
          error: false,
          message: "La playlist a bien été ajouté aux playlists auto sorted de l'utilisateur.",
        };
      }
    } catch (error) {
      this.logger.error("L'ajout de la playlist auto sorted a échoué", error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async removeAutoSortPlaylist({ userId, playlistId }: { userId: string; playlistId: string }) {
    this.logger.log('Removing auto sorted playlist', playlistId);

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

      if (!existingUser.autoSortPlaylists.includes(playlistId)) {
        return {
          error: true,
          message: "La playlist ne fait pas partie des playlists auto sorted de l'utilisateur.",
        };
      } else {
        const updatedPlaylists = existingUser.autoSortPlaylists.filter((playlistId) => playlistId !== playlistId);
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            autoSortPlaylists: updatedPlaylists,
          },
        });

        return {
          error: false,
          message: "La playlist a bien été retirée des playlists auto sorted de l'utilisateur.",
        };
      }
    } catch (error) {
      this.logger.error('La supression de la playlist auto sorted a échouée', error.stack);
      return {
        error: true,
        message: error.message,
      };
    }
  }
}
