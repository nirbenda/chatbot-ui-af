import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error.message)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?message=${encodeURIComponent(error.message)}`
      )
    }
  }

  return NextResponse.redirect(
    next ? requestUrl.origin + next : requestUrl.origin
  )
}
