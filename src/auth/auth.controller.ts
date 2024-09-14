import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LogUserDto } from './dto/log-user-dto';
import { JwtAuthGuard } from './jwt.auth.guard';
import { RequestWithUser } from './jwt.stategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() authBody: LogUserDto) {
    return await this.authService.login(authBody);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAuthenticateUser(@Req() request: RequestWithUser) {
    const user = await this.userService.getUser({ userId: request.user.userId });
    return user;
  }
}
