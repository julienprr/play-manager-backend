import { Controller, Get, Logger, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { PlaylistsService } from './playlists.service';
import { TopItemOptionsDto } from './dto/top-item-options.dto';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: "Récupère les playlists de l'utilisateur authentifié" })
  async getPlaylists(@Req() req) {
    this.logger.log('Received request to get playlists');
    return await this.playlistsService.getUserPlaylists({ userId: req.user.userId });
  }

  @Get('/:playlistId')
  @ApiOperation({ summary: "Récupère une playlist de l'utilisateur authentifié en fonction de l'id donné" })
  async getOnePlaylist(@Req() req, @Param('playlistId') playlistId) {
    this.logger.log(`Received request to get playlist ${playlistId}`);
    return await this.playlistsService.getOneUserPlaylist({ userId: req.user.userId, playlistId });
  }

  @Get('/top/:type')
  @ApiOperation({ summary: "Récupère les top items (albums, artistes) de l'utilisateur authentifié" })
  async getTopTrack(@Req() req, @Param('type') type: string, @Query() params: TopItemOptionsDto) {
    this.logger.log('Received request to get Top items');
    return await this.playlistsService.getUserTopItems({ userId: req.user.userId, type: type, options: params });
  }
}
