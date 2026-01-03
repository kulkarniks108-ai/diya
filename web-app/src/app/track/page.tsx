"use client"

import { Button } from "@/components/ui/button"
import { LiveLocationMap } from "@/components/live-location-map"
import { SafetyStatusCard } from "@/components/safety-status-card"
import { useAuthStore } from "@/store/auth"
import { useFamilyStore } from "@/store/family"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

function toDate(updatedAt: unknown): Date | null {
  if (!updatedAt) return null

  try {
    if (typeof updatedAt === "number") {
      return new Date(updatedAt)
    }

    if (
      typeof updatedAt === "object" &&
      updatedAt !== null &&
      "toDate" in updatedAt &&
      typeof (updatedAt as { toDate?: unknown }).toDate === "function"
    ) {
      return (updatedAt as { toDate: () => Date }).toDate()
    }

    if (
      typeof updatedAt === "object" &&
      updatedAt !== null &&
      "seconds" in updatedAt &&
      typeof (updatedAt as { seconds?: unknown }).seconds === "number"
    ) {
      return new Date((updatedAt as { seconds: number }).seconds * 1000)
    }
  } catch {
    // ignore
  }

  return null
}

function formatLastUpdated(updatedAt: unknown): string {
  const date = toDate(updatedAt)
  if (!date) return "-"

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60_000) return "just now"

  const minutes = Math.floor(diffMs / 60_000)
  return `${minutes} minutes ago`
}

export default function TrackPage() {
  const router = useRouter()

  const authStatus = useAuthStore((s) => s.authStatus)
  const user = useAuthStore((s) => s.user)

  const [recenterNonce, setRecenterNonce] = useState(0)

  const {
    connectionStatus,
    error,
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
    const lastUpdatedText = formatLastUpdated(blindUserLocation?.updatedAt)

    return {
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      sos: typeof sos === "boolean" ? sos : null,
      lastUpdatedText,
    }
  }, [blindUserLocation])

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  const canRenderMap =
    locationView.lat !== null &&
    locationView.lng !== null &&
    locationView.sos !== null

  return (
    <div className="relative h-svh w-full overflow-hidden">
      {(locationView.lat !== null &&
    locationView.lng !== null &&
    locationView.sos !== null) ? (
        <div className="absolute inset-0">
          <LiveLocationMap
            lat={locationView.lat}
            lng={locationView.lng}
            recenterNonce={recenterNonce}
          />
        </div>
      ) : null}

      <div className="absolute left-6 top-6 z-10">
        {locationView.sos !== null ? (
          <SafetyStatusCard sos={locationView.sos} lastUpdatedText={locationView.lastUpdatedText} />
        ) : (
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            No location data available
          </div>
        )}
      </div>

      <div className="absolute right-6 top-6 z-10">
        <Button variant="outline" type="button" onClick={() => router.push("/")}
        >
          Home
        </Button>
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <Button
          type="button"
          disabled={!canRenderMap}
          onClick={() => setRecenterNonce((n) => n + 1)}
        >
          Recenter to blind
        </Button>
      </div>

      {error || connectionStatus === "no-link" || !canRenderMap ? (
        <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center px-6">
          <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
            {error
              ? error
              : connectionStatus === "no-link"
                ? "No linked blind user found"
                : "No location data available"}
          </div>
        </div>
      ) : null}
    </div>
  )
}
