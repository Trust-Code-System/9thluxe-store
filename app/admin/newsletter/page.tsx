"use client"

import * as React from "react"
import { TrendingUp, Users, Plus, X } from "lucide-react"
import { NewsletterEditor } from "@/components/admin/newsletter-editor"
import { CampaignList } from "@/components/admin/campaign-list"
import { SubscriberList } from "@/components/admin/subscriber-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = React.useState(0)
  const [totalUsers, setTotalUsers] = React.useState(0)
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  const [_loading, setLoading] = React.useState(true)
  const [editingCampaign, setEditingCampaign] = React.useState<any | null>(null)
  const [showEditor, setShowEditor] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [subsRes, campaignsRes] = await Promise.all([
        fetch("/api/admin/newsletter/subscribers?limit=1"),
        fetch("/api/admin/newsletter/campaigns"),
      ])

      const subsData = await subsRes.json()
      const campaignsData = await campaignsRes.json()

      if (subsRes.ok) setSubscribers(subsData.total || 0)
      if (campaignsRes.ok) setCampaigns(campaignsData.campaigns || [])

      // Get total users - we'll calculate from subscribers for now
      // In a real app, you'd have a separate endpoint for this
      setTotalUsers(subscribers) // Placeholder - replace with actual user count endpoint
    } catch (error) {
      console.error("Fetch data error:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNewCampaign = () => {
    setEditingCampaign(null)
    setShowEditor(true)
  }

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign)
    setShowEditor(true)
  }

  const handleEditorClose = () => {
    setShowEditor(false)
    setEditingCampaign(null)
    fetchData()
  }

  const stats = [
    {
      title: "Newsletter subscribers",
      value: subscribers,
      icon: Users,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      description: "Marketing opted-in customers",
    },
    {
      title: "Total users",
      value: totalUsers,
      icon: Users,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      description: "Registered accounts",
    },
    {
      title: "Subscriber rate",
      value: totalUsers > 0 ? `${Math.round((subscribers / totalUsers) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      description: "Share of users opted in",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Newsletter Management</h1>
          <p className="text-muted-foreground mt-1">Create campaigns and manage subscribers</p>
        </div>
        {!showEditor && (
          <Button onClick={handleNewCampaign} className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor or Tabs */}
      {showEditor ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleEditorClose} className="gap-2">
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          <NewsletterEditor
            subscriberCount={subscribers}
            campaignId={editingCampaign?.id}
            initialData={editingCampaign}
            onSave={handleEditorClose}
          />
        </div>
      ) : (
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <CampaignList campaigns={campaigns} onRefresh={fetchData} onEdit={handleEditCampaign} />
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <SubscriberList />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
