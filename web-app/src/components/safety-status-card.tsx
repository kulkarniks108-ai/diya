import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, ShieldAlert } from "lucide-react"

interface SafetyStatusCardProps {
  sos: boolean
  lastUpdatedText: string
}

export function SafetyStatusCard({ sos, lastUpdatedText }: SafetyStatusCardProps) {
  return (
    <Card className="w-[22rem] max-w-[calc(100vw-3rem)]">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5">
          {sos ? (
            <ShieldAlert className="h-5 w-5 text-destructive" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <div className="text-base font-semibold">Safety Status</div>
          <div className={sos ? "text-sm font-medium text-destructive" : "text-sm font-medium"}>
            {sos ? "Emergency active" : "No active emergency"}
          </div>
          <div className="text-xs text-muted-foreground">Last updated {lastUpdatedText}</div>
        </div>
      </CardContent>
    </Card>
  )
}
