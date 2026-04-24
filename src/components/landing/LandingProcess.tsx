import { useLayoutEffect, useRef } from "react";
import { Bot, CalendarCheck2, Database, MessageCircleMore, UserPlus } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const steps = [
  {
    number: "01",
    title: "Entra un lead",
    description: "Cada contacto nuevo cae en un sistema que ordena oportunidades desde el primer segundo.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "WhatsApp responde automático",
    description: "Las consultas reciben respuesta al instante con automatizaciones que sostienen velocidad y contexto.",
    icon: MessageCircleMore,
  },
  {
    number: "03",
    title: "El CRM clasifica y guarda datos",
    description: "Toda la información queda estructurada para que tu equipo no vuelva a perder seguimiento.",
    icon: Database,
  },
  {
    number: "04",
    title: "Se agenda y se hace seguimiento",
    description: "El sistema mueve la conversación, agenda, recuerda y mantiene vivo el proceso comercial.",
    icon: CalendarCheck2,
  },
  {
    number: "05",
    title: "El negocio vende con menos operación manual",
    description: "Menos fricción operativa, más control y una máquina comercial que escala sin depender de apagar incendios.",
    icon: Bot,
  },
];

gsap.registerPlugin(ScrollTrigger);

export function LandingProcess() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current || !trackRef.current || !progressRef.current) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(min-width: 768px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-story-card]");

        gsap.set(cards, {
          opacity: (index) => (index === 0 ? 1 : 0.25),
          y: (index) => (index === 0 ? 0 : 40),
          scale: (index) => (index === 0 ? 1 : 0.96),
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${steps.length * 520}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });

        steps.forEach((_, index) => {
          const card = cards[index];
          if (!card) return;

          timeline.to(
            progressRef.current,
            {
              scaleX: (index + 1) / steps.length,
              transformOrigin: "left center",
              ease: "none",
              duration: 1,
            },
            index,
          );

          timeline.to(
            cards,
            {
              opacity: 0.2,
              y: 44,
              scale: 0.96,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0,
            },
            index,
          );

          timeline.to(
            card,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: "power3.out",
            },
            index + 0.1,
          );
        });
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-gray-800 bg-black py-24 md:py-0"
      data-reveal-section
    >
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 md:min-h-screen md:grid-cols-[minmax(360px,0.98fr),minmax(0,1.02fr)] md:items-center md:gap-12 lg:gap-20">
          <div className="space-y-6 py-4 md:py-24 md:pr-6 lg:pr-10">
            <p className="text-xs uppercase tracking-[0.32em] text-gray-500">Sistema Scalo</p>
            <h2 className="max-w-[13ch] text-3xl font-medium leading-[0.94] tracking-tight text-white sm:max-w-[14ch] sm:text-4xl md:max-w-[11ch] md:text-[clamp(3.1rem,4vw,4.7rem)]">
              Un sistema que responde, ordena y vende mientras tu operación se mantiene liviana.
            </h2>
            <p className="max-w-[34rem] text-lg font-light text-gray-400">
              Cada paso está pensado para que el negocio deje de perseguir mensajes, planillas y seguimientos manuales.
            </p>

            <div className="rounded-lg border border-gray-800 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-gray-500">
                <span>Progreso del sistema</span>
                <span>{steps.length} etapas</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div ref={progressRef} className="h-full rounded-full bg-white" style={{ transform: "scaleX(0.2)", transformOrigin: "left center" }} />
              </div>
            </div>
          </div>

          <div ref={trackRef} className="space-y-4 py-2 md:py-24 md:pl-4 lg:pl-8">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  data-story-card
                  className="mx-auto w-full max-w-[720px] rounded-lg border border-gray-800 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-sm md:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium tracking-[0.24em] text-gray-400">
                          {step.number}
                        </span>
                        <div className="rounded-md bg-white text-black p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-medium text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-gray-400 md:text-lg">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
