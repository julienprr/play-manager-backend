import { Body, Controller, Delete, Get, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { TopItemOptionsDto } from './dto/top-item-options.dto';
import { PlaylistsService } from './playlists.service';

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
    return await this.playlistsService.getUserPlaylistById({ userId: req.user.userId, playlistId });
  }

  @Post('reorganize/')
  @ApiOperation({ summary: "Trie une playlist de l'utilisateur authentifié en fonction de l'id donné" })
  async ReorganizePlaylist(@Req() req, @Body('playlistId') playlistId: string) {
    this.logger.log(`Received request to reorganize playlist ${playlistId}`);
    return await this.playlistsService.reorganizePlaylist({ userId: req.user.userId, playlistId });
  }

  @Post('copy/')
  @ApiOperation({ summary: "Copie le contenu d'une playlist de l'utilisateur vers une autre" })
  async CopyPlaylistContent(
    @Req() req,
    @Body('playlistSourceId') playlistSourceId: string,
    @Body('playlistDestinationId') playlistDestinationId: string,
  ) {
    this.logger.log(`Received request to copy playlist ${playlistSourceId} to playlist ${playlistDestinationId}`);
    return await this.playlistsService.copyPlaylistContent({
      userId: req.user.userId,
      playlistSourceId,
      playlistDestinationId,
    });
  }

  @Delete('clean/:playlistId')
  @ApiOperation({ summary: "Vide une playlist de l'utilisateur authentifié en fonction de l'id donné" })
  async cleanPlaylist(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to clean playlist ${playlistId}`);
    return await this.playlistsService.cleanPlaylist({ userId: req.user.userId, playlistId });
  }

  @Post('favorites/')
  @ApiOperation({ summary: "Ajoute l'id de la playlist aux favoris de l'utilisateur" })
  async addFavorite(@Req() req, @Body('playlistId') playlistId: string) {
    this.logger.log(`Received request to add playlist ${playlistId} to favorites`);
    return await this.playlistsService.addFavoritePlaylist({ userId: req.user.userId, playlistId });
  }

  @Delete('favorites/:playlistId')
  @ApiOperation({ summary: "Supprime l'id de la playlist aux favoris de l'utilisateur" })
  async removeFavorite(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to remove playlist ${playlistId} from favorites`);
    return await this.playlistsService.removeFavoritePlaylist({ userId: req.user.userId, playlistId });
  }

  @Post('auto-sort/')
  @ApiOperation({ summary: "Ajoute l'id de la playlist aux playlists auto sorted de l'utilisateur" })
  async addAutoSort(@Req() req, @Body('playlistId') playlistId: string) {
    this.logger.log(`Received request to add playlist ${playlistId} to auto sorted`);
    return await this.playlistsService.addAutoSortPlaylist({ userId: req.user.userId, playlistId });
  }

  @Delete('auto-sort/:playlistId')
  @ApiOperation({ summary: "Supprime l'id de la playlist aux playlists auto sorted de l'utilisateur" })
  async removeAutoSort(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to remove playlist ${playlistId} from auto sorted`);
    return await this.playlistsService.removeAutoSortPlaylist({ userId: req.user.userId, playlistId });
  }

  @Get('/top/:type')
  @ApiOperation({ summary: "Récupère les top items (albums, artistes) de l'utilisateur authentifié" })
  async getTopTrack(@Req() req, @Param('type') type: string, @Query() params: TopItemOptionsDto) {
    this.logger.log('Received request to get Top items');
    return await this.playlistsService.getUserTopItems({ userId: req.user.userId, type: type, options: params });
  }
}
