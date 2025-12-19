"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

export function ClientLink({ href, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault()
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
