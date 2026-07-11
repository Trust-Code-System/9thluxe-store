import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { PdpPolicy } from "@/lib/pdp/policy"

/**
 * Delivery, returns & purchasing FAQ. Reads from the SINGLE policy source (`lib/pdp/policy.ts`) so it
 * can never contradict the near-cart summary. The same `faqs` array powers the FAQPage structured
 * data, so the JSON-LD only ever contains questions that are visibly present here.
 */
export function DeliveryReturnsFaq({ policy }: { policy: PdpPolicy }) {
  return (
    <Accordion type="single" collapsible className="max-w-2xl">
      {policy.faqs.map((faq, i) => (
        <AccordionItem key={faq.q} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
