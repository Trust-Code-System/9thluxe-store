"use client"

import * as React from "react"

import { useRouter } from "next/navigation"

import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Checkbox } from "@/components/ui/checkbox"

import { toast } from "sonner"

import { signUpAction } from "@/app/auth/signup/actions"



export function SignUpForm() {

  const _router = useRouter()

  const [showPassword, setShowPassword] = React.useState(false)

  const [isLoading, setIsLoading] = React.useState(false)

  const [firstName, setFirstName] = React.useState("")

  const [lastName, setLastName] = React.useState("")

  const [email, setEmail] = React.useState("")

  const [password, setPassword] = React.useState("")



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault()

    setIsLoading(true)



    const formData = new FormData(e.currentTarget)

    const result = await signUpAction(formData)



    if (result?.error) {

      toast.error("Failed to create account", {

        description: result.error === "Email already registered"

          ? "An account with this email already exists. Please sign in instead."

          : result.error,

      })

      setIsLoading(false)

    } else {

      // Success - the server action will redirect

      toast.success("Account created successfully", {

        description: "Welcome to Fádé!",

      })

    }

  }



  return (

    <Card>

      <CardContent className="pt-6">

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="firstName">First Name</Label>

              <Input

                id="firstName"

                name="firstName"

                placeholder="John"

                value={firstName}

                onChange={(e) => setFirstName(e.target.value)}

                required

                disabled={isLoading}

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="lastName">Last Name</Label>

              <Input

                id="lastName"

                name="lastName"

                placeholder="Doe"

                value={lastName}

                onChange={(e) => setLastName(e.target.value)}

                required

                disabled={isLoading}

              />

            </div>

          </div>



          <div className="space-y-2">

            <Label htmlFor="email">Email</Label>

            <Input

              id="email"

              name="email"

              type="email"

              placeholder="you@example.com"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              required

              disabled={isLoading}

            />

          </div>



          <div className="space-y-2">

            <Label htmlFor="password">Password</Label>

            <div className="relative">

              <Input

                id="password"

                name="password"

                type={showPassword ? "text" : "password"}

                placeholder="Create a password"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                required

                minLength={8}

                disabled={isLoading}

              />

              <Button

                type="button"

                variant="ghost"

                size="icon"

                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"

                onClick={() => setShowPassword(!showPassword)}

              >

                {showPassword ? (

                  <EyeOff className="h-4 w-4 text-muted-foreground" />

                ) : (

                  <Eye className="h-4 w-4 text-muted-foreground" />

                )}

                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>

              </Button>

            </div>

            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>

          </div>



          <div className="flex items-start space-x-2">

            <Checkbox id="terms" className="mt-1" required />

            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">

              I agree to the{" "}

              <a href="/terms" className="text-primary hover:underline">

                Terms of Service

              </a>{" "}

              and{" "}

              <a href="/privacy" className="text-primary hover:underline">

                Privacy Policy

              </a>

            </Label>

          </div>



          <Button type="submit" className="w-full h-11" disabled={isLoading}>

            {isLoading ? "Creating account..." : "Create account"}

          </Button>

        </form>

      </CardContent>

    </Card>

  )

}
