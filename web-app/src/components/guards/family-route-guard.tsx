"use client"

import { RouteGuard } from "./route-guard"

interface FamilyRouteGuardProps {
  children: React.ReactNode
}

export function FamilyRouteGuard({ children }: FamilyRouteGuardProps) {
  return (
    <RouteGuard allowedRole="family" redirectTo="/login">
      {children}
    </RouteGuard>
  )
}
