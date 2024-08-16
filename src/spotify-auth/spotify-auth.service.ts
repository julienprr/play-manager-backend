import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SpotifyAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  private readonly logger = new Logger(SpotifyAuthService.name);

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI');
  }

  getHello(): string {
    return 'Hello, this is the SpotifyAuth module !';
  }

  getAuthorizationUrl() {
    this.logger.log('Generating Spotify authorization URL');
    const scope = 'playlist-read-private';
    const state = 'some_random_state';
    const url = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${this.redirectUri}&scope=${scope}&state=${state}`;
    this.logger.debug(`Generated URL: ${url}`);

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
    this.logger.error('Failed to retrieve Spotify token', error.stack);
    throw error;
  }
}
