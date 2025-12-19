"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

function NavLink({ href, children, className }: NavLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}

export function NavigationHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-black backdrop-blur supports-[backdrop-filter]:bg-black ${
        isScrolled ? "border-gray-800" : "border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="https://i.ibb.co/zVYLLYhY/1-6.png" alt="Scalo" width={120} height={40} className="h-40 w-auto" />
        </Link>
        <nav className="hidden md:flex gap-8">
          {[
            { href: "#inicio", label: "Inicio" },
            { href: "#servicios", label: "Servicios" },
            { href: "#casos", label: "Casos de Éxito" },
            { href: "#contacto", label: "Contacto" },
          ].map(({ href, label }) => (
            <NavLink
              key={label}
              href={href}
              className="text-sm font-light text-gray-300 hover:text-white transition-colors"
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
