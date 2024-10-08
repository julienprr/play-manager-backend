import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SpotifyAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  private readonly logger = new Logger(SpotifyAuthService.name);

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI');
  }

  getAuthorizationUrl() {
    this.logger.log('Generating Spotify authorization URL');
    const scopes = [
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
    ];
    const scopeParam = encodeURIComponent(scopes.join(' '));
    const state = 'some_random_state';
    const url = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${this.redirectUri}&scope=${scopeParam}&state=${state}`;

    return url;
  }

  async getTokensFromSpotify(code: string) {
    this.logger.log('Requesting Spotify access token: ', code);
    this.logger.log('Redirect Uri: ', this.redirectUri);
    this.logger.log('Client id ', this.clientId);
    this.logger.log('Client secret: ', this.clientSecret);

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('response', response.data);

      const { access_token, refresh_token } = response.data;
      return { spotify_access_token: access_token, spotify_refresh_token: refresh_token };
    } catch (error) {
      this.logger.error('Failed to retrieve Spotify token', error.message);
      throw error;
    }
  }

  /**
   * Échange le code d'autorisation contre un token d'accès Spotify
   * Créer un nouvel utilisateur en base si c'est la première connexion
   * Renvoie un token JWT qui identifie l'utilisateur
   *
   * @param {string} code Le code d'autorisation Spotify
   * @returns le token d'accès
   */
  async authenticate(code: string) {
    try {
      if (!code) {
        throw new Error("Aucun code n'a été récupéré");
      }

      const { spotify_access_token, spotify_refresh_token } = await this.getTokensFromSpotify(code);

      if (!spotify_access_token) {
        throw new Error("Aucun token n'a été récupéré");
      }

      const userProfile = await this.getUserProfile({ spotify_access_token });
      const existingUser = await this.prisma.user.findUnique({
        where: {
          spotifyUserId: userProfile.id,
        },
      });

      if (!existingUser) {
        const createdUser = await this.prisma.user.create({
          data: {
            spotifyUserId: userProfile.id,
            email: userProfile.email,
            username: userProfile.display_name,
            spotifyAccessToken: spotify_access_token,
            spotifyAccessTokenTimestamp: new Date(),
            spotifyRefreshToken: spotify_refresh_token,
          },
        });

        this.logger.log(`New user created with email ${createdUser.email}`);
        return await this.authService.authenticateUser({ userId: createdUser.id });
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          spotifyUserId: userProfile.id,
          email: userProfile.email,
          username: userProfile.display_name,
          spotifyAccessToken: spotify_access_token,
          spotifyAccessTokenTimestamp: new Date(),
          spotifyRefreshToken: spotify_refresh_token,
        },
      });

      const access_token = await this.authService.authenticateUser({ userId: updatedUser.id });
      return { user: userProfile, ...access_token };
    } catch (error) {
      this.logger.error(error);
      return { error: true, message: error.message, token: '' };
    }
  }

  async getSpotifyAccessToken({ userId }: { userId: string }) {
    this.logger.log('getSpotifyAccessToken');
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("L'utilisateur n'éxiste pas");
      }

      const currentTime = new Date();
      const expirationDate = new Date(user.spotifyAccessTokenTimestamp.getTime() + 3600000);

      if (expirationDate && currentTime < expirationDate) {
        return { spotify_access_token: user.spotifyAccessToken };
      }

      // Si le token est expiré, rafraîchir
      return await this.refreshSpotifyToken(userId);
    } catch (error) {
      console.error(error);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  async refreshSpotifyToken(userId: string) {
    this.logger.log('refreshSpotifyToken');
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("L'utilisateur n'éxiste pas");
    }

    if (!existingUser.spotifyRefreshToken) {
      this.logger.error("Aucun token de rafraichissement n'a été touvé");
      throw new Error('REAUTHENTIFICATION_REQUIRED');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: existingUser.spotifyRefreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;

      // Met à jour le nouvel access_token dans la base de données
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          spotifyAccessToken: access_token,
          spotifyAccessTokenTimestamp: new Date(),
        },
      });

      return { spotify_access_token: access_token };
    } catch (error) {
      this.logger.error('Failed to refresh Spotify token', error);
      return { error: true, message: error.message };
    }
  }

  private async getUserProfile({ spotify_access_token }: { spotify_access_token: string }) {
    console.log('getUserProfile');
    const response = await axios.get(`https://api.spotify.com/v1/me`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${spotify_access_token}`,
      },
    });

    return response.data;
  }
}
