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
}
