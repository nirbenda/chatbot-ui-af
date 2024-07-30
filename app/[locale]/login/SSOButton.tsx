"use client"

import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const SSOButton = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleSSOCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error("Error setting session:", error.message)
            return router.push(`/login?message=${error.message}`)
          }

          const session = data.session
          if (!session) {
            setLoading(false)
            return
          }

          const user = session.user

          // Fetch the user's profile
          let { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (profileError && profileError.code === "PGRST116") {
            // Profile does not exist, create a new one
            const newProfile = {
              bio: "",
              display_name: user.email,
              image_path: "",
              image_url: "",
              profile_context: "",
              use_azure_openai: false,
              user_id: user.id,
              username: user.email.split("@")[0],
              has_onboarded: false
            }

            const { data: createdProfile, error: createProfileError } =
              await supabase
                .from("profiles")
                .insert([newProfile])
                .select("*")
                .single()

            if (createProfileError) {
              console.error(
                "Error creating profile:",
                createProfileError.message
              )
              return router.push(`/login?message=${createProfileError.message}`)
            }

            profile = createdProfile
          } else if (profileError) {
            console.error("Error fetching profile:", profileError.message)
            return router.push(`/login?message=${profileError.message}`)
          }

          // Fetch the user's workspaces
          const { data: workspaces, error: workspacesError } = await supabase
            .from("workspaces")
            .select("*")
            .eq("user_id", user.id)

          if (workspacesError) {
            console.error("Error fetching workspaces:", workspacesError.message)
            return router.push(`/login?message=${workspacesError.message}`)
          }

          if (workspaces.length === 0) {
            // No workspaces found, create a default workspace
            const newWorkspace = {
              user_id: user.id,
              name: "Home",
              description: "This is your default workspace.",
              default_context_length: 4000,
              default_model: "gpt-4o",
              default_prompt: "You are an assistant.",
              default_temperature: 0.5,
              include_profile_context: true,
              include_workspace_instructions: true,
              instructions:
                "These are the default instructions for your workspace.",
              is_home: true,
              sharing: "private",
              embeddings_provider: "openai"
            }

            const { data: createdWorkspace, error: createWorkspaceError } =
              await supabase
                .from("workspaces")
                .insert([newWorkspace])
                .select("*")
                .single()

            if (createWorkspaceError) {
              console.error(
                "Error creating workspace:",
                createWorkspaceError.message
              )
              return router.push(
                `/login?message=${createWorkspaceError.message}`
              )
            }

            return router.push(`/setup`)
          } else {
            // Redirect to the home workspace
            const homeWorkspace = workspaces.find(ws => ws.is_home)
            if (homeWorkspace) {
              return window.location.assign(`/${homeWorkspace.id}/chat`)
              return router.push(`/${homeWorkspace.id}/chat`)
            } else {
              // If no home workspace found, create one
              const newHomeWorkspace = {
                user_id: user.id,
                name: "Home",
                description: "This is your default workspace.",
                default_context_length: 4000,
                default_model: "gpt-4o",
                default_prompt: "You are an assistant.",
                default_temperature: 0.5,
                include_profile_context: true,
                include_workspace_instructions: true,
                instructions:
                  "These are the default instructions for your workspace.",
                is_home: true,
                sharing: "private",
                embeddings_provider: "openai"
              }

              const {
                data: createdHomeWorkspace,
                error: createHomeWorkspaceError
              } = await supabase
                .from("workspaces")
                .insert([newHomeWorkspace])
                .select("*")
                .single()

              if (createHomeWorkspaceError) {
                console.error(
                  "Error creating home workspace:",
                  createHomeWorkspaceError.message
                )
                return router.push(
                  `/login?message=${createHomeWorkspaceError.message}`
                )
              }

              return window.location.assign(`/${homeWorkspace.id}/chat`)
              return router.push(`/${createdHomeWorkspace.id}/chat`)
            }
          }
        } catch (error) {
          console.error("Unexpected error during SSO callback:", error)
          return router.push(`/login?message=${error.message}`)
        }
      } else {
        setLoading(false)
      }
    }

    handleSSOCallback()
  }, [])

  const handleSSOLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: "appsflyer.okta.com"
      })

      if (error) {
        console.error("Error during SSO login:", error.message)
        return router.push(`/login?message=${error.message}`)
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Unexpected error during SSO login:", error)
      return router.push(`/login?message=${error.message}`)
    }
  }

  return (
    <button
      onClick={handleSSOLogin}
      className="mt-4 w-full rounded-md bg-blue-700 px-4 py-2 text-white"
    >
      Login with SSO
    </button>
  )
}

export default SSOButton
