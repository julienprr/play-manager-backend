import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { PlaylistsService } from './playlists.service';

@ApiTags('Playlists')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  async getHello() {
    return 'HELLO WORLD !';
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Récupère les playlists de l'utilisateur authentifié" })
  async getPlaylists(@Req() req) {
    this.logger.log('Received request to get playlists ', 'authHeader');
    return await this.playlistsService.getUserPlaylists({ userId: req.user.id });
  }
}
