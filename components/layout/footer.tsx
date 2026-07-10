"use client"

import * as React from "react"

import Link from "next/link"

import { Shield, Truck, RotateCcw, BadgeCheck } from "lucide-react"

import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"

import { toast } from "sonner"

import { SocialLinks } from "@/components/footer/SocialLinks"



const shopLinks = [
  { name: "Perfumes", href: "/category/perfumes" },
  { name: "Collections", href: "/collections" },
  { name: "Limited Drops", href: "/drops" },
  { name: "The Journal", href: "/journal" },
]



const helpLinks = [

  { name: "FAQ", href: "/help/faq" },

  { name: "Contact Us", href: "/help/contact" },

  { name: "Returns & Exchanges", href: "/help/returns" },

  { name: "Shipping Info", href: "/help/shipping" },

]






export function Footer() {

  const [email, setEmail] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)



  const handleNewsletterSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    if (!email || !email.includes("@")) {

      toast.error("Invalid email", {

        description: "Please enter a valid email address.",

      })

      return

    }



    setIsSubmitting(true)

    try {

      const response = await fetch("/api/newsletter/subscribe", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({ email }),

      })



      const data = await response.json()



      if (!response.ok) {

        throw new Error(data.error || "Failed to subscribe")

      }



      if (data.alreadySubscribed) {

        toast.info("Already subscribed", {

          description: "You're already subscribed to our newsletter!",

        })

      } else {

        toast.success("Subscribed successfully!", {

          description: "Thank you for subscribing. You'll receive our latest updates and exclusive offers.",

        })

      }

      setEmail("")

    } catch (error: any) {

      toast.error("Subscription failed", {

        description: error.message || "Please try again later.",

      })

    } finally {

      setIsSubmitting(false)

    }

  }



  const trustStrip = [
    { icon: Shield, label: "Secure payment", detail: "SSL & Paystack" },
    { icon: Truck, label: "Free shipping", detail: "On orders over ₦500,000" },
    { icon: RotateCcw, label: "Easy returns", detail: "7-day comfort policy" },
    { icon: BadgeCheck, label: "Authenticity", detail: "100% genuine" },
  ]

  return (

    <footer className="bg-card border-t border-border">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Trust strip - e-commerce best practice: reassurance site-wide */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12 pb-8 border-b border-border">
          {trustStrip.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand Column */}

          <div className="lg:col-span-1">

            <Link href="/" className="font-serif text-2xl font-semibold">

              Fádé

            </Link>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">

              Curated luxury perfumes. We bring you the finest selection of premium fragrances

              for the discerning individual.

            </p>

          </div>



          {/* Shop Links */}

          <div>

            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h3>

            <ul className="space-y-3">

              {shopLinks.map((link) => (

                <li key={link.name}>

                  <Link

                    href={link.href}

                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"

                  >

                    {link.name}

                  </Link>

                </li>

              ))}

            </ul>

          </div>



          {/* Help Links */}

          <div>

            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Help</h3>

            <ul className="space-y-3">

              {helpLinks.map((link) => (

                <li key={link.name}>

                  <Link

                    href={link.href}

                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"

                  >

                    {link.name}

                  </Link>

                </li>

              ))}

            </ul>

          </div>



          {/* Newsletter */}

          <div className="min-w-0">

            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h3>

            <p className="text-sm text-muted-foreground mb-4">Subscribe for exclusive offers and new arrivals.</p>

            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 min-w-0 w-full">

              <Input

                type="email"

                placeholder="Your email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                required

                disabled={isSubmitting}

                className="flex-1 min-w-0 h-10 px-4 sm:px-6"

              />

              <Button type="submit" size="sm" className="h-10 px-3 sm:px-4 shrink-0" disabled={isSubmitting}>

                {isSubmitting ? (

                  <span>...</span>

                ) : (

                  <>

                    <span className="hidden sm:inline">Subscribe</span>

                    <span className="sm:hidden">Join</span>

                  </>

                )}

              </Button>

            </form>

          </div>

        </div>



        {/* Bottom Section */}

        <div className="mt-12 pt-8 border-t border-border">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Social Links */}

            <SocialLinks />



            {/* Copyright */}

            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Fádé. All rights reserved.</p>

          </div>

        </div>

      </div>

    </footer>

  )

}
