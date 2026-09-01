import type { UserApiResponse } from './userApiResponse';

export interface AuthResponseApi {
  User: UserApiResponse;
  Token: string;
}