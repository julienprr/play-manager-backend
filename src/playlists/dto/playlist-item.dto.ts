import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class PlaylistItemDto {
  @IsString()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  name: string;

  @IsString()
  @Expose()
  description: string;

  @IsString()
  @Expose()
  imgageUrl?: string;
}
