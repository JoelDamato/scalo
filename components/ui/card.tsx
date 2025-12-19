import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-gray-800 bg-black text-white shadow-none",
        className
      )}
      {...props}
    />
  )
)

Card.displayName = "Card"

export { Card }
