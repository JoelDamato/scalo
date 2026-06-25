import { useEffect, useMemo } from "react";
import { ArrowRight, Check, MapPin, MessageCircle, QrCode, Sparkles } from "lucide-react";

const services = [
  {
    title: "Hero institucional premium",
    description:
      "Una apertura visual de alto impacto con imagen protagonista, mensaje claro y una identidad que se sienta sofisticada desde el primer scroll.",
  },
  {
    title: "Sección sobre Bloom",
    description:
      "Presentación de la marca desde el bienestar, la calma y la confianza, con narrativa cálida y enfoque institucional.",
  },
  {
    title: "Servicios principales",
    description:
      "Bloques ordenados para mostrar la propuesta de valor sin ruido visual, priorizando claridad, estética y conversión.",
  },
  {
    title: "Experiencia y exclusividad",
    description:
      "Una sección pensada para transmitir atmósfera, sensorialidad y la experiencia Bloom más allá de lo técnico.",
  },
  {
    title: "Ubicación + Google Maps",
    description:
      "Integración de mapa y textos orientados a búsqueda local para facilitar consultas, visitas y reservas.",
  },
  {
    title: "CTA y WhatsApp directo",
    description:
      "Llamados a la acción simples, elegantes y visibles para reservar, consultar o iniciar conversación en un toque.",
  },
];

const pillars = [
  "Bienestar como primera impresión, no como agregado.",
  "Diseño con aire visual, tonos cálidos y estética sensorial.",
  "Copy institucional premium, claro y confiable.",
  "Responsive pensado primero para mobile y consulta rápida.",
];

const deliverables = [
  "Landing institucional responsive.",
  "SEO básico con title, meta description, H1/H2 y foco local.",
  "Optimización visual para mobile.",
  "Puesta online en dominio existente.",
  "CTA claros para reservar o consultar.",
];

const bonuses = [
  "QR directo a la landing para compartir en mostrador, packaging o redes.",
  "Ajustes finales de pulido visual incluidos antes de publicar.",
  "Botón de WhatsApp fijo para contacto inmediato.",
];

const gallery = [
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
];

const whatsappHref =
  "https://wa.me/5491123965661?text=Hola%2C%20quiero%20avanzar%20con%20la%20landing%20premium%20de%20Studio%20Bloom.";

const mapEmbedSrc = "https://www.google.com/maps?q=Studio+Bloom&z=15&output=embed";

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    if (property) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export default function StudioBloom() {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://studio-bloom.com";

  const qrSrc = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

  useEffect(() => {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap";
    document.head.appendChild(fontLink);

    document.title = "Studio Bloom | Landing institucional premium";
    setMeta(
      "description",
      "Propuesta para Studio Bloom: landing institucional premium, sensorial y minimalista, con foco en bienestar, exclusividad, SEO local y reservas por WhatsApp.",
    );
    setMeta("og:title", "Studio Bloom | Landing institucional premium", true);
    setMeta(
      "og:description",
      "Una propuesta de landing elegante y cálida para transmitir bienestar, calma, exclusividad y confianza.",
      true,
    );
    setMeta("og:type", "website", true);

    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3ece3] text-[#241c18]">
      <div className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="#inicio"
            className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#6c564a] backdrop-blur-md"
          >
            Studio Bloom
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#c8aa92] bg-[#241c18] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#f7f1ea] transition hover:bg-[#3a2c25]"
          >
            Consultar
          </a>
        </div>
      </div>

      <section
        id="inicio"
        className="relative flex min-h-screen items-end overflow-hidden px-5 pb-10 pt-32 sm:px-8 sm:pb-14 lg:items-center"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1800&q=80"
            alt="Interior cálido y premium con atmósfera de bienestar"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,21,18,0.18)_0%,rgba(29,21,18,0.42)_35%,rgba(29,21,18,0.82)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,245,236,0.35),transparent_34%),radial-gradient(circle_at_80%_25%,rgba(209,177,150,0.22),transparent_28%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:items-end">
          <div className="max-w-3xl text-[#f8f1ea]">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.28em] backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              Propuesta de landing premium
            </div>
            <h1
              className="max-w-4xl text-4xl font-medium leading-[0.95] sm:text-6xl lg:text-8xl"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Studio Bloom como una marca de bienestar exclusiva.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#f1e8df] sm:text-lg sm:leading-8">
              La propuesta es crear una landing institucional elegante, sensorial y minimalista que transmita
              calma, exclusividad y confianza. Una presencia digital cálida, refinada y lista para convertir
              consultas en reservas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#inversion"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7efe8] px-6 py-3 text-sm font-medium text-[#241c18] transition hover:bg-white"
              >
                Ver inversión
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                WhatsApp directo
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/20 bg-white/14 p-6 text-[#fff8f3] shadow-2xl backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f1ddd1]">Resumen ejecutivo</div>
            <div
              className="mt-3 text-3xl leading-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              USD 150
            </div>
            <p className="mt-3 text-sm leading-6 text-[#f7ebe3]">
              Landing institucional responsive, con dirección visual premium, CTA claros, Google Maps, WhatsApp y
              SEO básico listo para publicar en el dominio actual.
            </p>
            <div className="mt-6 space-y-3 border-t border-white/15 pt-5">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#ead7ca]">Pago único</div>
                <div className="mt-2 text-lg font-medium">USD 150</div>
                <p className="mt-2 text-sm text-[#f3e8df]">Incluye bonus destacados y prioridad de cierre visual.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#2b211d]/50 p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#ead7ca]">Dos cuotas</div>
                <div className="mt-2 text-lg font-medium">2 x USD 75</div>
                <p className="mt-2 text-sm text-[#f3e8df]">Primera cuota para iniciar. Segunda al momento de publicar.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 lg:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ccb8a5] to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f6f5e]">Sobre Bloom</p>
            <h2
              className="mt-4 text-4xl leading-tight text-[#241c18] sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Una presencia digital que se sienta tan cuidada como la experiencia en el espacio.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[#58453b]">
            <p>
              La landing va a hablar más de bienestar, calma y experiencia que de tratamientos fríos. La idea es que
              cada sección respire, que la marca tenga aire visual y que el lenguaje acompañe esa percepción de
              exclusividad serena.
            </p>
            <p>
              La referencia visual toma el refinamiento editorial de un sitio premium, pero adaptado a Bloom con una
              identidad propia, más cálida, cercana y alineada a una marca de cuidado personal de alto nivel.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-6 sm:px-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-[2rem] border border-[#d9c8b8] bg-[#f8f2ec] p-7 shadow-[0_25px_80px_rgba(92,69,53,0.08)]"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ead9ca] text-[#6b5448]">
                <Check className="h-5 w-5" />
              </div>
              <h3
                className="text-2xl text-[#2b211d]"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#665248]">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2.5rem]">
            <img
              src="https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=1400&q=80"
              alt="Espacio de bienestar con luz cálida y estética sensorial"
              className="h-full min-h-[320px] w-full object-cover sm:min-h-[420px]"
            />
          </div>
          <div className="rounded-[2.5rem] bg-[#241c18] p-8 text-[#f7efe8] sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccb09c]">Experiencia Bloom</p>
            <h2
              className="mt-4 text-4xl leading-tight sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Calma, bienestar y exclusividad en cada scroll.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#e8dace] sm:text-base">
              La dirección visual prioriza fotos grandes, composición limpia, tipografía moderna y una sensación de
              pausa. No buscamos una estética clínica. Buscamos una marca deseable, serena y premium.
            </p>
            <div className="mt-8 space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar} className="flex gap-3 border-b border-white/10 pb-4 text-sm leading-6 text-[#f6ede5]">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f6f5e]">Galería visual</p>
              <h2
                className="mt-4 text-4xl text-[#241c18] sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Una atmósfera que inspira reserva antes de explicar.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#665248] sm:text-base">
              La narrativa visual va a apoyarse en fotografía sensorial, materiales suaves, luz cálida y una sensación
              editorial que eleve la percepción de valor.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[2.25rem]">
              <img
                src={gallery[0]}
                alt="Visual principal premium para Studio Bloom"
                className="h-full min-h-[340px] w-full object-cover sm:min-h-[520px]"
              />
            </div>
            <div className="grid gap-5">
              {gallery.slice(1).map((image, index) => (
                <div key={image} className="overflow-hidden rounded-[2.25rem]">
                  <img
                    src={image}
                    alt={`Detalle visual premium ${index + 1} para Studio Bloom`}
                    className="h-[220px] w-full object-cover sm:h-[250px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2.5rem] bg-[#efe3d7] p-8 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f6f5e]">Ubicación y búsqueda local</p>
            <h2
              className="mt-4 text-4xl leading-tight text-[#241c18] sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Encontrar Bloom debe sentirse tan simple como desear ir.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#5f4a3f] sm:text-base">
              Se incorpora una sección de ubicación con Google Maps y copy pensado para reforzar presencia local,
              facilitar consultas y acompañar la decisión de reserva desde mobile.
            </p>
            <div className="mt-8 rounded-[1.75rem] border border-[#d6c1af] bg-white/70 p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[#8f6f5e]" />
                <div>
                  <div className="text-sm font-medium text-[#2e231e]">Integración de mapa lista</div>
                  <p className="mt-1 text-sm leading-6 text-[#685348]">
                    El mapa puede apuntar a la dirección final del estudio o a la ficha de Google del negocio al
                    momento de publicar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] border border-[#dbc8b8] bg-white shadow-[0_30px_80px_rgba(104,82,67,0.12)]">
            <iframe
              title="Ubicación Studio Bloom"
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[360px] w-full sm:h-[520px]"
            />
          </div>
        </div>
      </section>

      <section id="inversion" className="bg-[#241c18] px-5 py-20 text-[#f7efe8] sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#ccb09c]">Inversión y alcance</p>
              <h2
                className="mt-4 text-4xl leading-tight sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                Una landing premium, lista para transmitir valor desde el primer día.
              </h2>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <div className="text-sm uppercase tracking-[0.24em] text-[#ccb09c]">Incluye</div>
                  <div className="mt-4 space-y-3">
                    {deliverables.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-[#f1e6dd]">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#d7b9a1]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.24em] text-[#ccb09c]">Bonus remarcados</div>
                  <div className="mt-4 space-y-3">
                    {bonuses.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-[#f1e6dd]">
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#d7b9a1]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[2.2rem] border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#ccb09c]">Forma de pago</div>
              <div
                className="mt-3 text-4xl text-[#fff7f0] sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                USD 150
              </div>
              <p className="mt-3 text-sm leading-7 text-[#e8dacf]">
                Presupuesto total del proyecto por el alcance definido para la landing institucional premium de
                Studio Bloom.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] border border-[#d7b9a1] bg-[#f7efe8] p-5 text-[#2c221d]">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#8f6f5e]">Opción 1</div>
                  <div className="mt-2 text-xl font-medium">Pago único · USD 150</div>
                  <p className="mt-2 text-sm leading-6 text-[#5f4a3f]">
                    Ideal para resolver todo en una sola instancia y avanzar con bonus priorizados desde el inicio.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-[#2e231f] p-5">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#ccb09c]">Opción 2</div>
                  <div className="mt-2 text-xl font-medium">Dos cuotas · 2 x USD 75</div>
                  <p className="mt-2 text-sm leading-6 text-[#e9ddd2]">
                    Primera cuota para inicio y segunda cuota contra entrega y puesta online en el dominio existente.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-[#d7b9a1]" />
                  <div className="text-sm font-medium text-[#fff5ed]">Bonus QR considerado</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#e9ddd2]">
                  Se puede entregar un QR directo a la landing para facilitar el acceso desde el local, tarjetas o
                  piezas impresas.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="contacto" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2.5rem] bg-[#efe2d4] p-8 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f6f5e]">Cierre</p>
            <h2
              className="mt-4 text-4xl leading-tight text-[#241c18] sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Lista para sentirse premium, clara y lista para reservar.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#5f4a3f] sm:text-base">
              El objetivo no es solo mostrar servicios. Es hacer que Bloom se perciba como una experiencia exclusiva,
              confiable y deseable desde el primer contacto digital.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#241c18] px-6 py-3 text-sm font-medium text-[#f8f1ea] transition hover:bg-[#3a2c25]"
              >
                Reservar o consultar
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="#inicio"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b99e89] px-6 py-3 text-sm font-medium text-[#241c18] transition hover:bg-white/40"
              >
                Volver arriba
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            <div className="rounded-[2rem] border border-[#dbc8b8] bg-white p-5 shadow-[0_25px_70px_rgba(92,69,53,0.08)]">
              <img src={qrSrc} alt="QR de acceso directo a la propuesta de Studio Bloom" className="w-full rounded-2xl" />
              <p className="mt-4 text-center text-xs uppercase tracking-[0.24em] text-[#8f6f5e]">QR directo</p>
            </div>
            <div className="rounded-[2rem] border border-[#dbc8b8] bg-[#f8f2ec] p-6 shadow-[0_25px_70px_rgba(92,69,53,0.08)]">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#8f6f5e]">Checklist final</div>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3 text-sm leading-6 text-[#5f4a3f]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#8f6f5e]" />
                  <span>Landing institucional premium con enfoque editorial y sensorial.</span>
                </div>
                <div className="flex gap-3 text-sm leading-6 text-[#5f4a3f]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#8f6f5e]" />
                  <span>CTA claros para WhatsApp, consultas y reserva.</span>
                </div>
                <div className="flex gap-3 text-sm leading-6 text-[#5f4a3f]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#8f6f5e]" />
                  <span>SEO básico, mapa integrado, bonus QR y opción de pago único o en dos cuotas.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#241c18] text-[#f7efe8] shadow-[0_20px_50px_rgba(36,28,24,0.35)] transition hover:scale-105 hover:bg-[#3a2c25] sm:bottom-5 sm:right-5"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </main>
  );
}
