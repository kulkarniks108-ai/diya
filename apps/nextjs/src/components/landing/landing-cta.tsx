"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingCTA() {
  const { authStatus, user } = useAuthStore()

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" disabled>
          Loading...
        </Button>
      </div>
    )
  }

  // User is signed in - show role-based navigation
  if (authStatus === "signedIn" && user) {
    if (user.role === "family") {
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/track">
              Go to Track
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )
    }

    if (user.role === "blind") {
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/blind">
              Go to Blind Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )
    }
  }

  // User is signed out - show login and register options
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button size="lg" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/register">Register</Link>
      </Button>
    </div>
  )
}
