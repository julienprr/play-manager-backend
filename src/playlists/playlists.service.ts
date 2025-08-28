import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from 'src/common/types/api-response.type';
import { PrismaService } from 'src/prisma.service';
import { SpotifyAuthService } from 'src/spotify-auth/spotify-auth.service';
import { PlaylistItemDto } from './dto/playlist-item.dto';
import { PlaylistListResponse, PlaylistResponse } from './types/playlist-response.type';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotifyAuthService: SpotifyAuthService,
  ) {}

  async getUserPlaylists({ userId }: { userId: string }): Promise<PlaylistListResponse> {
    this.logger.log('Fetching user playlists from Spotify');

    try {
      const { user: existingUser, accessToken: spotify_access_token } =
        await this.validateUserAndGetAccessToken(userId);

      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${spotify_access_token}`,
        },
      });

      const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
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
          imageUrl: this.extractImageUrl(item.images),
          spotifyUrl: item.external_urls.spotify,
          public: item.public,
          isFavorite: existingUser.favoritePlaylists.includes(item.id),
          autoSort: existingUser.autoSortPlaylists.includes(item.id),
        };
      });

      playlistsData.push({
        id: 'liked-songs',
        name: 'Liked Songs',
        ownerName: existingUser.username,
        description: 'Your liked songs on Spotify',
        totalTracks: savedTracksResponse.data.total || 0,
        imageUrl: null,
        spotifyUrl: '',
        public: false,
        isFavorite: existingUser.favoritePlaylists.includes('liked-songs'),
        autoSort: existingUser.autoSortPlaylists.includes('liked-songs'),
      });

      return { playlists: playlistsData };
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      throw new HttpException('Failed to fetch playlists: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserPlaylistById({ userId, playlistId }: { userId: string; playlistId: string }): Promise<PlaylistResponse> {
    try {
      const { user: existingUser, accessToken: spotify_access_token } =
        await this.validateUserAndGetAccessToken(userId);

      if (playlistId === 'liked-songs') {
        const response = await axios.get(`https://api.spotify.com/v1/me/tracks`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const likedTracksPlaylist = {
          id: 'liked-songs',
          name: 'Liked Songs',
          description: 'Your liked songs on Spotify',
          ownerName: existingUser.username,
          tracks: response.data.items.map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artistName: item.track.artists[0]?.name || '',
            albumName: item.track.album?.name || '',
            isExplicit: item.track.explicit,
            imageUrl: item.track.album?.images[0]?.url || '',
            duration: item.track.duration_ms,
          })),
          uri: '',
          totalTracks: response.data.total || 0,
          imageUrl: null,
          spotifyUrl: '',
          public: false,
          isFavorite: existingUser.favoritePlaylists.includes('liked-songs'),
          autoSort: existingUser.autoSortPlaylists.includes('liked-songs'),
        };

        const playlist = plainToInstance(PlaylistItemDto, likedTracksPlaylist);

        return { playlist };
      } else {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const item = {
          id: response.data.id,
          name: response.data.name,
          ownerName: response.data.owner.display_name,
          description: response.data.description,
          totalTracks: response.data.tracks.total || 0,
          imageUrl: this.extractImageUrl(response.data.images),
          spotifyUrl: response.data.external_urls.spotify,
          public: response.data.public,
          isFavorite: existingUser.favoritePlaylists.includes(response.data.id),
          autoSort: existingUser.autoSortPlaylists.includes(response.data.id),
          tracks: response.data.tracks.items.map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artistName: item.track.artists[0]?.name || '',
            albumName: item.track.album?.name || '',
            isExplicit: item.track.explicit,
            imageUrl: this.extractImageUrl(item.track.album?.images),
            duration: item.track.duration_ms,
          })),
        };

        const playlist = plainToInstance(PlaylistItemDto, item);

        return { playlist };
      }
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      throw new HttpException('Failed to fetch playlists: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserTopTracks({ userId }: { userId: string }) {
    this.logger.log(`Fetching user top tracks from Spotify`);

    try {
      const { accessToken: spotify_access_token } = await this.validateUserAndGetAccessToken(userId);

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
        imageUrl: this.extractImageUrl(item.album.images),
        duration: item.duration_ms,
      }));

      const mediumTermItems = mediumTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        isExplicit: item.explicit,
        imageUrl: this.extractImageUrl(item.album.images),
        duration: item.duration_ms,
      }));

      const longTermItems = longTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        isExplicit: item.explicit,
        imageUrl: this.extractImageUrl(item.album.images),
        duration: item.duration_ms,
      }));

      return {
        short_term: shortTermItems,
        medium_term: mediumTermItems,
        long_term: longTermItems,
      };
    } catch (error) {
      this.logger.error('Failed to fetch top tracks', error.stack);
      throw new HttpException('Failed to fetch top tracks: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserTopArtists({ userId }: { userId: string }) {
    this.logger.log(`Fetching user top artists from Spotify`);

    try {
      const { accessToken: spotify_access_token } = await this.validateUserAndGetAccessToken(userId);

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
        followers: item.followers.total,
        genres: item.genres,
        popularity: item.popularity,
        imageUrl: this.extractImageUrl(item.images),
        spotifyUrl: item.external_urls.spotify,
      }));

      const mediumTermItems = mediumTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        followers: item.followers.total,
        genres: item.genres,
        popularity: item.popularity,
        imageUrl: this.extractImageUrl(item.images),
        spotifyUrl: item.external_urls.spotify,
      }));

      const longTermItems = longTermRes.data.items.map((item) => ({
        id: item.id,
        name: item.name,
        followers: item.followers.total,
        genres: item.genres,
        popularity: item.popularity,
        imageUrl: this.extractImageUrl(item.images),
        spotifyUrl: item.external_urls.spotify,
      }));

      return {
        short_term: shortTermItems,
        medium_term: mediumTermItems,
        long_term: longTermItems,
      };
    } catch (error) {
      this.logger.error('Failed to fetch top artists', error.stack);
      throw new HttpException('Failed to fetch top artists: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private sortTracksByReleaseDate(tracks: any[]) {
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

    if (playlistId == 'liked-songs') {
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
    this.logger.debug(`${retrievedTracks.length} tracks retrieved`);

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
    if (playlistId == 'liked-songs') {
      chunkSize = 50;
      const trackUrisToRemove = tracks.map((item) => item.track.id);
      this.logger.debug(trackUrisToRemove);

      for (let i = 0; i < trackUrisToRemove.length; i += chunkSize) {
        const chunk = trackUrisToRemove.slice(i, i + chunkSize);
        this.logger.debug(`deleting tracks ${i} to ${i + chunkSize}`);

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

      this.logger.debug(trackUrisToRemove);

      for (let i = 0; i < trackUrisToRemove.length; i += chunkSize) {
        const chunk = trackUrisToRemove.slice(i, i + chunkSize);
        this.logger.debug(`deleting tracks ${i} to ${i + chunkSize}`);

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
    this.logger.debug('All tracks have been deleted');
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
    if (playlistId == 'liked-songs') {
      const tracksIds = tracks.map((track) => track.track.id);
      this.logger.debug('tracks: ' + tracksIds.length);

      // Ajouter les titres un par un dans l'ordre inverse pour conserver l'ordre d'affichage
      for (let i = tracksIds.length - 1; i >= 0; i--) {
        const id = tracksIds[i];
        this.logger.debug(`adding track ${id}`);

        await axios.put(
          `https://api.spotify.com/v1/me/tracks`,
          {
            ids: [id],
          },
          { headers: { Authorization: `Bearer ${spotify_access_token}` } },
        );
      }
    } else {
      const tracksUris = tracks.map((track) => track.track.uri);
      this.logger.debug('tracks: ' + tracksUris.length);
      chunkSize = Math.min(100, tracksUris.length);

      for (let i = 0; i < tracksUris.length; i += chunkSize) {
        const chunk = tracksUris.slice(i, i + chunkSize);
        this.logger.debug(`adding tracks ${i} to ${i + chunkSize}`);

        await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            uris: chunk,
          },
          { headers: { Authorization: `Bearer ${spotify_access_token}` } },
        );
      }
    }
    this.logger.debug('All tracks added successfully');
  }

  async SortPlaylistByReleaseDate({
    userId,
    playlistId,
  }: {
    userId: string;
    playlistId: string;
  }): Promise<PlaylistResponse> {
    this.logger.log('Sorting playlist by release date', playlistId);

    if (playlistId === 'liked-songs') {
      throw new HttpException('The playlist Liked Songs can not be sorted', HttpStatus.BAD_REQUEST);
    }

    try {
      const { accessToken: spotify_access_token } = await this.validateUserAndGetAccessToken(userId);

      // Fetch all tracks from the playlist, handling pagination if needed
      const allTracks = await this.retriveTracks({ playlistId, spotify_access_token });

      const validTracks = allTracks.filter(
        (item) => item.track && item.track.uri && item.track.id && item.track.album.id,
      );

      this.logger.debug(`${validTracks.length} valid tracks to sort`);
      // Group and sort as needed, then update the playlist
      const sortedTracks = this.sortTracksByReleaseDate(validTracks);
      this.logger.debug(`${sortedTracks.length} track sorted`);

      // delete all tracks
      await this.deleteTracks({ tracks: validTracks, playlistId, spotify_access_token });

      // Re-add the tracks in sorted order
      await this.addTracks({ tracks: sortedTracks, playlistId, spotify_access_token });

      return await this.getUserPlaylistById({ userId, playlistId });
    } catch (error) {
      this.logger.error('Failed to sorting playlist', error.stack);
      throw new HttpException('Failed to sorting playlist: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async shufflePlaylist({ userId, playlistId }: { userId: string; playlistId: string }): Promise<PlaylistResponse> {
    this.logger.log(`Shuffling playlist with id ${playlistId}`);

    if (playlistId === 'liked-songs') {
      throw new HttpException('The playlist Liked Songs can not be shuffled', HttpStatus.BAD_REQUEST);
    }

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error("L'utilisateur n'existe pas");
      }

      const { spotify_access_token } = await this.spotifyAuthService.getSpotifyAccessToken({ userId });

      if (!spotify_access_token) {
        throw new Error("Aucun token d'accès Spotify n'a été trouvé");
      }

      // Retrieve all tracks
      const allTracks = await this.retriveTracks({ playlistId, spotify_access_token });

      const validTracks = allTracks.filter((item) => item.track && item.track.uri && item.track.id);

      this.logger.debug(`${validTracks.length} valid tracks to shuffle`);

      // Shuffle tracks
      for (let i = validTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validTracks[i], validTracks[j]] = [validTracks[j], validTracks[i]];
      }

      // Delete all tracks
      await this.deleteTracks({ tracks: validTracks, playlistId, spotify_access_token });

      // Re-add the tracks in shuffled order
      await this.addTracks({ tracks: validTracks, playlistId, spotify_access_token });

      return await this.getUserPlaylistById({ userId, playlistId });
    } catch (error) {
      this.logger.error('Failed to shuffle playlist', error.stack);
      throw new HttpException('Failed to shuffle playlist: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
  }): Promise<PlaylistResponse> {
    this.logger.log(`Coping content from playlist ${playlistSourceId} to playlist ${playlistDestinationId}`);

    try {
      const { user: existingUser, accessToken: spotify_access_token } =
        await this.validateUserAndGetAccessToken(userId);

      const sourceTracks = await this.retriveTracks({ playlistId: playlistSourceId, spotify_access_token });

      const validTracks = sourceTracks.filter(
        (item) => item.track && item.track.uri && item.track.id && item.track.album.id,
      );

      this.logger.debug(`${validTracks.length} tracks to copy`);

      if (playlistDestinationId === 'new-playlist') {
        const sourcePlaylistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistSourceId}`, {
          headers: {
            Authorization: `Bearer ${spotify_access_token}`,
          },
        });

        const sourcePlaylist = sourcePlaylistResponse.data;
        this.logger.debug(`Playlist name: ${sourcePlaylist.name}, id: ${sourcePlaylist.id}`);
        this.logger.debug(existingUser.spotifyUserId);

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
        await this.clearPlaylist({ userId, playlistId: newPlaylist.id });
      } else {
        // delete all tracks from the destination playlist
        await this.clearPlaylist({ userId, playlistId: playlistDestinationId });
      }

      // Re-add the tracks in the destination playlist
      await this.addTracks({ tracks: validTracks, playlistId: playlistDestinationId, spotify_access_token });

      this.logger.log('The playlist has been copied succesfully');
      return await this.getUserPlaylistById({ userId, playlistId: playlistDestinationId });
    } catch (error) {
      this.logger.error('Failed to copy playlist', error.stack);
      throw new HttpException('Failed to copy playlist: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async clearPlaylist({ userId, playlistId }: { userId: string; playlistId: string }): Promise<PlaylistResponse> {
    this.logger.log(`Cleaning playlist with id ${playlistId}`);

    try {
      const { accessToken: spotify_access_token } = await this.validateUserAndGetAccessToken(userId);
      const tracks = await this.retriveTracks({ playlistId, spotify_access_token });

      if (tracks.length > 0) {
        await this.deleteTracks({ tracks, playlistId, spotify_access_token });
      }

      return await this.getUserPlaylistById({ userId, playlistId });
    } catch (error) {
      this.logger.error('Failed to clear playlist', error.stack);
      throw new HttpException('Failed to clear playlist: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addFavoritePlaylist({
    userId,
    playlistId,
  }: {
    userId: string;
    playlistId: string;
  }): Promise<ApiResponse<'favoritePlaylists', string[]>> {
    this.logger.log('Adding favorite', playlistId);

    try {
      const { user: existingUser } = await this.validateUserAndGetAccessToken(userId);

      if (existingUser.favoritePlaylists.includes(playlistId)) {
        throw new HttpException("La playlist fait déjà partie des favoris de l'utilisateur.", HttpStatus.CONFLICT);
      }

      const updatedFavoritePlaylists = existingUser.favoritePlaylists.concat(playlistId);
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          favoritePlaylists: updatedFavoritePlaylists,
        },
      });

      return { favoritePlaylists: updatedFavoritePlaylists };
    } catch (error) {
      this.logger.error("L'ajout du favoris a échoué", error.stack);
      throw new HttpException("L'ajout du favoris a échoué: " + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async removeFavoritePlaylist({
    userId,
    playlistId,
  }: {
    userId: string;
    playlistId: string;
  }): Promise<ApiResponse<'favoritePlaylists', string[]>> {
    this.logger.log('Removing favorite', playlistId);

    try {
      const { user: existingUser } = await this.validateUserAndGetAccessToken(userId);

      if (!existingUser.favoritePlaylists.includes(playlistId)) {
        throw new HttpException(
          "La playlist ne fait pas partie des playlists auto sort de l'utilisateur.",
          HttpStatus.NOT_FOUND,
        );
      } else {
        const updatedFavoritePlaylists: string[] = existingUser.favoritePlaylists.filter(
          (favId) => favId !== playlistId,
        );
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            favoritePlaylists: updatedFavoritePlaylists,
          },
        });

        return {
          favoritePlaylists: updatedFavoritePlaylists,
        };
      }
    } catch (error) {
      this.logger.error('La supression du favoris a échouée', error.stack);
      throw new HttpException('La supression du favoris a échouée: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addAutoSortPlaylist({
    userId,
    playlistId,
  }: {
    userId: string;
    playlistId: string;
  }): Promise<ApiResponse<'autoSortPlaylists', string[]>> {
    this.logger.log('Adding auto sort playlist', playlistId);

    try {
      const { user: existingUser } = await this.validateUserAndGetAccessToken(userId);

      if (existingUser.autoSortPlaylists.includes(playlistId)) {
        throw new HttpException('La playlist est déjà en auto sorted.', HttpStatus.CONFLICT);
      } else {
        const updatedAutoSortPlaylists = existingUser.autoSortPlaylists.concat(playlistId);
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            autoSortPlaylists: updatedAutoSortPlaylists,
          },
        });

        return {
          autoSortPlaylists: updatedAutoSortPlaylists,
        };
      }
    } catch (error) {
      this.logger.error("L'ajout de la playlist auto sorted a échoué", error.stack);
      throw new HttpException(
        "L'ajout de la playlist auto sorted a échoué: " + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeAutoSortPlaylist({
    userId,
    playlistId,
  }: {
    userId: string;
    playlistId: string;
  }): Promise<ApiResponse<'autoSortPlaylists', string[]>> {
    this.logger.log('Removing auto sort playlist', playlistId);

    try {
      const { user: existingUser } = await this.validateUserAndGetAccessToken(userId);

      if (!existingUser.autoSortPlaylists.includes(playlistId)) {
        throw new HttpException(
          "La playlist ne fait pas partie des playlists auto sort de l'utilisateur.",
          HttpStatus.NOT_FOUND,
        );
      } else {
        const updatedAutoSortPlaylists = existingUser.autoSortPlaylists.filter(
          (playlistIdToFilter: string) => playlistIdToFilter !== playlistId,
        );
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            autoSortPlaylists: updatedAutoSortPlaylists,
          },
        });

        return {
          autoSortPlaylists: updatedAutoSortPlaylists,
        };
      }
    } catch (error) {
      this.logger.error('La supression de la playlist auto sorted a échouée', error.stack);
      throw new HttpException(
        'La supression de la playlist auto sorted a échouée: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractImageUrl(images: any[]): string | null {
    return Array.isArray(images) && images.length > 0 ? images[0].url : null;
  }

  private async validateUserAndGetAccessToken(userId: string): Promise<{ user: User; accessToken: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("L'utilisateur n'existe pas");
    }

    const { spotify_access_token } = await this.spotifyAuthService.getSpotifyAccessToken({ userId });

    if (!spotify_access_token) {
      throw new Error("Aucun token d'accès Spotify n'a été trouvé");
    }

    return { user: existingUser, accessToken: spotify_access_token };
  }
}
