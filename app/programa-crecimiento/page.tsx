"use client"

import Link from "next/link"
import Image from "next/image"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GrowthProgramPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Scalo" width={120} height={40} className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 bg-black">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-4">
                <span className="text-sm font-light">Programa Exclusivo</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-[500] tracking-tight text-white">
                Escala tu consulta de forma predecible en 90 días
              </h1>
              <p className="text-xl text-gray-400 font-light">
                Aumenta tu facturación y optimiza tus procesos para atraer más pacientes sin sacrificar tu tiempo ni
                calidad de atención
              </p>
              <Button
                size="lg"
                className="mt-8 bg-white text-black hover:bg-white/90 font-light text-base"
                onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })}
              >
                Quiero crecer mi consulta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Why This Outcome Section */}
        <section className="py-16 bg-black border-t border-gray-800">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-[500] text-white">¿Por qué este programa?</h2>
                <p className="text-gray-400 font-light">
                  Porque los profesionales quieren crecer rápido (facturación y visibilidad) y al
                  mismo tiempo resolver problemas de estructura y procesos. Nuestro roadmap de 3 meses se alinea
                  perfectamente con un plazo de 90 días.
                </p>
              </div>

              {/* Main Desire */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">1. Tu deseo principal</h3>
                <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
                  <p className="text-white font-light">
                    Escala tu consulta de forma predecible, aumentando tu facturación y optimizando tus procesos para
                    atraer pacientes ideales en 90 días o menos.
                  </p>
                </div>
              </div>

              {/* Increase Perceived Success */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">2. Aumentamos la probabilidad de éxito</h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Resultados previos y experiencia:</h4>
                    <ul className="space-y-3">
                      {[
                        "Hemos ayudado a profesionales a aumentar sus consultas en un 40% en menos de 3 meses.",
                        "Hemos generado más de $250.000 en ingresos adicionales para nuestros clientes con este mismo sistema.",
                        "Contamos con un equipo de especialistas en Marketing Digital, SEO, UX/UI, Copywriting y Automatización de procesos.",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Proceso claro y paso a paso:</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                        <div className="text-2xl font-bold text-white">01</div>
                        <h5 className="font-[500] text-white">Diagnóstico</h5>
                        <p className="text-sm text-gray-400 font-light">
                          Análisis completo de tu presencia digital y procesos actuales.
                        </p>
                      </div>
                      <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                        <div className="text-2xl font-bold text-white">02</div>
                        <h5 className="font-[500] text-white">Implementación</h5>
                        <p className="text-sm text-gray-400 font-light">
                          Desarrollo de tu web optimizada y sistemas de captación de pacientes.
                        </p>
                      </div>
                      <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                        <div className="text-2xl font-bold text-white">03</div>
                        <h5 className="font-[500] text-white">Optimización</h5>
                        <p className="text-sm text-gray-400 font-light">
                          Ajustes basados en datos para maximizar resultados y escalabilidad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed of Achievement */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">3. Rapidez de logro</h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Programa de 3 meses:</h4>
                    <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Recibes un diagnóstico inicial y un plan de acción detallado en la primera semana.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Gracias a la asesoría personalizada, evitarás errores que suelen costar hasta un 40% de tus
                            ingresos potenciales y 4-5 horas de tu día por falta de claridad.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Implementación ágil:</h4>
                    <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
                      <p className="text-gray-300 font-light">
                        En vez de invertir meses en ensayo y error, tendrás un "sistema probado" con checklists,
                        plantillas y guías que aceleran la ejecución. Nuestra metodología ha sido refinada con decenas
                        de profesionales de la salud mental.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Effort and Sacrifice */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">4. Esfuerzo y sacrificio mínimo</h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Acompañamiento 1 a 1 + Equipo especialista:</h4>
                    <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
                      <p className="text-gray-300 font-light mb-4">
                        No tendrás que hacerlo solo. Nuestro equipo se encarga de la parte más técnica y de guiar la
                        estrategia.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Asesoría en marketing digital, SEO, automatizaciones y contenidos para que no tengas que
                            buscar expertos externos.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Implementación técnica completa para que puedas enfocarte en lo que mejor sabes hacer:
                            atender a tus pacientes.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-[500] text-white/90">Sistemas y procesos listos para usar:</h4>
                    <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Plantillas de automatización para citas y seguimiento de pacientes.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Scripts de comunicación para convertir consultas en pacientes.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 font-light">
                            Calendarios de contenido para mantener tu presencia digital sin esfuerzo.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantee */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">5. Garantía de satisfacción</h3>

                <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                  <p className="text-white font-light">
                    Si en los primeros 60 días no ves mejoras en tus KPIs de visibilidad web y consultas, te devolvemos
                    tu dinero. Así de seguros estamos de nuestro método.
                  </p>
                </div>
              </div>

              {/* High-Value Bonuses */}
              <div className="space-y-4">
                <h3 className="text-xl font-[500] text-white">6. Bonos de alto valor por toma de acción</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                    <h4 className="font-[500] text-white">Blueprint de automatización de citas</h4>
                    <p className="text-sm text-gray-400 font-light">
                      Un documento paso a paso con los mejores flujos, secuencias y procesos para automatizar la gestión
                      de pacientes y escalar rápidamente.
                    </p>
                  </div>
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                    <h4 className="font-[500] text-white">Contenido de alto impacto mensual</h4>
                    <p className="text-sm text-gray-400 font-light">
                      Una colección de plantillas, estructuras y ejemplos de copywriting y diseño que multiplican la
                      interacción y conversión en tu web y redes sociales.
                    </p>
                  </div>
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                    <h4 className="font-[500] text-white">Masterclass de SEO local</h4>
                    <p className="text-sm text-gray-400 font-light">
                      Una capacitación exprés con las estrategias más efectivas para posicionarte en búsquedas locales y
                      atraer pacientes de tu zona geográfica.
                    </p>
                  </div>
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-3">
                    <h4 className="font-[500] text-white">Auditoría VIP de escalado</h4>
                    <p className="text-sm text-gray-400 font-light">
                      Una sesión adicional de consultoría personalizada al final del programa para revisar resultados,
                      ajustar estrategias y planificar el siguiente nivel de crecimiento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Stack & Pricing */}
        <section className="py-16 bg-black border-t border-gray-800" id="contacto">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-[500] text-white">Tu inversión</h2>
                <p className="text-gray-400 font-light">
                  Un programa completo para transformar tu presencia digital y multiplicar tus consultas
                </p>
              </div>

              <div className="bg-white/5 border border-gray-800 rounded-xl p-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-[500] text-white">Lo que incluye:</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                        <div className="space-y-1">
                          <h4 className="font-[500] text-white">Consultoría por 3 meses para elevar tus consultas</h4>
                          <p className="text-sm text-gray-400 font-light">
                            Estrategia personalizada + implementación técnica
                          </p>
                        </div>
                        <div className="text-xl font-[500] text-white">1000usd</div>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                        <div className="space-y-1">
                          <h4 className="font-[500] text-white">Soporte 1 a 1 + Equipo especialista en cada área</h4>
                          <p className="text-sm text-gray-400 font-light">
                            Diseño web, SEO, copywriting y automatizaciones
                          </p>
                        </div>
                        <div className="text-xl font-[500] text-white">1500usd</div>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                        <div className="space-y-1">
                          <h4 className="font-[500] text-white">Reuniones de seguimiento, checkpoints y KPIs</h4>
                          <p className="text-sm text-gray-400 font-light">
                            Aseguramos resultados medibles y ajustes continuos
                          </p>
                        </div>
                        <div className="text-xl font-[500] text-white">1000usd</div>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                        <div className="space-y-1">
                          <h4 className="font-[500] text-white">Bonos de alto valor</h4>
                          <p className="text-sm text-gray-400 font-light">
                            Blueprint, contenidos, masterclass y auditoría VIP
                          </p>
                        </div>
                        <div className="text-xl font-[500] text-white">500usd</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-[500] text-white">Valor total:</h4>
                      <div className="text-2xl font-[500] text-white">4000usd</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-[500] text-white">Precio hoy:</h4>
                      <div className="text-3xl font-bold text-green-500">1879 usd</div>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <p className="text-white font-light">¡Hasta llenar cupos!</p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full py-8 text-lg bg-white text-black hover:bg-white/90 font-light"
                    onClick={() =>
                      (window.location.href =
                        "https://wa.me/5493518781862?text=Hola!%20Me%20interesa%20el%20Programa%20de%20Crecimiento%20de%2090%20días%20para%20mi%20consulta.%20Me%20gustaría%20tener%20más%20información.")
                    }
                  >
                    Quiero aumentar mis consultas ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <p className="text-center text-sm text-gray-400 font-light">
                    Plazas limitadas. Solo aceptamos 5 profesionales por mes para garantizar resultados de calidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white border-t border-gray-800 py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Scalo" width={120} height={40} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Scalo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
