"use client"

import { RouteGuard } from "./route-guard"

interface BlindRouteGuardProps {
  children: React.ReactNode
}

export function BlindRouteGuard({ children }: BlindRouteGuardProps) {
  return (
    <RouteGuard allowedRole="blind" redirectTo="/login">
      {children}
    </RouteGuard>
  )
}
