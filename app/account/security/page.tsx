"use client"



import * as React from "react"

import { Eye, EyeOff } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"



export default function SecurityPage() {

  const [showPasswords, setShowPasswords] = React.useState(false)



  return (

    <div className="space-y-6">

      {/* Change Password */}

      <Card>

        <CardHeader>

          <CardTitle className="text-lg">Change Password</CardTitle>

          <CardDescription>Update your password to keep your account secure</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">

            <Label htmlFor="currentPassword">Current Password</Label>

            <div className="relative">

              <Input id="currentPassword" type={showPasswords ? "text" : "password"} />

              <Button

                type="button"

                variant="ghost"

                size="icon"

                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"

                onClick={() => setShowPasswords(!showPasswords)}

              >

                {showPasswords ? (

                  <EyeOff className="h-4 w-4 text-muted-foreground" />

                ) : (

                  <Eye className="h-4 w-4 text-muted-foreground" />

                )}

              </Button>

            </div>

          </div>

          <div className="space-y-2">

            <Label htmlFor="newPassword">New Password</Label>

            <Input id="newPassword" type={showPasswords ? "text" : "password"} />

          </div>

          <div className="space-y-2">

            <Label htmlFor="confirmPassword">Confirm New Password</Label>

            <Input id="confirmPassword" type={showPasswords ? "text" : "password"} />

          </div>

          <Button>Update Password</Button>

        </CardContent>

      </Card>



      {/* Danger Zone */}

      <Card className="border-destructive/50">

        <CardHeader>

          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>

          <CardDescription>Irreversible account actions</CardDescription>

        </CardHeader>

        <CardContent>

          <div className="flex items-center justify-between">

            <div>

              <p className="font-medium">Delete Account</p>

              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>

            </div>

            <Button variant="destructive">Delete Account</Button>

          </div>

        </CardContent>

      </Card>

    </div>

  )

}
