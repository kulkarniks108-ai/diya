export type UserRole = "blind" | "family";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
}

export interface AuthError {
  message: string;
}
