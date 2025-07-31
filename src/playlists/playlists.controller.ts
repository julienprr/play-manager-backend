import { Body, Controller, Delete, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
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

  @Post('sort/:playlistId')
  @ApiOperation({ summary: "Trie une playlist de l'utilisateur authentifié en fonction de l'id donné" })
  async ReorganizePlaylist(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to reorganize playlist ${playlistId}`);
    return await this.playlistsService.SortPlaylistByReleaseDate({ userId: req.user.userId, playlistId });
  }

  @Post('shuffle/:playlistId')
  @ApiOperation({ summary: "Mélange les titres d'une playlist de l'utilisateur" })
  async shufflePlaylist(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to shuffle playlist ${playlistId}`);
    return await this.playlistsService.shufflePlaylist({ userId: req.user.userId, playlistId });
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

  @Post('favorites/:playlistId')
  @ApiOperation({ summary: "Ajoute l'id de la playlist aux favoris de l'utilisateur" })
  async addFavorite(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to add playlist ${playlistId} to favorites`);
    return await this.playlistsService.addFavoritePlaylist({ userId: req.user.userId, playlistId });
  }

  @Delete('favorites/:playlistId')
  @ApiOperation({ summary: "Supprime l'id de la playlist aux favoris de l'utilisateur" })
  async removeFavorite(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to remove playlist ${playlistId} from favorites`);
    return await this.playlistsService.removeFavoritePlaylist({ userId: req.user.userId, playlistId });
  }

  @Post('auto-sort/:playlistId')
  @ApiOperation({ summary: "Ajoute l'id de la playlist aux playlists auto sorted de l'utilisateur" })
  async addAutoSort(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to add playlist ${playlistId} to auto sorted`);
    return await this.playlistsService.addAutoSortPlaylist({ userId: req.user.userId, playlistId });
  }

  @Delete('auto-sort/:playlistId')
  @ApiOperation({ summary: "Supprime l'id de la playlist aux playlists auto sorted de l'utilisateur" })
  async removeAutoSort(@Req() req, @Param('playlistId') playlistId: string) {
    this.logger.log(`Received request to remove playlist ${playlistId} from auto sorted`);
    return await this.playlistsService.removeAutoSortPlaylist({ userId: req.user.userId, playlistId });
  }

  @Get('/top/track')
  @ApiOperation({ summary: "Récupère les top tracks de l'utilisateur authentifié" })
  async getUserTopTracks(@Req() req) {
    this.logger.log('Received request to get user top tracks');
    return await this.playlistsService.getUserTopTracks({ userId: req.user.userId });
  }

  @Get('/top/artist')
  @ApiOperation({ summary: "Récupère les top artists de l'utilisateur authentifié" })
  async getTopItem(@Req() req) {
    this.logger.log('Received request to get user top artists');
    return await this.playlistsService.getUserTopArtists({ userId: req.user.userId });
  }
}
