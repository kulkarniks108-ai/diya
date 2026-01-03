"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthStore } from "@/store/auth"
import { useFamilyStore } from "@/store/family"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

function formatUpdatedAt(updatedAt: any): string {
  if (!updatedAt) return "-"

  try {
    if (typeof updatedAt === "number") {
      return new Date(updatedAt).toLocaleString()
    }

    if (typeof updatedAt?.toDate === "function") {
      return updatedAt.toDate().toLocaleString()
    }

    if (typeof updatedAt?.seconds === "number") {
      return new Date(updatedAt.seconds * 1000).toLocaleString()
    }
  } catch {
    // ignore
  }

  return String(updatedAt)
}

export default function TrackPage() {
  const router = useRouter()

  const authStatus = useAuthStore((s) => s.authStatus)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const {
    connectionStatus,
    error,
    linkedBlindUserId,
    blindUserLocation,
    findLinkedBlindUser,
    unsubscribeLiveStatus,
  } = useFamilyStore()

  useEffect(() => {
    if (authStatus === "checking") return

    if (authStatus === "signedOut") {
      router.replace("/login")
      return
    }

    if (!user) return

    if (user.role === "blind") {
      router.replace("/blind")
      return
    }

    void findLinkedBlindUser()

    return () => {
      unsubscribeLiveStatus()
    }
  }, [authStatus, findLinkedBlindUser, router, unsubscribeLiveStatus, user])

  const locationView = useMemo(() => {
    const lat = blindUserLocation?.lat
    const lng = blindUserLocation?.lng
    const sos = blindUserLocation?.sos
    const updatedAt = formatUpdatedAt(blindUserLocation?.updatedAt)

    return {
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      sos: typeof sos === "boolean" ? sos : null,
      updatedAt,
    }
  }, [blindUserLocation])

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Tracking</CardTitle>
            <CardDescription>
              Showing live status from Firestore `liveStatus`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Status: <span className="text-foreground">{connectionStatus}</span>
              </div>
              <Button variant="outline" type="button" onClick={() => void logout()}>
                Logout
              </Button>
            </div>

            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : null}

            <div className="grid gap-2 text-sm">
              <div>
                Linked blind user: <span className="font-mono">{linkedBlindUserId ?? "-"}</span>
              </div>
              <div>
                Lat: <span className="font-mono">{locationView.lat ?? "-"}</span>
              </div>
              <div>
                Lng: <span className="font-mono">{locationView.lng ?? "-"}</span>
              </div>
              <div>
                Updated: <span className="font-mono">{locationView.updatedAt}</span>
              </div>
              <div>
                SOS: <span className="font-mono">{locationView.sos ?? "-"}</span>
              </div>
            </div>

            {connectionStatus === "no-link" ? (
              <p className="text-sm text-muted-foreground">
                No linked blind user found for this family account.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
