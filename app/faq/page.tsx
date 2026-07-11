import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ | Fádé Essence",
  description: "Frequently asked questions about ordering, delivery, payments, and returns at Fádé Essence.",
}

const faqs = [
  {
    question: "Do you deliver nationwide?",
    answer: "Yes, we deliver to all 36 states and the FCT. Standard delivery takes 3–5 business days and express delivery takes 1–2 business days.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept debit/credit cards, bank transfers, and USSD channels securely via Paystack. All transactions are encrypted and protected.",
  },
  {
    question: "How long does delivery take?",
    answer: "Standard delivery: 3–5 business days across Nigeria. Express delivery: 1–2 business days, available at checkout for an additional fee.",
  },
  {
    question: "Are all products authentic?",
    answer: "Absolutely. Every product in our collection is 100% authentic. We source directly from authorised distributors and brand partners, so you can shop with confidence.",
  },
  {
    question: "Can I return or exchange an item?",
    answer: "We accept returns within 7 days of delivery for items that are unopened, unused, and in their original packaging. Please contact us at fadeessencee@gmail.com to initiate a return.",
  },
  {
    question: "How do I track my order?",
    answer: "Once your order ships, you will receive an email with tracking information. You can also view your order status in your account dashboard under Order History.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Yes! You can request premium gift wrapping at checkout. Add a personalised message and we'll make sure your gift arrives beautifully presented.",
  },
  {
    question: "How do I apply a discount code?",
    answer: "Enter your discount code in the coupon field on the cart or checkout page and click Apply. The discount will be reflected in your order total before payment.",
  },
  {
    question: "What if my item arrives damaged?",
    answer: "If your order arrives damaged, please take photos immediately and contact us within 48 hours at fadeessencee@gmail.com or +234 8160591348. We will arrange a replacement or refund promptly.",
  },
  {
    question: "Can I change or cancel my order?",
    answer: "Orders can be modified or cancelled within 1 hour of placement. Please contact us as quickly as possible. Once an order has been dispatched it cannot be cancelled.",
  },
]

export default function FAQPage() {
  return (
    <MainLayout>
      <section data-surface="night" className="grain relative bg-background py-14 text-foreground lg:py-20">
        <div className="container relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <span className="eyebrow">Help</span>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">
            Questions, <em className="text-accent">answered</em>
          </h1>
          <p className="mb-12 mt-4 max-w-md leading-relaxed text-muted-foreground">
            Can&apos;t find what you&apos;re looking for?{" "}
            <a
              href="/help/contact"
              className="text-accent underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              Contact us
            </a>{" "}
            and we&apos;ll be happy to help.
          </p>

          <Accordion type="single" collapsible className="border-t border-border">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-border">
                <AccordionTrigger className="gap-6 py-6 text-left font-serif text-lg font-light hover:no-underline hover:text-accent [&>svg]:text-muted-foreground">
                  <span className="flex items-baseline gap-5">
                    <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-10 leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </MainLayout>
  )
}
