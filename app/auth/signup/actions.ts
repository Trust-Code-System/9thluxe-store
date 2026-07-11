"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { toSafeAuthErrorMessage } from "@/lib/prisma-error"

export async function signUpAction(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate inputs
  if (!email || !password || !firstName || !lastName) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  try {
    // Check if user already exists
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return { error: "Email already registered" }
    }

    // Hash password and create user
    const hash = await bcrypt.hash(password, 10)
    const name = `${firstName} ${lastName}`.trim()

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hash,
      },
    })

    // Automatically sign in the new user
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/account",
      })
    } catch (error: any) {
      // NextAuth throws redirect errors, which is expected
      // If it's not a redirect error, re-throw it
      if (!error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error
      }
      // Re-throw redirect errors so Next.js handles them
      throw error
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Sign up error:", error)
    return { error: toSafeAuthErrorMessage(error) }
  }
}

