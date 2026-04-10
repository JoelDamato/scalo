import { ArrowRight, Bot, CalendarCheck2, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DAYS_PER_MONTH = 30;
const AI_RECOVERY_RATE = 0.1;
const MANUAL_RECOVERY_RATE = 0.02;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatUsd(value: number) {
  return usdFormatter.format(value);
}

function formatCount(value: number) {
  return integerFormatter.format(Math.round(value));
}

export default function RoiCalculator() {
  const [missedLeadsPerDay, setMissedLeadsPerDay] = useState(50);
  const [averageTicket, setAverageTicket] = useState(50);

  const monthlyOpportunities = Math.max(missedLeadsPerDay, 0) * DAYS_PER_MONTH;
  const aiRecovered = monthlyOpportunities * AI_RECOVERY_RATE;
  const manualRecovered = monthlyOpportunities * MANUAL_RECOVERY_RATE;
  const extraMonthlyRevenue = Math.max(aiRecovered - manualRecovered, 0) * Math.max(averageTicket, 0);
  const shouldShowCta = extraMonthlyRevenue > 500;

  const exampleLeads = 50;
  const exampleTicket = 50;
  const exampleRevenue =
    exampleLeads * DAYS_PER_MONTH * (AI_RECOVERY_RATE - MANUAL_RECOVERY_RATE) * exampleTicket;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(72,187,120,0.22),_transparent_42%),radial-gradient(circle_at_80%_0%,_rgba(99,102,241,0.24),_transparent_32%)]" />

        <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <header className="flex flex-col items-center gap-6 pt-2 text-center sm:pt-6">
            <Link to="/" className="transition-transform duration-200 hover:scale-[1.02]">
              <img
                src="/logo.png"
                alt="Scalo"
                className="h-auto w-[14rem] sm:w-[18rem] md:w-[24rem] lg:w-[30rem]"
              />
            </Link>

            <div className="max-w-4xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Calculadora publica para medir el impacto de respuestas rapidas y automatizaciones
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
                  Cuanto mas podrias facturar
                  <span className="block bg-gradient-to-r from-emerald-300 via-white to-indigo-300 bg-clip-text text-transparent">
                    si respondieras en minutos y no en horas
                  </span>
                </h1>
                <p className="mx-auto max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
                  Esta calculadora estima el beneficio extra que puede generar un sistema con IA, seguimiento
                  automatico y mas agendas recuperadas para tu negocio.
                </p>
              </div>
            </div>

            <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
              <Card className="border-white/10 bg-white/[0.04] p-5 text-left text-white backdrop-blur">
                <Clock3 className="mb-4 h-5 w-5 text-emerald-300" />
                <p className="text-sm font-medium text-white">Respuesta inmediata</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Menos consultas perdidas por demoras, fines de semana o saturacion del equipo.
                </p>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] p-5 text-left text-white backdrop-blur">
                <Bot className="mb-4 h-5 w-5 text-indigo-300" />
                <p className="text-sm font-medium text-white">Seguimiento automatico</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Recordatorios, reactivacion y respuestas consistentes sin depender de perseguir cada lead.
                </p>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] p-5 text-left text-white backdrop-blur">
                <CalendarCheck2 className="mb-4 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-medium text-white">Mas agendas cerradas</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Mejor experiencia para el cliente y mas ventas o turnos concretados cada mes.
                </p>
              </Card>
            </div>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-[#0d0d0f] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">Calculadora de ROI</p>
                  <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
                    Beneficio extra por respuestas rapidas y automatizaciones que aumentan agendas
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
                    Comparamos una recuperacion automatizada del 10% frente a un seguimiento manual o generico del
                    2%. Ajusta tus numeros y mira el impacto mensual estimado.
                  </p>
                </div>

                <div className="grid gap-6">
                  <label className="space-y-3">
                    <span className="text-sm font-medium text-white/80">Consultas u oportunidades perdidas por dia</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={missedLeadsPerDay}
                      onChange={(event) => setMissedLeadsPerDay(Number(event.target.value) || 0)}
                      className="h-16 w-full rounded-2xl border border-indigo-400/60 bg-[#131316] px-5 text-2xl text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
                    />
                  </label>

                  <label className="space-y-3">
                    <span className="text-sm font-medium text-white/80">Ticket promedio por agenda o venta (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={averageTicket}
                      onChange={(event) => setAverageTicket(Number(event.target.value) || 0)}
                      className="h-16 w-full rounded-2xl border border-indigo-400/60 bg-[#131316] px-5 text-2xl text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="rounded-[1.5rem] border-white/10 bg-white/[0.03] p-6 text-center text-white">
                    <p className="text-sm text-white/55">Agendas o ventas recuperadas con IA</p>
                    <p className="mt-3 text-4xl font-semibold text-emerald-300">{formatCount(aiRecovered)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">10% de recuperacion</p>
                  </Card>

                  <Card className="rounded-[1.5rem] border-white/10 bg-white/[0.03] p-6 text-center text-white">
                    <p className="text-sm text-white/55">Recuperacion con seguimiento generico</p>
                    <p className="mt-3 text-4xl font-semibold text-rose-300">{formatCount(manualRecovered)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">2% de recuperacion</p>
                  </Card>
                </div>

                <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,_rgba(66,153,225,0.95),_rgba(139,92,246,0.98))] px-6 py-8 text-center shadow-[0_25px_60px_rgba(89,97,255,0.28)] sm:px-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
                    Ganancia mensual extra
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                    {formatUsd(extraMonthlyRevenue)}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-white/45">
                  Cálculo estimado en base a 30 dias, 10% de recuperacion automatizada y 2% de seguimiento manual.
                  El objetivo es mostrar la diferencia de velocidad, constancia y seguimiento.
                </p>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[2rem] border-emerald-400/15 bg-emerald-300/5 p-6 text-white sm:p-8">
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/80">Lectura rapida</p>
                <h3 className="mt-4 text-2xl font-medium text-white">Tu negocio ya te esta mostrando una oportunidad</h3>
                <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
                  <p>
                    Hoy estas dejando pasar <span className="font-semibold text-white">{formatCount(monthlyOpportunities)}</span>{" "}
                    oportunidades al mes entre respuestas tardias, seguimientos que no salen y agendas que se enfrían.
                  </p>
                  <p>
                    Con una automatizacion bien hecha, podrías recuperar{" "}
                    <span className="font-semibold text-emerald-300">{formatCount(aiRecovered)}</span> de esas
                    oportunidades cada mes.
                  </p>
                </div>
              </Card>

              <Card className="rounded-[2rem] border-white/10 bg-white/[0.04] p-6 text-white sm:p-8">
                <p className="text-sm uppercase tracking-[0.24em] text-white/50">Ejemplo</p>
                <h3 className="mt-4 text-2xl font-medium text-white">Si hoy se te escapan 50 consultas por dia</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Con un ticket promedio de <span className="font-semibold text-white">USD 50</span>, una mejora del
                  10% de recuperacion contra un 2% de seguimiento generico deja una diferencia de{" "}
                  <span className="font-semibold text-emerald-300">{formatUsd(exampleRevenue)}</span> por mes.
                </p>
              </Card>

              <Card
                className={`rounded-[2rem] border p-6 text-white transition-colors sm:p-8 ${
                  shouldShowCta
                    ? "border-emerald-300/25 bg-gradient-to-br from-emerald-300/12 via-emerald-300/5 to-transparent"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                {shouldShowCta ? (
                  <div className="space-y-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/80">Tu numero ya da</p>
                    <h3 className="text-3xl font-medium tracking-tight text-white">
                      Si tu cuenta supera los USD 500 por mes, que esperas para que trabajemos juntos
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70">
                      Ya hay margen claro para automatizar respuestas, recuperar agendas y convertir mas sin sumar mas
                      horas operativas.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/90"
                    >
                      <a href="https://wa.me/54935181862" target="_blank" rel="noreferrer">
                        Quiero ver mi caso con Scalo
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-white/50">Siguiente paso</p>
                    <h3 className="text-2xl font-medium text-white">Todavia hay potencial para crecer mas</h3>
                    <p className="text-sm leading-relaxed text-white/70">
                      Ajusta los valores de tu negocio o guarda esta referencia para medir como impactan mejores
                      tiempos de respuesta y automatizaciones sobre tus agendas.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-black/70">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Scalo. Automatizaciones, respuesta rapida y crecimiento.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/" className="transition-colors hover:text-white">
                Inicio
              </Link>
              <Link to="/privacidad" className="transition-colors hover:text-white">
                Privacidad
              </Link>
              <Link to="/terminos" className="transition-colors hover:text-white">
                Terminos
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
