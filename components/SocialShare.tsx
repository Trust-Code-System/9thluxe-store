"use client"

import { Twitter, Facebook, Copy } from 'lucide-react'
import { useState } from 'react'

interface SocialShareProps {
  productName: string
  productUrl: string
}

export function SocialShare({ productName, productUrl }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `Check out ${productName} on Fàdè!`
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${productUrl}` : productUrl

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`
    window.open(url, '_blank')
  }

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
    window.open(url, '_blank')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      <button
        onClick={shareToTwitter}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </button>
      <button
        onClick={shareToFacebook}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>
      <button
        onClick={copyLink}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
        aria-label="Copy link"
      >
        <Copy className="h-4 w-4" />
        {copied && <span className="absolute -top-8 text-xs text-foreground">Copied!</span>}
      </button>
    </div>
  )
}



