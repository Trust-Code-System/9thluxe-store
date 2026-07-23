import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RETURNS_WINDOW_DAYS } from "@/lib/pdp/policy";
import { ManagedPage } from "@/components/pages/managed-page";
import { getManagedPageMetadata, getPublishedPage } from "@/lib/pages/queries";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: "FAQ | Fádé",
  description: "Frequently asked questions about shopping at Fádé.",
};

export function generateMetadata() { return getManagedPageMetadata("help/faq", fallbackMetadata); }

const faqs = [
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments through Paystack, which supports all major credit and debit cards, bank transfers, and mobile money. All payments are processed securely through Paystack's encrypted payment gateway.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard delivery takes 3-5 business days, while express delivery takes 1-2 business days. Delivery times may vary depending on your location. You'll receive a tracking number once your order ships.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, we ship within Nigeria. We're working on expanding our shipping options to other countries. Please check back soon or contact us for more information.",
  },
  {
    question: "What is your return policy?",
    answer: `We accept eligible returns within ${RETURNS_WINDOW_DAYS} days of delivery when a fragrance is sealed, unused, and in its original packaging. Please contact us within that window to start a return.`,
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you'll receive an email with a tracking number. You can also track your order by logging into your account and viewing your order history.",
  },
  {
    question: "Are your products authentic?",
    answer:
      "Every bottle is inspected and sealed by Fádé before dispatch. Product pages distinguish retailer inspection from manufacturer verification, so you can see the available provenance for each fragrance.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer:
      "Yes, we offer premium gift wrapping services. You can select this option during checkout. Gift wrapping is available for an additional fee.",
  },
  {
    question: "How do I care for my perfume?",
    answer:
      "Store perfumes in a cool, dry place away from direct sunlight to preserve the fragrance. Keep the cap on when not in use and avoid exposing the bottle to extreme temperatures. Most perfumes last 3–5 years when stored properly.",
  },
  {
    question: "Can I cancel or modify my order?",
    answer:
      "You can cancel or modify your order within 1 hour of placing it by contacting our customer service team. Once your order has been processed for shipping, modifications may not be possible.",
  },
  {
    question: "Do you have a physical store?",
    answer:
      "Fádé currently operates online and delivers across Nigeria. Join the Sillage letter for any future service updates.",
  },
];

export default async function FAQPage() {
  const managed = await getPublishedPage("help/faq");
  if (managed) return <ManagedPage page={managed} />;
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[-0.01em] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mb-8">
            Find answers to common questions about shopping at Fádé.
          </p>

          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <AccordionItem
                    value={`item-${index}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <CardHeader className="p-0">
                        <CardTitle className="text-left text-base font-medium">
                          {faq.question}
                        </CardTitle>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
