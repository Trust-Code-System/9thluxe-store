"use client"



import * as React from "react"

import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"



interface NewsletterFormProps {

  className?: string

  variant?: "default" | "inline"

}



export function NewsletterForm({ className, variant = "default" }: NewsletterFormProps) {

  const [email, setEmail] = React.useState("")

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    setStatus("loading")

    // Simulate API call

    setTimeout(() => {

      setStatus("success")

      setEmail("")

    }, 1000)

  }



  if (variant === "inline") {

    return (

      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>

        <Input

          type="email"

          placeholder="Enter your email"

          value={email}

          onChange={(e) => setEmail(e.target.value)}

          required

          className="flex-1 h-11"

          disabled={status === "loading"}

        />

        <Button type="submit" disabled={status === "loading"} className="h-11 px-6">

          {status === "loading" ? "Subscribing..." : "Subscribe"}

        </Button>

      </form>

    )

  }



  return (

    <div className={cn("text-center", className)}>

      {status === "success" ? (

        <div className="py-4">

          <p className="text-primary font-medium">Thank you for subscribing!</p>

          <p className="text-sm text-muted-foreground mt-1">You'll receive our latest updates and exclusive offers.</p>

        </div>

      ) : (

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">

          <Input

            type="email"

            placeholder="Enter your email address"

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            required

            className="flex-1 h-12"

            disabled={status === "loading"}

          />

          <Button type="submit" disabled={status === "loading"} className="h-12 px-8">

            {status === "loading" ? "Subscribing..." : "Subscribe"}

          </Button>

        </form>

      )}

    </div>

  )

}





