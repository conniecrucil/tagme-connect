import * as React from "react"
import { Button } from "./button"
import { cn } from "~/lib/utils"

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  onRemove?: () => void
  min?: number
  max?: number
  className?: string
  id?: string
}

export function QuantityInput({ 
  value, 
  onChange, 
  onRemove,
  min = 1, 
  max = 5, 
  className,
  id,
  ...props 
}: QuantityInputProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  const showRemoveButton = value === min && onRemove

  return (
    <div className={cn("flex items-center bg-background", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={showRemoveButton ? handleRemove : handleDecrement}
        disabled={!showRemoveButton && value <= min}
        className="rounded-r-none border-r-0 h-9 px-3 min-w-[44px] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        aria-label={showRemoveButton ? "Remove item from cart" : "Decrease quantity"}
      >
        {showRemoveButton ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : (
          "−"
        )}
      </Button>
      <input
        id={id}
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="h-9 w-16 text-center border border-input bg-transparent focus:outline-none focus:ring-0 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
        {...props}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrement}
        disabled={value >= max}
        className="rounded-l-none border-l-0 h-9 px-3 min-w-[44px]"
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  )
}
