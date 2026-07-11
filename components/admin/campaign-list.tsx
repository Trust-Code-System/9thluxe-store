"use client";

import * as React from "react";
import { Edit, Trash2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Campaign {
  id: string;
  subject: string;
  status: "DRAFT" | "SCHEDULED" | "SENT";
  createdAt: string;
  sentAt?: string | null;
  html: string;
  text?: string | null;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onRefresh: () => void;
  onEdit?: (campaign: Campaign) => void;
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-info/15 text-info",
  SENT: "bg-success/15 text-success",
};

export function CampaignList({
  campaigns,
  onRefresh,
  onEdit,
}: CampaignListProps) {
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Campaign deleted");
        onRefresh();
      } else {
        toast.error(data.error || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("Delete campaign error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = (campaign: Campaign) => {
    if (onEdit) {
      onEdit(campaign);
      toast.success("Campaign loaded for editing");
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p>No campaigns yet. Create your first newsletter campaign!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{campaign.subject}</h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[campaign.status]}`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                  {campaign.sentAt &&
                    ` • Sent ${new Date(campaign.sentAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex gap-2">
                {campaign.status === "DRAFT" && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(campaign)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(campaign)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(campaign.id)}
                  disabled={deleting === campaign.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deleting === campaign.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
