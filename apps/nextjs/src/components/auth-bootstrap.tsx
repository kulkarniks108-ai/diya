"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth"

export function AuthBootstrap() {
  const listenToAuthChanges = useAuthStore((s) => s.listenToAuthChanges)

  useEffect(() => {
    listenToAuthChanges()
  }, [listenToAuthChanges])

  return null
}
