// app/api/auth/sso/route.ts

import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  const { error } = await supabase.auth.signInWithSSO({
    domain: "appsflyer.com" // Your Okta domain or other configured domain
  })

  if (error) {
    console.error("Error during SSO login:", error.message)
    return NextResponse.redirect(`/login?message=${error.message}`)
  }

  return NextResponse.redirect("/")
}