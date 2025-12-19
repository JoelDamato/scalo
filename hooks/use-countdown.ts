"use client"

import { useState, useEffect } from "react"

const TWELVE_HOURS = 12 * 60 * 60 // 12 hours in seconds
const TIMER_KEY = "special_offer_timer"

export function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTime = localStorage.getItem(TIMER_KEY)
      if (savedTime) {
        const endTime = Number.parseInt(savedTime)
        const now = Math.floor(Date.now() / 1000)
        const remaining = endTime - now
        return remaining > 0 ? remaining : TWELVE_HOURS
      }
    }
    return TWELVE_HOURS
  })

  useEffect(() => {
    // Set initial end time in localStorage if not exists
    if (typeof window !== "undefined" && !localStorage.getItem(TIMER_KEY)) {
      const endTime = Math.floor(Date.now() / 1000) + TWELVE_HOURS
      localStorage.setItem(TIMER_KEY, endTime.toString())
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          // Reset timer when it reaches zero
          const newEndTime = Math.floor(Date.now() / 1000) + TWELVE_HOURS
          localStorage.setItem(TIMER_KEY, newEndTime.toString())
          return TWELVE_HOURS
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return timeLeft
}
