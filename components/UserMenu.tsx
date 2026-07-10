import Link from 'next/link'
import { auth } from '@/lib/auth'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function UserMenu() {
  const session = await auth()
  if (!session) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
        <Link href="/auth/signin">
          <User className="h-4 w-4" />
          <span className="sr-only">Sign in</span>
        </Link>
      </Button>
    )
  }
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
      <Link href="/account">
        <User className="h-4 w-4" />
        <span className="sr-only">My account</span>
      </Link>
    </Button>
  )
}
