import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PlaylistsService } from './playlists.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AutoSortService {
  private readonly logger = new Logger(AutoSortService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistService: PlaylistsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON) async handleAutoSort() {
    this.logger.log('Début du cron autoSort');

    const users = await this.prisma.user.findMany({
      where: {
        autoSortPlaylists: {
          isEmpty: false,
        },
      },
    });

    for (const user of users) {
      for (const playlistId of user.autoSortPlaylists) {
        this.logger.log(`Sorting Playlist ${playlistId} de l'utilisateur ${user.id}`);

        try {
          await this.playlistService.reorganizePlaylist({ userId: user.id, playlistId });
          this.logger.log(`Playlist ${playlistId} triée avec succès`);
        } catch (error) {
          this.logger.error(`Erreur sur la playlist ${playlistId}: ${error.message}`);
        }
      }
    }

    this.logger.log('Fin du cron autoSort');
  }
}
