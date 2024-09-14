import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { UserPayload } from 'src/auth/jwt.stategy';
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
    private readonly jwtService: JwtService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI');
  }

  getAuthorizationUrl() {
    this.logger.log('Generating Spotify authorization URL');
    const scope = 'user-read-email';
    const state = 'some_random_state';
    const url = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${this.redirectUri}&scope=${scope}&state=${state}`;

    return url;
  }

  async getToken(code: string): Promise<any> {
    this.logger.log('Requesting Spotify access token');
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.logger.debug(`Received token response: ${JSON.stringify(response.data)}`);
    return response.data;
  }
  catch(error) {
    this.logger.error('Failed to retrieve Spotify token', error);
    throw error;
  }

  async handleSpotifyCallback(code: string) {
    try {
      if (!code) {
        throw new Error("Aucun code n'a été récupéré");
      }

      const { access_token, refresh_token } = await this.getToken(code);

      if (!access_token) {
        throw new Error("Aucun token n'a été récupéré");
      }

      const userProfile = await this.getUserProfile({ access_token });
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
            spotifyAccessToken: access_token,
            spotifyRefreshToken: refresh_token,
          },
        });

        this.logger.log(`New user created with email ${createdUser.email}`);
        return await this.authentificateUser({ userId: createdUser.id });
      }
      return await this.authentificateUser({ userId: existingUser.id });
    } catch (error) {
      this.logger.error(error);
      return { error: true, message: error.message };
    }
  }

  private async getUserProfile({ access_token: access_token }: { access_token: string }) {
    const response = await axios.get(`https://api.spotify.com/v1/me`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  }

  private async authentificateUser({ userId }: UserPayload) {
    const payload: UserPayload = { userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
