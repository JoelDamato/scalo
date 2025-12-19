"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { NavLink } from "@/components/nav-link"

export function AnimatedFooter() {
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="container py-16 md:py-24">
        <div className="grid gap-16 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <Link href="/" className="block w-fit">
              <Image src="/logo.png" alt="Scalo" width={80} height={40} className="h-28 w-auto" />
            </Link>
            <p className="text-gray-400 max-w-md text-sm font-light leading-relaxed">
              Ayudamos a profesionales a crecer su práctica con marketing digital estratégico.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Navegación</h4>
              <ul className="space-y-3">
                {["Inicio", "Servicios", "Casos de éxito"].map((item) => (
                  <li key={item}>
                    <NavLink
                      href={`#${item.toLowerCase().replace(" de éxito", "").replace(" ", "-")}`}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Legal</h4>
              <ul className="space-y-3">
                {[
                  { label: "Privacidad", href: "/privacidad" },
                  { label: "Términos", href: "/terminos" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Contacto</h4>
              <ul className="space-y-3">
                {[
                  { label: "Email", href: "mailto:team@scalo.tech" },
                  { label: "WhatsApp", href: "https://wa.me/54935181862" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
                    >
                      {item.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm font-light">
            © {new Date().getFullYear()} Scalo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
