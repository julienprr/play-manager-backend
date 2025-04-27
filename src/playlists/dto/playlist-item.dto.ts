import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class PlaylistItemDto {
  @IsString()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  name: string;

  @IsString()
  @Expose()
  ownerName: string;

  @IsString()
  @Expose()
  description: string;

  @IsString()
  @Expose()
  imgageUrl?: string;

  @IsBoolean()
  @Expose()
  public: string;

  @IsBoolean()
  @Expose()
  isFavorite: string;

  @IsBoolean()
  @Expose()
  autoSort: string;

  @IsNumber()
  @Expose()
  tracksNumber: string;
}
