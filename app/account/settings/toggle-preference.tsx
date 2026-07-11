"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type TogglePreferenceProps = {
  title: string
  description: string
  enabled: boolean
  disabled?: boolean
  email: string
  type?: 'email' | 'sms'
}

export function TogglePreference({ title, description, enabled, disabled, email: _email, type = 'email' }: TogglePreferenceProps) {
  const [isChecked, setIsChecked] = useState(enabled)
  const router = useRouter()

  // Update local state when enabled prop changes (after router.refresh)
  useEffect(() => {
    setIsChecked(enabled)
  }, [enabled])

  const handleToggle = async () => {
    if (disabled) return
    
    const newValue = !isChecked
    // Optimistically update UI
    setIsChecked(newValue)
    
    try {
      const endpoint = type === 'sms' ? '/api/settings/toggle-sms' : '/api/settings/toggle-email'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      })
      
      if (response.ok) {
        // Refresh to get the latest data from server
        router.refresh()
      } else {
        // Revert on error
        setIsChecked(!newValue)
      }
    } catch (error) {
      // Revert on error
      setIsChecked(!newValue)
      console.error('Failed to update preference:', error)
    }
  }

  return (
    <div className={`flex items-center gap-4 px-6 py-5 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isChecked}
        disabled={disabled}
        className={`flex h-5 w-9 items-center rounded-full border transition ${
          isChecked ? "justify-end border-foreground bg-foreground" : "justify-start border-border bg-muted"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-foreground/80"}`}
      >
        <span className="mx-1 inline-block h-3.5 w-3.5 rounded-full bg-background shadow" />
      </button>
    </div>
  )
}
