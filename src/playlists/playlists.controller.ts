import { Controller, Get, Headers, Logger } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Playlists')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: "Récupère les playlists de l'utilisateur authentifié" })
  async getPlaylists(@Headers('Authorization') authHeader: string) {
    this.logger.log('Received request to get playlists ', 'authHeader :', authHeader);
    const accessToken = authHeader.split(' ')[1];
    this.logger.debug(`Extracted access token: ${accessToken}`);
    return await this.playlistsService.getUserPlaylists(accessToken);
  }
}
