import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { ConciergeClient } from "@/components/concierge/concierge-client"

export const metadata: Metadata = {
  title: "AI Scent Concierge",
  description:
    "Describe the mood, occasion and notes you love, and the Fádé Scent Concierge recommends real, in-stock fragrances from our catalogue.",
}

export default function ConciergePage() {
  return (
    <MainLayout hideFooter>
      <ConciergeClient />
    </MainLayout>
  )
}
