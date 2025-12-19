"use client"

import { useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { motion, useInView } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const projects = [
  {
    title: "ID Terapia",
    description: "De un servicio local a una presencia internacional",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PSD_02-kTkG9jOZur6t6QerVzhM9KAALQUWnD.webp",
  },
  {
    title: "Centro Psicológico",
    description: "Presencia digital para un equipo de profesionales",
    image: "/placeholder.svg?height=450&width=800",
  },
  {
    title: "Consultorio Online",
    description: "Plataforma de terapia virtual multilingüe",
    image: "/placeholder.svg?height=450&width=800",
  },
]

export function ProjectCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  })

  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true })

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev()
  }

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className="p-4">
                <div className="overflow-hidden rounded-xl border border-[#e3e1e8]">
                  <Image
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    width={800}
                    height={450}
                    className="w-full object-cover"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-[500]">{project.title}</h3>
                  <p className="text-muted-foreground font-light">{project.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="icon" onClick={scrollPrev} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={scrollNext} className="rounded-full">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
