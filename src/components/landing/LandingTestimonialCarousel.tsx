import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: '"Lo mejor de SCALO fue el acompanamiento. No estuve solo ni un segundo."',
    author: "Matias Randazzo",
    role: "Creador del MEG",
    image: "https://i.ibb.co/5x4prvGJ/9cb494c5-0c45-41b2-ae34-eb578c08869b.jpg",
  },
  {
    quote: '"Me ayudaron a transformar mi experiencia en un producto que se vende solo."',
    author: "Tomas Buschiazzo",
    role: "Influencer / Infoproductor",
    image: "https://i.ibb.co/D6P1qYd/874f4368-a49c-453c-af47-f911991d9b72.jpg",
  },
  {
    quote: '"Pense que iba a necesitar mucho tiempo. Me sorprendi con lo simple que fue el proceso."',
    author: "Dario Costanza",
    role: "Odontologo Mentor e infoproductor",
    image: "https://i.ibb.co/8LNk967C/61eed236-c896-4a84-8efa-94929845824c.jpg",
  },
];

export function LandingTestimonialCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="min-w-0 flex-[0_0_100%]">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div className="space-y-6">
                  <p className="text-xl font-light italic leading-relaxed text-white md:text-2xl">
                    {testimonial.quote}
                  </p>
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="font-light text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="relative h-[400px] overflow-hidden rounded-3xl">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800 hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.author}
            type="button"
            className={`h-2 w-2 rounded-full transition-colors ${
              index === selectedIndex ? "bg-white" : "bg-gray-700"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Ir al testimonio ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
