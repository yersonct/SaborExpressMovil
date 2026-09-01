export interface UserApiResponse {
  Id: number;
  Email: string | null;
  Name: string | null;
  LastName: string | null;
  Document: string | null;
  RoleId: number;
  Status: boolean;
  LastLogin: string | null;
  CreatedAt: string;
}