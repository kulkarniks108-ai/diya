"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"

export default function BlindPage() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const onLogout = async () => {
    await logout()
    router.replace("/login")
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Install the blind app</h1>
        <p className="text-sm text-muted-foreground">
          This web app is for family members to track location. Please install
          the mobile app on the blind person’s device.
        </p>

        <div className="pt-2">
          <Button variant="outline" type="button" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
