import { ApiResponse } from 'src/common/types/api-response.type';
import { PlaylistItemDto } from '../dto/playlist-item.dto';

export type PlaylistResponse = ApiResponse<'playlist', PlaylistItemDto>;
export type PlaylistListResponse = ApiResponse<'playlists', PlaylistItemDto[]>;
