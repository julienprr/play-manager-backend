import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  getHello(): string {
    return 'Hello, this is the playlist module!';
  }

  async getUserPlaylists(accessToken: string): Promise<any> {
    this.logger.log('Fetching user playlists from Spotify');
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      this.logger.debug(`Playlists received: ${JSON.stringify(response.data.items)}`);
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error.stack);
      throw error;
    }
  }
}
