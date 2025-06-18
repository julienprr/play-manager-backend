import { IsEmail } from 'class-validator';

export class LogUserDto {
  @IsEmail({}, { message: 'Vous devez fournir un email valide' })
  email: string;
}
