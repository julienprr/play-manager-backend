import { IsEnum, IsNumber } from 'class-validator';

export const TypeOption = {
  ARTISTS: 'artists',
  TRACKS: 'tracks',
};

export const TimeRangeOption = {
  SHORT_TERM: 'short_term',
  MEDIUM_TERM: 'medium_term',
  LONG_TERM: 'long_term',
};

export class TopItemOptionsDto {
  @IsEnum(TimeRangeOption)
  time_range?: string;

  @IsNumber()
  limit?: number;

  @IsNumber()
  offset?: number;
}
