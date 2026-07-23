export function normalizeRedirectSource(value: unknown): string | null {
  if (typeof value !== "string") return null
  const source = value.trim()
  if (!source.startsWith("/") || source.startsWith("//") || source.includes("?") || source.includes("#")) return null
  return source.length > 1 ? source.replace(/\/$/, "") : source
}

export function normalizeRedirectDestination(value: unknown): string | null {
  if (typeof value !== "string") return null
  const destination = value.trim()
  if (destination.startsWith("/") && !destination.startsWith("//")) return destination
  try { const url = new URL(destination); return url.protocol === "http:" || url.protocol === "https:" ? destination : null } catch { return null }
}
