import { LandingHero } from "@/components/landing/landing-hero"
import { LandingCTA } from "@/components/landing/landing-cta"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-8 px-4 py-24 md:py-32 lg:py-40">
          <LandingHero />
          <LandingCTA />
        </section>
      </main>
    </div>
  )
}
