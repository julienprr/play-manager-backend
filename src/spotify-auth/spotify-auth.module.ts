// spotify-auth.module.ts
import { Module } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyAuthController } from './spotify-auth.controller';

@Module({
  providers: [SpotifyAuthService],
  controllers: [SpotifyAuthController],
  exports: [SpotifyAuthService], // Exporte le service si d'autres modules en ont besoin
})
export class SpotifyAuthModule {}
