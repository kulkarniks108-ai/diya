import { FamilyTabs } from "@/components/family-tabs"
import { FamilyRouteGuard } from "@/components/guards/family-route-guard"

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilyRouteGuard>
      {children}
      <FamilyTabs />
    </FamilyRouteGuard>
  )
}
