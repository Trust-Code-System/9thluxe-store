"use client"



import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"



interface QuantitySelectorProps {

  value: number

  onChange: (value: number) => void

  min?: number

  max?: number

  className?: string

}



export function QuantitySelector({ value, onChange, min = 1, max = 99, className }: QuantitySelectorProps) {

  const decrement = () => {

    if (value > min) {

      onChange(value - 1)

    }

  }



  const increment = () => {

    if (value < max) {

      onChange(value + 1)

    }

  }



  return (

    <div className={cn("flex items-center gap-1", className)}>

      <Button

        type="button"

        variant="outline"

        size="icon"

        className="h-9 w-9 bg-transparent"

        onClick={decrement}

        disabled={value <= min}

      >

        <Minus className="h-4 w-4" />

        <span className="sr-only">Decrease quantity</span>

      </Button>

      <div className="w-12 text-center font-medium tabular-nums">{value}</div>

      <Button

        type="button"

        variant="outline"

        size="icon"

        className="h-9 w-9 bg-transparent"

        onClick={increment}

        disabled={value >= max}

      >

        <Plus className="h-4 w-4" />

        <span className="sr-only">Increase quantity</span>

      </Button>

    </div>

  )

}





