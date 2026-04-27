export type UserRole = "blind" | "family"

export interface AppUser {
  uid: string
  email: string
  role: UserRole
}
