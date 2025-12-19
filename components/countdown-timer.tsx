"use client"

import { useCountdown } from "@/hooks/use-countdown"
import { formatTime } from "@/lib/utils"
import { Timer } from "lucide-react"

export function CountdownTimer() {
  const timeLeft = useCountdown()

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Timer className="h-4 w-4" />
      <span>Oferta especial expira en:</span>
      <span className="font-mono bg-black text-white px-2 py-1 rounded">{formatTime(timeLeft)}</span>
    </div>
  )
}
