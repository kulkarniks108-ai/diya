"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { MapPin, User } from "lucide-react"

export function FamilyTabs() {
  const pathname = usePathname()

  const tabs = [
    { href: "/track", label: "Safety", icon: MapPin },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <Card className="pointer-events-auto w-full max-w-sm rounded-2xl p-2">
        <div className="grid grid-cols-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
