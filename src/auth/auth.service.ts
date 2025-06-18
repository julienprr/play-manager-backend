import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { LogUserDto } from './dto/log-user-dto';
import { UserPayload } from './jwt.stategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(authBody: LogUserDto) {
    try {
      const { email } = authBody;

      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!existingUser) {
        throw new Error("L'utilisateur n'existe pas");
      }

      return this.authenticateUser({ userId: existingUser.id });
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  async authenticateUser({ userId }: UserPayload) {
    const payload: UserPayload = { userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
