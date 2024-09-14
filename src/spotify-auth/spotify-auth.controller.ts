import { Controller, Get, Query, Redirect, Logger } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Spotify Authentication')
@Controller('spotify-auth')
export class SpotifyAuthController {
  private readonly logger = new Logger(SpotifyAuthController.name);

  constructor(private readonly spotifyAuthService: SpotifyAuthService) {}

  @Get('login')
  @ApiOperation({ summary: "Redirige vers la page d'authentification Spotify" })
  @Redirect()
  login() {
    this.logger.log('Handling login request');
    const url = this.spotifyAuthService.getAuthorizationUrl();
    this.logger.debug(`Redirecting to URL: ${url}`);
    return { url };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback après authentification Spotify' })
  async callback(@Query('code') code: string) {
    this.logger.log('Handling Spotify callback');
    const tokens = await this.spotifyAuthService.getToken(code);
    this.logger.debug(`Received tokens: ${JSON.stringify(tokens)}`);
    return tokens;
  }
}
