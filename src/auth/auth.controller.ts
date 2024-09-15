import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LogUserDto } from './dto/log-user-dto';

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
}
