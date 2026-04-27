"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import { Spinner } from "@/components/ui/spinner"
import type { UserRole } from "@/types/auth"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRole: UserRole
  redirectTo: string
}

export function RouteGuard({ children, allowedRole, redirectTo }: RouteGuardProps) {
  const router = useRouter()
  const { authStatus, user } = useAuthStore()

  useEffect(() => {
    // Wait for auth check to complete
    if (authStatus === "checking") return

    // Redirect if not signed in
    if (authStatus === "signedOut" || !user) {
      router.replace(redirectTo)
      return
    }

    // Redirect if wrong role
    if (user.role !== allowedRole) {
      router.replace("/")
      return
    }
  }, [authStatus, user, allowedRole, redirectTo, router])

  // Show loading spinner while checking auth
  if (authStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Don't render content if redirecting
  if (authStatus === "signedOut" || !user || user.role !== allowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
