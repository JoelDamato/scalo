import { useLayoutEffect, useRef } from "react";
import { Layout, Search, Target } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LandingCalEmbed } from "@/components/landing/LandingCalEmbed";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingProcess } from "@/components/landing/LandingProcess";
import { ScaloHeroExplosion } from "@/components/landing/ScaloHeroExplosion";
import { ScaloSystemScroll } from "@/components/landing/ScaloSystemScroll";
import { LandingTestimonialCarousel } from "@/components/landing/LandingTestimonialCarousel";

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

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!pageRef.current) return;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
    });

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };

    frameId = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const revealGroups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
      revealGroups.forEach((group) => {
        const targets = group.querySelectorAll("[data-reveal-item]");
        if (!targets.length) return;

        gsap.from(targets, {
          opacity: 0,
          y: 80,
          scale: 0.95,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: group,
            start: "top 80%",
            once: true,
          },
        });
      });

      gsap.from("[data-final-cta]", {
        opacity: 0,
        y: 80,
        scale: 0.96,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-final-cta]",
          start: "top 82%",
          once: true,
        },
      });

      mm.add("(max-width: 767px)", () => {
        gsap.set("[data-hero-content]", { clearProps: "scale,opacity" });
      });
    }, pageRef);

    return () => {
      ctx.revert();
      mm.revert();
      cancelAnimationFrame(frameId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="scalo-landing flex min-h-screen flex-col bg-black text-white">
      <LandingHeader />

      <main className="flex-1">
        <ScaloHeroExplosion />

        <ScaloSystemScroll />

        <section className="border-t border-gray-800 bg-black py-24">
          <div className="container space-y-12">
            <div data-reveal-group className="mx-auto max-w-3xl space-y-6 text-center">
              <h2 data-reveal-item className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Sabemos lo que estas pensando...
              </h2>
              <p data-reveal-item className="text-xl font-light text-gray-400">
                ¿Y si no tengo seguidores? ¿Y si no tengo mucho presupuesto? ¿Y si no tengo tiempo?
              </p>
              <p data-reveal-item className="text-lg font-light text-white">
                Tranquilo. SCALO fue disenado justamente para profesionales como vos que quieren crecer con
                inteligencia, no con desgaste.
              </p>
            </div>

            <div data-reveal-group className="mt-12 grid gap-8 md:grid-cols-3">
              <div data-reveal-item className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
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

              <div data-reveal-item className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
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

              <div data-reveal-item className="rounded-xl border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700">
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
            <div data-reveal-group className="space-y-4 text-left">
              <h2 data-reveal-item className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Nos diferenciamos del resto
              </h2>
              <p data-reveal-item className="max-w-[600px] font-light text-gray-400">
                Tu negocio sigue funcionando como siempre. Pero mientras tanto, tu celular vibra con notificaciones de
                ventas.
              </p>
            </div>

            <div data-reveal-group className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {serviceCards.map((service) => {
                const Icon = service.icon;

                return (
                  <Card
                    key={service.title}
                    data-reveal-item
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

            <div data-reveal-group>
              <p data-reveal-item className="max-w-4xl text-lg font-light text-gray-300">
                Ya no dependes 100% de tu tiempo para generar ingresos. Tu marca se expande. Tu autoridad crece. Y tus
                conocimientos ayudan a personas que ni siquiera viven en tu ciudad. Eso es escalar. Eso es SCALO.
              </p>
            </div>
          </div>
        </section>

        <section id="casos" className="border-y border-gray-800 bg-black py-24">
          <div className="container space-y-16">
            <div data-reveal-group className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 data-reveal-item className="text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
                Transformamos profesionales en marcas de alto impacto digital
              </h2>
              <p data-reveal-item className="font-light text-gray-400">
                Si en los primeros 60 dias no ves mejoras en tus KPIs de redes y ventas, te devolvemos tu dinero.
              </p>
            </div>

            <div data-reveal-group className="mt-24 space-y-16">
              <div data-reveal-item>
                <LandingTestimonialCarousel />
              </div>
            </div>
          </div>
        </section>

        <LandingProcess />

        <section id="contacto" className="border-t border-gray-800 bg-black py-24">
          <div className="container">
            <div data-final-cta className="mx-auto max-w-4xl space-y-8 text-center">
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
              <div data-reveal-group className="space-y-4 text-center">
                <h2 data-reveal-item className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  Preguntas Frecuentes
                </h2>
              </div>

              <Accordion data-reveal-group type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`item-${index}`}
                    className="border-gray-800"
                    data-reveal-item
                  >
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
