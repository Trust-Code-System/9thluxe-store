import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { ConciergeClient } from "@/components/concierge/concierge-client"

export const metadata: Metadata = {
  title: "AI Scent Concierge",
  description:
    "Ask Fádé Perfume Intelligence about notes, accords, perfume technique, climate, comparisons, current research, and live catalogue availability.",
}

export default function ConciergePage() {
  return (
    <MainLayout hideFooter>
      <ConciergeClient />
    </MainLayout>
  )
}
