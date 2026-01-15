import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME, APP_STORE_LINKS } from "@/lib/constants"
import { Smartphone, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Register on Mobile</CardTitle>
            <CardDescription>
              To register for {APP_NAME}, please download our mobile application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Registration is currently only available through our mobile app. 
              Download the app to create your account and get started.
            </p>
            <div className="space-y-2">
              <Button className="w-full" size="lg" asChild>
                <Link href={APP_STORE_LINKS.ios} target="_blank" rel="noopener noreferrer">
                  Download on App Store
                </Link>
              </Button>
              <Button className="w-full" size="lg" variant="outline" asChild>
                <Link href={APP_STORE_LINKS.android} target="_blank" rel="noopener noreferrer">
                  Get it on Google Play
                </Link>
              </Button>
            </div>
            <div className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
