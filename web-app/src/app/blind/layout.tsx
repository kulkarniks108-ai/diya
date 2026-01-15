import { BlindRouteGuard } from "@/components/guards/blind-route-guard"

export default function BlindLayout({ children }: { children: React.ReactNode }) {
  return <BlindRouteGuard>{children}</BlindRouteGuard>
}
