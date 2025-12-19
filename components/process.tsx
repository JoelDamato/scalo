"use client"

import { useState } from "react"

import { useRef, useEffect } from "react"
import { motion, useInView, useAnimation } from "framer-motion"
import { Phone, FileText, Palette, Rocket } from "lucide-react"

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
    duration: "2-3 días",
    icon: FileText,
    description: "Diseñamos un plan personalizado para que puedas implementar en todos tus negocios.",
  },
  {
    number: "03",
    title: "Acompañamiento 1:1",
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
]

function ProcessStep({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const stepRef = useRef(null)
  const controls = useAnimation()
  const isInView = useInView(stepRef, {
    margin: "-45% 0px -45% 0px",
  })

  const Icon = step.icon

  useEffect(() => {
    if (isInView) {
      controls.start({
        backgroundColor: "#ffffff",
        borderColor: "#ffffff",
        color: "#000000",
      })
    } else {
      controls.start({
        backgroundColor: "#000000",
        borderColor: "#333333",
        color: "#666666",
      })
    }
  }, [isInView, controls])

  return (
    <div className="relative" ref={stepRef}>
      <div className="relative flex flex-col md:block">
        <div
          className={`relative pl-24 md:pl-0 md:w-full pb-24 last:pb-0 ${
            index % 2 === 0 ? "md:pr-[calc(50%+3rem)]" : "md:pl-[calc(50%+3rem)]"
          }`}
        >
          <motion.div
            className="absolute left-5 md:left-1/2 z-10 -ml-[24px] flex h-12 w-12 items-center justify-center rounded-full bg-black border"
            initial={{
              backgroundColor: "#000000",
              borderColor: "#333333",
            }}
            animate={controls}
          >
            <motion.span
              className="font-display text-sm font-medium"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-white" />
                  <h3 className="font-display text-xl font-[500] tracking-tight text-white">{step.title}</h3>
                </div>
                <span className="rounded-full bg-gray-900 px-4 py-1 text-sm font-light text-gray-300">
                  {step.duration}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-400 font-light">{step.description}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export function Process() {
  const [progressHeight, setProgressHeight] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (progressRef.current) {
        const { top, bottom } = progressRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const newHeight = Math.min(Math.max(windowHeight / 2 - top, 0), bottom - top)
        setProgressHeight(newHeight)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <section className="relative border-y border-gray-800 bg-black">
      <div className="container py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-[500] tracking-tight text-white sm:text-4xl">
            El camino claro, simple y probado para cumplir tus metas.
          </h2>
        
        </div>

        <div className="relative mx-auto mt-24 max-w-5xl">
          <div ref={progressRef}>
            <div className="absolute left-[22px] md:left-1/2 top-0 -ml-[4px] h-full w-[8px] rounded-full bg-gray-900 border border-gray-800">
              <motion.div
                className="relative w-2 rounded-full bg-white left-1/2 -translate-x-1/2"
                style={{ height: progressHeight }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {steps.map((step, index) => (
              <ProcessStep key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
