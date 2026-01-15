export const PUBLIC_ROUTES = ["/", "/login", "/register"] as const

export const FAMILY_ROUTES = ["/track", "/profile"] as const

export const BLIND_ROUTES = ["/blind"] as const

export type PublicRoute = (typeof PUBLIC_ROUTES)[number]
export type FamilyRoute = (typeof FAMILY_ROUTES)[number]
export type BlindRoute = (typeof BLIND_ROUTES)[number]
