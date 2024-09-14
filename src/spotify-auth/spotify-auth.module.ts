// spotify-auth.module.ts
import { Module } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyAuthController } from './spotify-auth.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtStrategy } from 'src/auth/jwt.stategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  exports: [SpotifyAuthService],
  controllers: [SpotifyAuthController],
  providers: [SpotifyAuthService, PrismaService, JwtStrategy],
})
export class SpotifyAuthModule {}
