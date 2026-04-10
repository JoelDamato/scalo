import { useEffect, useRef, useState } from "react";
import { FileText, Phone, Rocket } from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Punto de partida",
    duration: "60 min",
    icon: Phone,
    description: "Nos reunimos para entender como funciona tu negocio, tus necesidades y objetivos.",
  },
  {
    number: "02",
    title: "Plan SCALO",
    duration: "2-3 dias",
    icon: FileText,
    description: "Disenamos un plan personalizado para que puedas implementar en todos tus negocios.",
  },
  {
    number: "03",
    title: "Acompanamiento 1:1",
    duration: "3 meses",
    icon: FileText,
    description:
      "Cuentas con un equipo de especialistas en Marketing, Estrategia, Fulfillment, Content Quality y Ventas.",
  },
  {
    number: "04",
    title: "Auditoria",
    duration: "Continuo",
    icon: Rocket,
    description: "Revisar resultados, ajustar estrategias y planificar el siguiente nivel de crecimiento.",
  },
];

function LandingProcessStep({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const stepRef = useRef<HTMLDivElement | null>(null);
  const controls = useAnimation();
  const isInView = useInView(stepRef, {
    margin: "-45% 0px -45% 0px",
  });

  const Icon = step.icon;

  useEffect(() => {
    if (isInView) {
      void controls.start({
        backgroundColor: "#ffffff",
        borderColor: "#ffffff",
        color: "#000000",
      });
      return;
    }

    void controls.start({
      backgroundColor: "#000000",
      borderColor: "#333333",
      color: "#666666",
    });
  }, [controls, isInView]);

  return (
    <div className="relative" ref={stepRef}>
      <div className="relative flex flex-col md:block">
        <div
          className={`relative pb-24 pl-24 md:w-full md:pl-0 ${
            index % 2 === 0 ? "md:pr-[calc(50%+3rem)]" : "md:pl-[calc(50%+3rem)]"
          }`}
        >
          <motion.div
            className="absolute left-5 z-10 -ml-[24px] flex h-12 w-12 items-center justify-center rounded-full border md:left-1/2"
            initial={{
              backgroundColor: "#000000",
              borderColor: "#333333",
            }}
            animate={controls}
          >
            <motion.span
              className="text-sm font-medium"
              initial={{ color: "#666666" }}
              animate={{ color: isInView ? "#000000" : "#666666" }}
              transition={{ duration: 0.3 }}
            >
              {step.number}
            </motion.span>
          </motion.div>

          <motion.div
            className="py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-3xl border border-gray-800 bg-black p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-medium tracking-tight text-white">{step.title}</h3>
                </div>
                <span className="rounded-full bg-gray-900 px-4 py-1 text-sm font-light text-gray-300">
                  {step.duration}
                </span>
              </div>
              <p className="mt-4 text-sm font-light leading-relaxed text-gray-400">{step.description}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function LandingProcess() {
  const [progressHeight, setProgressHeight] = useState(0);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!progressRef.current) {
        return;
      }

      const { top, bottom } = progressRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const nextHeight = Math.min(Math.max(windowHeight / 2 - top, 0), bottom - top);
      setProgressHeight(nextHeight);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative border-y border-gray-800 bg-black">
      <div className="container py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            El camino claro, simple y probado para cumplir tus metas.
          </h2>
        </div>

        <div className="relative mx-auto mt-24 max-w-5xl">
          <div ref={progressRef}>
            <div className="absolute left-[22px] top-0 -ml-[4px] h-full w-[8px] rounded-full border border-gray-800 bg-gray-900 md:left-1/2">
              <motion.div
                className="relative left-1/2 w-2 -translate-x-1/2 rounded-full bg-white"
                style={{ height: progressHeight }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {steps.map((step, index) => (
              <LandingProcessStep key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
