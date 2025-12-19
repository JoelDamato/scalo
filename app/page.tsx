import { NavigationHeader } from "@/components/navigation-header"
import { Process } from "@/components/process"
import { CalModal } from "@/components/cal-modal"
import { AnimatedFooter } from "@/components/animated-footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { Card } from "@/components/ui/card"
import { Target, Layout, Search } from "lucide-react"
import Image from "next/image"
import { InteractiveButton } from "@/components/interactive-button"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationHeader />

      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center px-4 py-24 bg-black" id="inicio">
          <div className="container relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-[500] tracking-tight sm:text-5xl md:text-6xl text-white">
                    Un sistema que llevo a facturar <br />
                    <span className="text-gray-400">mas de 250.000 USD</span>
                  </h1>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex -space-x-2">
                      {[
                        "https://framerusercontent.com/images/ji1by0TfXLCz61ApbVPdKrW5F0.jpg",
                        "https://framerusercontent.com/images/P5l6yIMQRIl0zyOacrrY74FmF8.jpg",
                        "https://framerusercontent.com/images/0EAMFnwrVZn3LhmgG3D1H7R32U.jpg",
                        "https://framerusercontent.com/images/LOy5hqUpWu15q9QR5PV94v2AGZA.jpg",
                        "https://framerusercontent.com/images/PDdaNF8wc8g4KBV1OBQNxKc0zJc.jpg",
                      ].map((image, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Happy client ${i + 1}`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <span>⭐⭐⭐⭐⭐</span>
                    <span className="text-sm">+30 Clientes Satisfechos</span>
                  </div>
                  <p className="max-w-[500px] text-gray-400 text-lg md:text-xl font-light">
                    Ayudamos a profesionales escalando su facturación digital de forma estable, para que puedan
                    enfocarse solo en su práctica y disfrutar su trabajo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <InteractiveButton
                    size="lg"
                    variant="default"
                    className="font-light w-fit bg-white text-black hover:bg-white/90"
                    scrollTo="#contacto"
                  >
                    Solicita tu Auditoria GRATIS
                  </InteractiveButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black py-24 border-t border-gray-800">
          <div className="container space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-[500] tracking-tighter sm:text-4xl md:text-5xl text-white">
                Sabemos lo que estás pensando...
              </h2>
              <p className="text-xl text-gray-400 font-light">
                ¿Y si no tengo seguidores? ¿Y si no tengo mucho presupuesto? ¿Y si no tengo tiempo?
              </p>
              <p className="text-lg text-white font-light">
                Tranquilo. SCALO fue diseñado justamente para profesionales como vos que quieren crecer con
                inteligencia, no con desgaste.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-black border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-[500] text-white">Sin miles de seguidores</h3>
                </div>
                <p className="text-gray-400 font-light">
                  Esto no es un juego de influencers. Es estrategia. Con un perfil optimizado y contenido bien dirigido,
                  podés generar ventas reales desde tus primeros pasos.
                </p>
              </div>

              <div className="bg-black border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-[500] text-white">Sin gran inversión</h3>
                </div>
                <p className="text-gray-400 font-light">
                  Olvidate de gastar fortunas en agencias o campañas sin retorno. Te enseñamos a armar un sistema
                  rentable con recursos accesibles, desde cero.
                </p>
              </div>

              <div className="bg-black border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white">
                    ✓
                  </div>
                  <h3 className="text-xl font-[500] text-white">Sin miles de horas</h3>
                </div>
                <p className="text-gray-400 font-light">
                  Tu negocio no puede parar. Por eso SCALO es un sistema modular, enfocado en resultados con tiempo
                  limitado. Productividad inteligente, no más horas de pantalla.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black py-14" id="servicios">
          <div className="container space-y-12">
            <div className="bg-black text-left space-y-4 ml-0">
              <h2 className="bg-black text-3xl font-[500] tracking-tighter sm:text-4xl md:text-5xl text-white">
                Nos diferenciamos del resto
              </h2>
              <p className="ml-0 max-w-[600px] text-gray-400 font-light">
                Tu negocio sigue funcionando como siempre. Pero mientras tanto, tu celular vibra con notificaciones de
                ventas.
              </p>
            </div>
            <div className="bg-black grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Un nuevo cliente agendado",
                  description: "Mediante las automatizaciones que trabajan mientras estas durmiendo.",
                  icon: Target,
                },
                {
                  title: "Procesos claros",
                  description: "Tenés un sistema que te permite saber qué hacer, cuándo hacerlo y por qué funciona.",
                  icon: Layout,
                },
                {
                  title: "Un negocio que mira hacia adelante",
                  description:
                    "Ya no vivís apagando incendios. Ahora tenés visión, estrategia y un camino para crecer.",
                  icon: Search,
                },
              ].map((service, i) => {
                const Icon = service.icon
                return (
                <Card
  key={i}
  className="p-8 space-y-4 bg-black text-white border border-gray-800 hover:border-gray-700 transition-colors group shadow-none"
>

                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gray-900 group-hover:bg-white group-hover:text-black transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-[500] text-xl text-white">{service.title}</h3>
                    </div>
                    <p className="text-gray-400 font-light leading-relaxed">{service.description}</p>
                  </Card>
                )
              })}
            </div>
            <p>
              Ya no dependés 100% de tu tiempo para generar ingresos. Tu marca se expande. Tu autoridad crece. Y tus
              conocimientos ayudan a personas que ni siquiera viven en tu ciudad. Eso es escalar. Eso es SCALO.
            </p>
          </div>
        </section>

        <section className="py-24 bg-black border-y border-gray-800" id="casos">
          <div className="container space-y-16">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl font-[500] tracking-tighter sm:text-4xl md:text-5xl text-white">
                Transformamos profesionales en marcas de alto impacto digital
              </h2>
              <p className="text-gray-400 font-light">
                Si en los primeros 60 días no ves mejoras en tus KPIs de redes y ventas, te devolvemos tu dinero.
              </p>
            </div>

            <div className="mt-24 space-y-16">
              <TestimonialCarousel />
            </div>
          </div>
        </section>

        <Process />

  

        <section className="py-24 bg-black border-t border-gray-800" id="contacto">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-[500] tracking-tighter sm:text-4xl md:text-5xl text-white">
                Estas a una desicion de escalar tu negocio.
              </h2>
              <div className="space-y-4">
                <p className="text-red-400 font-light">Solo 5 cupos disponibles este mes.</p>
                <CalModal />
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="py-24 bg-black border-b border-gray-800">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-[500] tracking-tighter sm:text-4xl text-white">Preguntas Frecuentes</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "¿No basta con tener redes sociales?",
                  answer:
                    "Las redes son volátiles, dependen de algoritmos y no generan confianza por sí solas. Tenemos sistemas validados que generaron mas de 200k usd por cliente",
                },
                {
                  question: "¿Cuánto tiempo tarda en ver resultados?",
                  answer:
                    "Depende del plan. Si ya tenés un flujo de clientes, los cambios se notan en semanas. Si arrancás de cero, el posicionamiento demora mas.",
                },
                {
                  question: "¿Y si ya tengo una web pero no funciona?",
                  answer:
                    'No es solo "tener una web", sino tener una web optimizada para vender. Revisamos tu sitio y te decimos exactamente qué mejorar, aplicando estrategia publicitarias con embudos especificos para tu nicho',
                },

                {
                  question: "¿Por qué elegirnos a nosotros?",
                  answer:
                    "Nos especializamos en potenciar y aumentar ventas digitales. Entendemos cómo piensan los leads y cómo toman decisiones. Ya tenemos formulas ganadoras que nos dieron resultados con nuestros clientes",
                },
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-gray-800">
                  <AccordionTrigger className="text-left font-[500] text-white">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-400">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <AnimatedFooter />
    </div>
  )
}
