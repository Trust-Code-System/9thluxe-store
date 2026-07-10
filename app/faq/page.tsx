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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mb-10">
            Can't find what you're looking for?{" "}
            <a href="/help/contact" className="text-primary underline underline-offset-2 hover:opacity-80">
              Contact us
            </a>{" "}
            and we'll be happy to help.
          </p>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </MainLayout>
  )
}
