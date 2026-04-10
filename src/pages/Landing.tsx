import { Layout, Search, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LandingCTAButton } from "@/components/landing/LandingCTAButton";
import { LandingCalEmbed } from "@/components/landing/LandingCalEmbed";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingProcess } from "@/components/landing/LandingProcess";
import { LandingTestimonialCarousel } from "@/components/landing/LandingTestimonialCarousel";

const heroImages = [
  "https://framerusercontent.com/images/ji1by0TfXLCz61ApbVPdKrW5F0.jpg",
  "https://framerusercontent.com/images/P5l6yIMQRIl0zyOacrrY74FmF8.jpg",
  "https://framerusercontent.com/images/0EAMFnwrVZn3LhmgG3D1H7R32U.jpg",
  "https://framerusercontent.com/images/LOy5hqUpWu15q9QR5PV94v2AGZA.jpg",
  "https://framerusercontent.com/images/PDdaNF8wc8g4KBV1OBQNxKc0zJc.jpg",
];

const serviceCards = [
  {
    title: "Un nuevo cliente agendado",
    description: "Mediante las automatizaciones que trabajan mientras estas durmiendo.",
    icon: Target,
  },
  {
    title: "Procesos claros",
    description: "Tenes un sistema que te permite saber que hacer, cuando hacerlo y por que funciona.",
    icon: Layout,
  },
  {
    title: "Un negocio que mira hacia adelante",
    description: "Ya no vivis apagando incendios. Ahora tenes vision, estrategia y un camino para crecer.",
    icon: Search,
  },
];

const faqs = [
  {
    question: "¿No basta con tener redes sociales?",
    answer:
      "Las redes son volatiles, dependen de algoritmos y no generan confianza por si solas. Tenemos sistemas validados que generaron mas de 200k usd por cliente.",
  },
  {
    question: "¿Cuanto tiempo tarda en ver resultados?",
    answer:
      "Depende del plan. Si ya tenes un flujo de clientes, los cambios se notan en semanas. Si arrancas de cero, el posicionamiento demora mas.",
  },
  {
    question: "¿Y si ya tengo una web pero no funciona?",
    answer:
      'No es solo "tener una web", sino tener una web optimizada para vender. Revisamos tu sitio y te decimos exactamente que mejorar, aplicando estrategia publicitarias con embudos especificos para tu nicho.',
  },
  {
    question: "¿Por que elegirnos a nosotros?",
    answer:
      "Nos especializamos en potenciar y aumentar ventas digitales. Entendemos como piensan los leads y como toman decisiones. Ya tenemos formulas ganadoras que nos dieron resultados con nuestros clientes.",
  },
];

export default function Landing() {
  return (
    <div className="scalo-landing flex min-h-screen flex-col bg-black text-white">
      <LandingHeader />

      <main className="flex-1">
        <section id="inicio" className="relative flex min-h-[90vh] items-center bg-black px-4 py-24">
          <div className="container relative z-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl md:text-6xl">
                    Un sistema que llevo a facturar
                    <br />
                    <span className="text-gray-400">mas de 250.000 USD</span>
                  </h1>

                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {heroImages.map((image, index) => (
                        <div
                          key={image}
                          className="h-8 w-8 overflow-hidden rounded-full border-2 border-gray-800"
                        >
                          <img
                            src={image}
                            alt={`Cliente satisfecho ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-white">
                    <span>⭐⭐⭐⭐⭐</span>
                    <span className="text-sm">+30 Clientes Satisfechos</span>
                  </div>

                  <p className="max-w-[500px] text-lg font-light text-gray-400 md:text-xl">
                    Ayudamos a profesionales escalando su facturacion digital de forma estable, para que puedan
                    enfocarse solo en su practica y disfrutar su trabajo.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <LandingCTAButton
                    size="lg"
                    className="w-fit bg-white font-light text-black hover:bg-white/90"
                    scrollTo="#contacto"
                  >
                    Solicita tu Auditoria GRATIS
                  </LandingCTAButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-800 bg-black py-24">
          <div className="container space-y-12">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Sabemos lo que estas pensando...
              </h2>
              <p className="text-xl font-light text-gray-400">
                ¿Y si no tengo seguidores? ¿Y si no tengo mucho presupuesto? ¿Y si no tengo tiempo?
              </p>
              <p className="text-lg font-light text-white">
                Tranquilo. SCALO fue disenado justamente para profesionales como vos que quieren crecer con
                inteligencia, no con desgaste.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-medium text-white">Sin miles de seguidores</h3>
                </div>
                <p className="font-light text-gray-400">
                  Esto no es un juego de influencers. Es estrategia. Con un perfil optimizado y contenido bien
                  dirigido, podes generar ventas reales desde tus primeros pasos.
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-medium text-white">Sin gran inversion</h3>
                </div>
                <p className="font-light text-gray-400">
                  Olvidate de gastar fortunas en agencias o campanas sin retorno. Te ensenamos a armar un sistema
                  rentable con recursos accesibles, desde cero.
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-medium text-white">Sin miles de horas</h3>
                </div>
                <p className="font-light text-gray-400">
                  Tu negocio no puede parar. Por eso SCALO es un sistema modular, enfocado en resultados con tiempo
                  limitado. Productividad inteligente, no mas horas de pantalla.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="bg-black py-14">
          <div className="container space-y-12">
            <div className="space-y-4 text-left">
              <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Nos diferenciamos del resto
              </h2>
              <p className="max-w-[600px] font-light text-gray-400">
                Tu negocio sigue funcionando como siempre. Pero mientras tanto, tu celular vibra con notificaciones de
                ventas.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {serviceCards.map((service) => {
                const Icon = service.icon;

                return (
                  <Card
                    key={service.title}
                    className="group space-y-4 border border-gray-800 bg-black p-8 text-white shadow-none transition-colors hover:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-gray-900 p-2 transition-colors group-hover:bg-white group-hover:text-black">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-medium text-white">{service.title}</h3>
                    </div>
                    <p className="leading-relaxed text-gray-400">{service.description}</p>
                  </Card>
                );
              })}
            </div>

            <p className="max-w-4xl text-lg font-light text-gray-300">
              Ya no dependes 100% de tu tiempo para generar ingresos. Tu marca se expande. Tu autoridad crece. Y tus
              conocimientos ayudan a personas que ni siquiera viven en tu ciudad. Eso es escalar. Eso es SCALO.
            </p>
          </div>
        </section>

        <section id="casos" className="border-y border-gray-800 bg-black py-24">
          <div className="container space-y-16">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Transformamos profesionales en marcas de alto impacto digital
              </h2>
              <p className="font-light text-gray-400">
                Si en los primeros 60 dias no ves mejoras en tus KPIs de redes y ventas, te devolvemos tu dinero.
              </p>
            </div>

            <div className="mt-24 space-y-16">
              <LandingTestimonialCarousel />
            </div>
          </div>
        </section>

        <LandingProcess />

        <section id="contacto" className="border-t border-gray-800 bg-black py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl space-y-8 text-center">
              <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Estas a una decision de escalar tu negocio.
              </h2>
              <div className="space-y-4">
                <p className="font-light text-red-400">Solo 5 cupos disponibles este mes.</p>
                <LandingCalEmbed />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-800 bg-black py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-12">
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  Preguntas Frecuentes
                </h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`item-${index}`} className="border-gray-800">
                    <AccordionTrigger className="text-left font-medium text-white hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
