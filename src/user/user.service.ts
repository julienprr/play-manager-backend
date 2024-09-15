import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, username: true },
    });
    return users;
  }

  async getUser({ userId }: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      select: { id: true, email: true, username: true },
      where: {
        id: userId,
      },
    });
    console.log({ user });
    return user;
  }

  async getAccessToken({ spotifyUserId }: { spotifyUserId: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { spotifyUserId },
    });

    if (!existingUser) {
      throw new Error("L'utilisateur n'éxiste pas");
    }

    if (!existingUser.spotifyAccessToken) {
      throw new Error("Aucun token d'accès Spotify n'a été trouvé");
    }

    return { access_token: existingUser.spotifyAccessToken };
  }
}
