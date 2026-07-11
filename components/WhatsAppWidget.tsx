"use client"

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'

export function WhatsAppWidget() {
  const [isVisible, _setIsVisible] = useState(true)

  if (!isVisible) return null

  const whatsappNumber = '2348160591348' // Replace with your WhatsApp number
  const message = 'Hello! I need help with my order.'

  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[var(--z-sticky)] flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:scale-110 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </button>
  )
}



