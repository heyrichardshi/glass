import { User } from "../models/user";

export interface ListUsersResponse {
  users: User[];
}

export interface CreateUserRequest {
  name: string;
}

export interface CreateUserResponse {
  user: User;
}

export interface AttachIdentityResponse {
  user: User;
}
