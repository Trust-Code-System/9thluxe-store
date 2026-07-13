/**
 * Client-side auth gate. Returns true when a session exists; otherwise
 * redirects to sign-in with a return URL and returns false.
 */
export async function ensureSignedIn(callbackPath?: string): Promise<boolean> {
  const fallback =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/"
  const callbackUrl = encodeURIComponent(callbackPath || fallback)

  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    })
    if (res.ok) {
      const session = await res.json()
      if (session?.user) return true
    }
  } catch {
    // Treat network errors as signed-out and send them to sign-in.
  }

  window.location.assign(`/auth/signin?callbackUrl=${callbackUrl}`)
  return false
}
