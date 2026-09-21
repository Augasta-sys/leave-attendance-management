import { api } from "./api";
import type { LoginCredentials, User } from "../types/auth";

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<User | null> => {
  const response = await api.get<User[]>("/users", {
    params: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  if (response.data.length === 0) {
    return null;
  }

  return response.data[0];
};