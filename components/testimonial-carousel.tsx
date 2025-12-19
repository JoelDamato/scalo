"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const testimonials = [
  {
    quote:
      '"Lo mejor de SCALO fue el acompañamiento. No estuve solo ni un segundo."',
    author: "Matias Randazzo",
    role: "Creador del MEG",
    image: "https://i.ibb.co/5x4prvGJ/9cb494c5-0c45-41b2-ae34-eb578c08869b.jpg",
  },
  {
    quote:
      '"Me ayudaron a transformar mi experiencia en un producto que se vende solo."',
    author: "Tomas Buschiazzo",
    role: "Influencer / Infoproductor",
    image:
      "https://i.ibb.co/D6P1qYd/874f4368-a49c-453c-af47-f911991d9b72.jpg",
  },
  {
    quote:
      '"Pensé que iba a necesitar mucho tiempo. Me sorprendí con lo simple que fue el proceso."',
    author: "Dario Costanza",
    role: "Odontologo Mentor e infoproductor",
    image:
      "https://i.ibb.co/8LNk967C/61eed236-c896-4a84-8efa-94929845824c.jpg",
  },
]

export function TestimonialCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    })
  }, [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <p className="text-xl md:text-2xl font-light italic leading-relaxed text-white">
                    {testimonial.quote}
                  </p>
                  <div>
                    <div className="font-[500] text-white">{testimonial.author}</div>
                    <div className="text-gray-400 font-light">{testimonial.role}</div>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-3xl overflow-hidden">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={`${testimonial.author}'s project`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? "bg-white" : "bg-gray-700"}`}
            onClick={() => emblaApi?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
