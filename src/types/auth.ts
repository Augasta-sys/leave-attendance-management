export type UserRole = "admin" | "hr" | "manager" | "employee";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId: string;
  name: string;
  status: "active" | "inactive";
}

export interface LoginCredentials {
  email: string;
  password: string;
}