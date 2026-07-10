"use client"



import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Switch } from "@/components/ui/switch"



export default function SettingsPage() {

  return (

    <div className="space-y-6">

      {/* Profile Settings */}

      <Card>

        <CardHeader>

          <CardTitle className="text-lg">Profile Information</CardTitle>

          <CardDescription>Update your personal details</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="firstName">First Name</Label>

              <Input id="firstName" defaultValue="John" />

            </div>

            <div className="space-y-2">

              <Label htmlFor="lastName">Last Name</Label>

              <Input id="lastName" defaultValue="Doe" />

            </div>

          </div>

          <div className="space-y-2">

            <Label htmlFor="email">Email</Label>

            <Input id="email" type="email" defaultValue="john@example.com" />

          </div>

          <div className="space-y-2">

            <Label htmlFor="phone">Phone</Label>

            <Input id="phone" type="tel" defaultValue="+234 800 000 0000" />

          </div>

          <Button>Save Changes</Button>

        </CardContent>

      </Card>



      {/* Notification Preferences */}

      <Card>

        <CardHeader>

          <CardTitle className="text-lg">Notifications</CardTitle>

          <CardDescription>Manage your notification preferences</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="font-medium">Order Updates</p>

              <p className="text-sm text-muted-foreground">Receive updates about your orders</p>

            </div>

            <Switch defaultChecked />

          </div>

          <div className="flex items-center justify-between">

            <div>

              <p className="font-medium">Promotional Emails</p>

              <p className="text-sm text-muted-foreground">Receive emails about new products and offers</p>

            </div>

            <Switch defaultChecked />

          </div>

          <div className="flex items-center justify-between">

            <div>

              <p className="font-medium">Wishlist Alerts</p>

              <p className="text-sm text-muted-foreground">Get notified when wishlist items go on sale</p>

            </div>

            <Switch />

          </div>

        </CardContent>

      </Card>

    </div>

  )

}
