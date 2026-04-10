import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { LandingScrollLink } from "./LandingScrollLink";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-800 bg-black text-white">
      <div className="container py-16 md:py-24">
        <div className="grid gap-16 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <Link to="/" className="block w-fit">
              <img src="/logo.png" alt="Scalo" className="h-28 w-auto" />
            </Link>
            <p className="max-w-md text-sm font-light leading-relaxed text-gray-400">
              Ayudamos a profesionales a crecer su practica con marketing digital estrategico.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Navegacion</h4>
              <ul className="space-y-3">
                <li>
                  <LandingScrollLink
                    href="#inicio"
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Inicio
                  </LandingScrollLink>
                </li>
                <li>
                  <LandingScrollLink
                    href="#servicios"
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Servicios
                  </LandingScrollLink>
                </li>
                <li>
                  <LandingScrollLink
                    href="#casos"
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Casos de exito
                  </LandingScrollLink>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacidad" className="text-sm text-gray-400 transition-colors hover:text-white">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terminos" className="text-sm text-gray-400 transition-colors hover:text-white">
                    Terminos
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-medium text-white/80">Contacto</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:team@scalo.tech"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Email
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/54935181862"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8">
          <p className="text-sm font-light text-gray-400">
            © {new Date().getFullYear()} Scalo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
