"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth"
import { useFamilyStore } from "@/store/family"
import { getBooleanPreference, setBooleanPreference } from "@/lib/preferences"
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/services/browser-notifications"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Bell, Link2, LogOut, User, HelpCircle, FileText } from "lucide-react"
import { FamilyTabs } from "@/components/family-tabs"
import { toast } from "sonner"

function getStatusVariant(status: string, linked: boolean) {
  if (!linked) return { variant: "secondary" as const, label: "NOT LINKED" }
  if (status === "connected") return { variant: "default" as const, label: "CONNECTED" }
  if (status === "searching") return { variant: "secondary" as const, label: "SEARCHING" }
  if (status === "no-link") return { variant: "secondary" as const, label: "NO LINK" }
  return { variant: "destructive" as const, label: "ERROR" }
}

export default function ProfilePage() {
  const router = useRouter()

  const authStatus = useAuthStore((s) => s.authStatus)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const {
    linkedBlindUserId,
    connectionStatus,
    findLinkedBlindUser,
    unsubscribeLiveStatus,
  } = useFamilyStore()

  const [sosAlerts, setSosAlerts] = useState(() => getBooleanPreference("sosAlerts", true))
  const [locationUpdates, setLocationUpdates] = useState(() =>
    getBooleanPreference("locationUpdates", true),
  )

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

  useEffect(() => {
    setBooleanPreference("sosAlerts", sosAlerts)
  }, [sosAlerts])

  useEffect(() => {
    setBooleanPreference("locationUpdates", locationUpdates)
  }, [locationUpdates])

  const statusChip = useMemo(() => {
    const linked = Boolean(linkedBlindUserId)
    return getStatusVariant(connectionStatus, linked)
  }, [connectionStatus, linkedBlindUserId])

  const onLogout = async () => {
    unsubscribeLiveStatus()
    await logout()
    router.replace("/login")
  }

  const onToggleSosAlerts = async (checked: boolean) => {
    if (!checked) {
      setSosAlerts(false)
      return
    }

    if (!isNotificationSupported()) {
      toast.error("Notifications are not supported in this browser.")
      setSosAlerts(false)
      return
    }

    const currentPermission = getNotificationPermission()
    if (currentPermission === "denied") {
      toast.error("Notifications are blocked. Enable them in browser settings.")
      setSosAlerts(false)
      return
    }

    if (currentPermission === "granted") {
      setSosAlerts(true)
      return
    }

    const requested = await requestNotificationPermission()
    if (requested === "granted") {
      toast.success("SOS notifications enabled.")
      setSosAlerts(true)
      return
    }

    toast.error("Notification permission not granted.")
    setSosAlerts(false)
  }

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh bg-muted/30">
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-xl bg-muted p-2">
                <User className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Email</div>
                <div className="mt-1 text-base font-medium">{user?.email ?? "-"}</div>

                <div className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Role</div>
                <Badge className="mt-1 w-fit" variant="secondary">
                  Family Member
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-xl bg-muted p-2">
                <Link2 className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={statusChip.variant}>{statusChip.label}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-muted-foreground">Linked Account</div>
                  <div className="text-xs font-mono text-foreground">
                    {linkedBlindUserId ? `ID: ${linkedBlindUserId.slice(0, 8)}...` : "No account linked"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-xl bg-muted p-2">
                <Bell className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="sos-alerts" className="text-base font-medium">
                    SOS Alerts
                  </Label>
                  <div className="text-xs text-muted-foreground">Receive critical alerts immediately</div>
                </div>
                <Switch
                  id="sos-alerts"
                  checked={sosAlerts}
                  onCheckedChange={(checked) => {
                    void onToggleSosAlerts(Boolean(checked))
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="location-updates" className="text-base font-medium">
                    Location Updates
                  </Label>
                  <div className="text-xs text-muted-foreground">Get notified when tracking starts</div>
                </div>
                <Switch
                  id="location-updates"
                  checked={locationUpdates}
                  onCheckedChange={(checked) => setLocationUpdates(Boolean(checked))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted"
                onClick={() => {}}
              >
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Help & Support
                </span>
                <span className="text-muted-foreground">›</span>
              </button>
              <Separator />
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted"
                onClick={() => {}}
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Terms of Service
                </span>
                <span className="text-muted-foreground">›</span>
              </button>
            </CardContent>
          </Card>

          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>

          <p className="text-center text-xs text-muted-foreground">Version 1.0.0 • 2ndEye</p>
        </div>
      </div>

      <FamilyTabs />
    </div>
  )
}
