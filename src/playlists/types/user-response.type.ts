import { ApiResponse } from 'src/common/types/api-response.type';
import { User } from '@prisma/client';

export type UserResponse = ApiResponse<'user', User>;
