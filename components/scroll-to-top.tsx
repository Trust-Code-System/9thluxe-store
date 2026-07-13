"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useLayoutEffect } from "react"

/**
 * Always land at the top on route (and query) changes.
 * Soft navigations can otherwise keep the previous page's scroll offset,
 * which often leaves you at the footer of the next page.
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    const reset = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    reset()

    const frame = requestAnimationFrame(reset)
    const timeout = window.setTimeout(reset, 50)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [pathname, search])

  return null
}
