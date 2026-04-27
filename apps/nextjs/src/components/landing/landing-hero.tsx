import { APP_NAME } from "@/lib/constants"

export function LandingHero() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
        Welcome to {APP_NAME}
      </h1>
      <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
        Empowering independence through innovative technology. 
        Connecting families with their loved ones for enhanced safety and peace of mind.
      </p>
    </div>
  )
}
