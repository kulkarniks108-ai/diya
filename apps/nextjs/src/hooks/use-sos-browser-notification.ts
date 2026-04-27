"use client"

import { getBooleanPreference } from "@/lib/preferences"
import { sendBrowserNotification } from "@/services/browser-notifications"
import { useEffect, useRef } from "react"

type SosNotificationInput = {
  sos: boolean | null
  lastUpdatedText: string
}

export function useSosBrowserNotification({
  sos,
  lastUpdatedText,
}: SosNotificationInput) {
  const didInitRef = useRef(false)
  const prevSosRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!didInitRef.current) {
      prevSosRef.current = sos
      didInitRef.current = true
      return
    }

    const prev = prevSosRef.current
    prevSosRef.current = sos

    if (sos !== true) return
    if (prev === true) return

    const sosAlertsEnabled = getBooleanPreference("sosAlerts", true)
    if (!sosAlertsEnabled) return

    sendBrowserNotification("SOS Alert", {
      body: `Emergency active. Last updated ${lastUpdatedText}.`,
      tag: "sos-alert",
    })
  }, [lastUpdatedText, sos])
}
