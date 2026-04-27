import { LandingHero } from "@/components/landing/landing-hero"
import { LandingCTA } from "@/components/landing/landing-cta"
import LandingFeatures from "@/components/landing/landing-features"
import Testimonials from "@/components/landing/landing-testimonials"

export default function LandingPage() {
  return (
    <div className=" min-h-screen min-w-screen flex-col">
      <main className="flex flex-col items-stretch justify-center w-full gap-3">
        <section className=" flex flex-col items-center justify-center gap-8  py-24 md:py-32 lg:py-40 border">
          <LandingHero />
          <LandingCTA />

        </section>
        <section className=" mb-24 border-2 ">
          <LandingFeatures />
        </section>

        <section className=" mb-24 border-2 ">
          <Testimonials />
        </section>
      </main>
    </div>
  )
}
