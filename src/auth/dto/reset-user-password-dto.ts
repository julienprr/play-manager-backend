import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  token: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Votre mot de passe doit faire plus de 6 caractères' })
  password: string;
}
