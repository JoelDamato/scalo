import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { LandingScrollLink } from "./LandingScrollLink";

const navItems = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#casos", label: "Casos de Exito" },
  { href: "#contacto", label: "Contacto" },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-black backdrop-blur supports-[backdrop-filter]:bg-black ${
        isScrolled ? "border-gray-800" : "border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <img
            src="https://i.ibb.co/zVYLLYhY/1-6.png"
            alt="Scalo"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden gap-8 md:flex">
            {navItems.map(({ href, label }) => (
              <LandingScrollLink
                key={label}
                href={href}
                className="text-sm font-light text-gray-300 transition-colors hover:text-white"
              >
                {label}
              </LandingScrollLink>
            ))}
          </nav>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90"
          >
            <Link to="/auth">Ingresar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
