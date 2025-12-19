"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface HorizontalPricingCardProps {
  className?: string
}

export function HorizontalPricingCard({ className }: HorizontalPricingCardProps) {
  const handleClick = () => {
    const message = encodeURIComponent(
      "Hola! Me interesa el Social Media Authority Pack. Me gustaría tener más información.",
    )
    window.location.href = `https://wa.me/5491161034?text=${message}`
  }

  return (
    <Card className={cn("p-8 border-gray-800 bg-black overflow-hidden", className)}>
      <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full">
              <span className="text-sm">🔥 Nuevo</span>
            </div>
            <h3 className="text-2xl font-[500]">Social Media Authority Pack</h3>
            <p className="text-muted-foreground font-light">
              Tu presencia digital optimizada para atraer y convertir en redes sociales.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <div className="text-sm font-[500] mb-3">Incluye:</div>
              <ul className="grid gap-3">
                {[
                  "Diseño de marca visual (colores, tipografía, estilos gráficos)",
                  "Plantillas editables para Instagram y Facebook en Canva",
                  "Optimización de perfiles para una identidad profesional clara",
                  "Guía de contenido estratégico para atraer clientes sin bailes en TikTok",
                  "Set de copies persuasivos para tus publicaciones iniciales",
                  "Campaña inicial de anuncios en Meta (configuración + segmentación recomendada)",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-black mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-[500] mb-3">Ideal para:</div>
              <ul className="grid gap-3">
                {[
                  "Profesionales que quieren una presencia en redes alineada con su autoridad",
                  "Psicólogos, coaches y consultores que buscan atraer pacientes/clientes desde Instagram & Facebook",
                  'Personas que quieren una estrategia real en redes, más allá del simple "engagement"',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="select-none">📲</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:border-l lg:pl-8 space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm">AR$</span>
                <div className="text-4xl font-[500]">200.000</div>
              </div>
              <p className="text-sm text-muted-foreground">Pago único</p>
            </div>

            <ul className="space-y-3">
              {[
                "Entrega en 7 días",
                "Incluye una sesión estratégica 1:1 para definir tu posicionamiento",
                "Acceso a recursos exclusivos para mantener tu estrategia en el tiempo",
              ].map((extra, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="select-none">🔹</span>
                  <span>{extra}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleClick} className="w-full py-6 text-base font-light">
            Quiero potenciar mis redes
          </Button>
        </div>
      </div>
    </Card>
  )
}
