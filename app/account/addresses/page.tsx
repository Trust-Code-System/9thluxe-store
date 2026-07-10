import { Plus, MapPin, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAddressesByUserId } from "@/lib/queries/addresses"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AddressesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const addresses = await getAddressesByUserId(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved Addresses</h2>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <Card key={address.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{session.user.name || "User"}</span>
                </div>
                {address.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>{address.line1}</p>
                <p>
                  {address.city}, {address.state}
                </p>
                <p>{address.phone}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {!address.isDefault && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
