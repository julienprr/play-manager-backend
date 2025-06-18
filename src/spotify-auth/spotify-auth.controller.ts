import { Controller, Get, Logger, Query, Redirect } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpotifyAuthService } from './spotify-auth.service';

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

  @Get('authenticate')
  @ApiOperation({ summary: 'Callback après authentification Spotify' })
  async authenticate(@Query('code') code: string) {
    this.logger.log('Authenticate...');
    return await this.spotifyAuthService.authenticate(code);
  }
}
