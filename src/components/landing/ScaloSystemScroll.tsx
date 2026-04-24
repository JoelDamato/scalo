import { useLayoutEffect, useRef } from "react";
import { BarChart3, Bot, ChartNoAxesCombined, Globe, MessageCircleMore, Users } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import scaloLogo from "@/assets/scalo-logo.png";
import { LandingCTAButton } from "@/components/landing/LandingCTAButton";

gsap.registerPlugin(ScrollTrigger);

const scenes = [
  {
    number: "01",
    title: "IDENTIDAD",
    description: "Todo comienza con una idea.",
  },
  {
    number: "02",
    title: "DESARME",
    description: "Desarmamos el caos para entender cada parte.",
  },
  {
    number: "03",
    title: "SISTEMA",
    description: "Cada pieza cumple una función. Todo está conectado.",
  },
  {
    number: "04",
    title: "SISTEMA ACTIVO",
    description: "El sistema trabaja, tu negocio escala.",
  },
  {
    number: "05",
    title: "RESULTADOS",
    description: "Más ventas.\nMenos caos.\nMás libertad.",
  },
];

const modules = [
  { key: "leads", label: "Leads", icon: Users, className: "left-[12%] top-[18%]" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircleMore, className: "right-[12%] top-[20%]" },
  { key: "web", label: "Web / Forms", icon: Globe, className: "left-[14%] bottom-[20%]" },
  { key: "crm", label: "CRM", icon: ChartNoAxesCombined, className: "right-[15%] bottom-[22%]" },
  { key: "automation", label: "Automatización", icon: Bot, className: "left-[28%] bottom-[8%]" },
  { key: "analytics", label: "Analytics", icon: BarChart3, className: "right-[26%] bottom-[10%]" },
];
const textOffsets = [96, 44, -12, -44, -68];

export function ScaloSystemScroll() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const desktopVisualRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(min-width: 1024px)", () => {
        const textScenes = gsap.utils.toArray<HTMLElement>("[data-system-text-scene]");
        const visualScenes = gsap.utils.toArray<HTMLElement>("[data-system-visual-scene]");
        const particles = gsap.utils.toArray<HTMLElement>("[data-chaos-particle]");
        const shards = gsap.utils.toArray<HTMLElement>("[data-logo-shard]");
        const flashes = gsap.utils.toArray<HTMLElement>("[data-chaos-flash]");
        const dots = gsap.utils.toArray<HTMLElement>("[data-chaos-dot]");
        const nodes = gsap.utils.toArray<HTMLElement>("[data-system-node]");
        const paths = gsap.utils.toArray<SVGPathElement>("[data-system-path]");
        const orbits = gsap.utils.toArray<HTMLElement>("[data-orbit-ring]");
        const orbitDots = gsap.utils.toArray<HTMLElement>("[data-orbit-dot]");
        const resultLines = gsap.utils.toArray<HTMLElement>("[data-result-line]");
        const backgroundParticles = gsap.utils.toArray<HTMLElement>("[data-bg-particle]");
        const burstParticles = gsap.utils.toArray<HTMLElement>("[data-brand-burst-particle]");

        gsap.set(textScenes, { autoAlpha: 0, y: 28, x: 110 });
        gsap.set(visualScenes, { autoAlpha: 0 });
        gsap.set("[data-scene='identity-logo']", { autoAlpha: 0, scale: 0.9, filter: "blur(8px)" });
        gsap.set(shards, { autoAlpha: 0, scale: 0.92, filter: "blur(6px)" });
        gsap.set(particles, { autoAlpha: 0, scale: 0.5 });
        gsap.set(flashes, { autoAlpha: 0, scaleX: 0.3 });
        gsap.set(dots, { autoAlpha: 0, scale: 0.3 });
        gsap.set("[data-system-core]", { autoAlpha: 0, scale: 0.88, filter: "blur(10px)" });
        gsap.set(nodes, { autoAlpha: 0, y: 22, scale: 0.92 });
        gsap.set("[data-system-grid]", { autoAlpha: 0 });
        gsap.set("[data-system-glow]", { autoAlpha: 0 });
        gsap.set("[data-active-core]", { autoAlpha: 0, scale: 0.88 });
        gsap.set(orbits, { autoAlpha: 0, scale: 0.8 });
        gsap.set(orbitDots, { autoAlpha: 0, scale: 0.4 });
        gsap.set("[data-result-logo]", { autoAlpha: 0, scale: 0.88, filter: "blur(8px)" });
        gsap.set("[data-result-cta]", { autoAlpha: 0, y: 24 });
        gsap.set(resultLines, { autoAlpha: 0, scaleX: 0.25 });
        gsap.set(backgroundParticles, { autoAlpha: 0.18, scale: 0.5 });
        gsap.set(burstParticles, { autoAlpha: 0, scale: 0.2 });
        gsap.set("[data-brand-word]", { autoAlpha: 0, scale: 0.9, filter: "blur(8px)" });
        gsap.set("[data-brand-subtitle]", { autoAlpha: 0, y: 24 });

        paths.forEach((path) => {
          const length = path.getTotalLength();
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length}`;
        });

        gsap.set(textScenes[0], { autoAlpha: 1, y: 0, x: textOffsets[0] });
        gsap.set(visualScenes[0], { autoAlpha: 1 });

        const ambient = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
        ambient.to("[data-system-core-pulse]", { scale: 1.06, duration: 2.4 });
        ambient.to(
          backgroundParticles,
          {
            y: (index) => (index % 2 === 0 ? -28 : 24),
            x: (index) => (index % 3 === 0 ? 18 : -16),
            scale: (index) => 0.85 + (index % 5) * 0.08,
            opacity: (index) => 0.22 + (index % 4) * 0.05,
            duration: 4.8,
            stagger: 0.04,
          },
          0,
        );

        orbits.forEach((orbit, index) => {
          gsap.to(orbit, {
            rotate: index % 2 === 0 ? 360 : -360,
            duration: 28 + index * 6,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          });
        });

        orbitDots.forEach((dot, index) => {
          gsap.to(dot, {
            scale: 1.18,
            opacity: 1,
            duration: 1.6 + index * 0.18,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        const showScene = (index: number) => {
          gsap.to(textScenes, {
            autoAlpha: 0,
            y: 28,
            x: 110,
            duration: 0.35,
            overwrite: "auto",
          });
          gsap.to(visualScenes, {
            autoAlpha: 0,
            duration: 0.35,
            overwrite: "auto",
          });
          if (index !== 3) {
            gsap.to(textScenes[index], {
              autoAlpha: 1,
              y: 0,
              x: textOffsets[index],
              duration: 0.55,
              ease: "power3.out",
              overwrite: "auto",
            });
          }
          gsap.to(visualScenes[index], {
            autoAlpha: 1,
            duration: 0.55,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=5000",
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });

        timeline.add(() => showScene(0), 0);
        timeline.to("[data-scene='identity-logo']", {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }, 0);
        timeline.to("[data-scene='identity-logo']", {
          boxShadow: "0 0 90px rgba(255,255,255,0.18)",
          duration: 1,
        }, 0.2);
        timeline.to(backgroundParticles, {
          autoAlpha: 0.26,
          scale: 0.82,
          duration: 0.9,
          stagger: 0.02,
        }, 0.1);

        timeline.add(() => showScene(1), 1);
        timeline.to("[data-scene='identity-logo']", {
          autoAlpha: 0.22,
          scale: 0.96,
          filter: "blur(10px)",
          duration: 0.8,
          ease: "power2.out",
        }, 1);
        timeline.to(shards, {
          autoAlpha: 1,
          x: (index) => [-160, 170, -190, 200][index] ?? 0,
          y: (index) => [-100, -30, 92, 120][index] ?? 0,
          rotate: (index) => [-14, 12, -10, 9][index] ?? 0,
          scale: 1.06,
          filter: "blur(0px)",
          stagger: 0.04,
          duration: 1,
          ease: "power3.out",
        }, 1.05);
        timeline.to(particles, {
          autoAlpha: 0.95,
          x: (index) => (index % 2 === 0 ? -220 : 220) + (index % 5) * 22,
          y: (index) => -120 + (index % 6) * 42,
          scale: 1,
          stagger: 0.015,
          duration: 1,
          ease: "power2.out",
        }, 1.06);
        timeline.to(flashes, {
          autoAlpha: 0.75,
          scaleX: 1,
          stagger: 0.03,
          duration: 0.22,
          ease: "power2.out",
        }, 1.08);
        timeline.to(dots, {
          autoAlpha: 1,
          scale: 1,
          stagger: 0.02,
          duration: 0.5,
          ease: "power2.out",
        }, 1.14);
        timeline.to(backgroundParticles, {
          autoAlpha: 0.72,
          scale: 1.08,
          x: (index) => (index % 2 === 0 ? -36 : 36) + (index % 4) * 7,
          y: (index) => -38 + (index % 6) * 16,
          duration: 1,
          stagger: 0.01,
          ease: "power2.out",
        }, 1.05);

        timeline.add(() => showScene(2), 2);
        timeline.to([...shards, ...particles, ...flashes, ...dots], {
          autoAlpha: 0,
          duration: 0.45,
          ease: "power2.out",
        }, 2);
        timeline.to("[data-system-grid]", {
          autoAlpha: 0.55,
          duration: 0.8,
        }, 2.02);
        timeline.to("[data-system-core]", {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power4.out",
        }, 2.05);
        timeline.to("[data-system-glow]", {
          autoAlpha: 1,
          duration: 0.75,
          ease: "power2.out",
        }, 2.1);
        timeline.to(paths, {
          strokeDashoffset: 0,
          duration: 1,
          ease: "power2.out",
          stagger: 0.08,
        }, 2.12);
        timeline.to(nodes, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.07,
        }, 2.18);
        timeline.to(backgroundParticles, {
          autoAlpha: 0.42,
          scale: 0.9,
          x: (index) => (index % 2 === 0 ? -18 : 18),
          y: (index) => -18 + (index % 6) * 10,
          duration: 0.9,
          stagger: 0.01,
          ease: "power2.out",
        }, 2.12);

        timeline.add(() => showScene(3), 3);
        timeline.to("[data-system-core]", {
          autoAlpha: 0.15,
          scale: 0.95,
          duration: 0.5,
        }, 3);
        timeline.to(nodes, {
          autoAlpha: 0.18,
          duration: 0.45,
          stagger: 0,
        }, 3);
        timeline.to(paths, {
          opacity: 0.2,
          duration: 0.45,
          stagger: 0,
        }, 3);
        timeline.to("[data-active-core]", {
          autoAlpha: 1,
          scale: 1,
          duration: 0.45,
          ease: "power3.out",
        }, 3.08);
        timeline.to("[data-active-core]", {
          autoAlpha: 0,
          scale: 0.7,
          duration: 0.42,
          ease: "power2.in",
        }, 3.42);
        timeline.to(orbits, {
          autoAlpha: 0,
          scale: 1.18,
          duration: 0.52,
          stagger: 0.04,
          ease: "power2.in",
        }, 3.4);
        timeline.to(orbitDots, {
          autoAlpha: 0,
          scale: 1.6,
          duration: 0.42,
          stagger: 0.02,
          ease: "power2.in",
        }, 3.38);
        timeline.to(burstParticles, {
          autoAlpha: 0.95,
          x: (index) => ((index % 2 === 0 ? -1 : 1) * (180 + (index % 8) * 22)),
          y: (index) => -120 + (index % 10) * 28,
          scale: (index) => 0.8 + (index % 5) * 0.15,
          duration: 0.95,
          stagger: 0.01,
          ease: "power3.out",
        }, 3.44);
        timeline.to("[data-brand-word]", {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power4.out",
        }, 3.56);
        timeline.to("[data-brand-subtitle]", {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        }, 3.68);
        timeline.to(backgroundParticles, {
          autoAlpha: 0.72,
          scale: 1.18,
          x: (index) => (index % 2 === 0 ? -82 : 82),
          y: (index) => -68 + (index % 8) * 18,
          duration: 0.9,
          stagger: 0.012,
          ease: "power2.out",
        }, 3.1);

        timeline.add(() => showScene(4), 4);
        timeline.to(orbits, {
          autoAlpha: 0.14,
          duration: 0.5,
        }, 4);
        timeline.to(orbitDots, {
          autoAlpha: 0.12,
          duration: 0.45,
        }, 4);
        timeline.to("[data-brand-word]", {
          autoAlpha: 0.28,
          scale: 1.08,
          duration: 0.42,
          ease: "power2.out",
        }, 4);
        timeline.to("[data-brand-subtitle]", {
          autoAlpha: 0.2,
          y: -10,
          duration: 0.35,
          ease: "power2.out",
        }, 4);
        timeline.to(burstParticles, {
          autoAlpha: 0.12,
          scale: 0.5,
          duration: 0.45,
          stagger: 0.006,
          ease: "power2.out",
        }, 4.02);
        timeline.to(resultLines, {
          autoAlpha: 0.7,
          scaleX: 1,
          duration: 0.85,
          ease: "power2.out",
          stagger: 0.06,
        }, 4.06);
        timeline.to("[data-result-logo]", {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.05,
          ease: "power4.out",
        }, 4.12);
        timeline.to("[data-result-cta]", {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        }, 4.28);
        timeline.to(backgroundParticles, {
          autoAlpha: 0.34,
          scale: 0.78,
          x: 0,
          y: 0,
          duration: 0.85,
          stagger: 0.008,
          ease: "power2.out",
        }, 4.12);
      });

      mm.add("(max-width: 1023px)", () => {
        const mobileScenes = gsap.utils.toArray<HTMLElement>("[data-mobile-scene]");

        mobileScenes.forEach((scene) => {
          const targets = scene.querySelectorAll("[data-mobile-reveal]");
          gsap.from(targets, {
            opacity: 0,
            y: 40,
            scale: 0.96,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: scene,
              start: "top 80%",
              once: true,
            },
          });
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
      id="sistema-scalo"
      className="relative overflow-hidden border-y border-white/10 bg-black"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_26%,transparent_74%,rgba(255,255,255,0.04))]" />
      {Array.from({ length: 26 }).map((_, index) => (
        <span
          key={`bg-particle-${index}`}
          data-bg-particle
          className="pointer-events-none absolute rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.24)]"
          style={{
            width: `${index % 5 === 0 ? 4 : 2}px`,
            height: `${index % 5 === 0 ? 4 : 2}px`,
            left: `${8 + ((index * 13) % 84)}%`,
            top: `${10 + ((index * 17) % 76)}%`,
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-y-0 left-[7%] hidden w-px bg-white/8 lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-[7%] hidden w-px bg-white/8 lg:block" />

      <div className="hidden lg:block">
        <div className="container min-h-screen py-12">
          <div className="grid min-h-[calc(100vh-6rem)] grid-cols-[0.58fr,0.42fr] gap-8">
            <div ref={desktopVisualRef} className="relative order-1 flex items-center justify-center overflow-visible py-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-10" />

              <div
                data-system-visual-scene
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  data-scene="identity-logo"
                  className="relative rounded-[28px] border border-white/12 bg-white/[0.03] p-10 shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-md"
                >
                  <div className="absolute inset-[-28px] rounded-[40px] bg-white/10 blur-3xl" />
                  <img src={scaloLogo} alt="Scalo" className="relative h-28 w-28 rounded-[24px] object-contain" />
                </div>
              </div>

              <div
                data-system-visual-scene
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative h-[560px] w-full max-w-[760px]">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <span
                      key={`particle-${index}`}
                      data-chaos-particle
                      className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.45)]"
                      style={{
                        marginLeft: `${(index % 3) * 8 - 8}px`,
                        marginTop: `${Math.floor(index / 3) * 6 - 12}px`,
                      }}
                    />
                  ))}
                  {[
                    "left-[36%] top-[34%]",
                    "right-[37%] top-[36%]",
                    "left-[38%] bottom-[30%]",
                    "right-[35%] bottom-[28%]",
                  ].map((position, index) => (
                    <div
                      key={`shard-${index}`}
                      data-logo-shard
                      className={`absolute ${position} rounded-[22px] border border-white/14 bg-white/[0.05] p-5 shadow-[0_0_48px_rgba(255,255,255,0.08)]`}
                    >
                      <img src={scaloLogo} alt="" className="h-16 w-16 rounded-[14px] object-contain opacity-90" />
                    </div>
                  ))}
                  {[24, 36, 48, 60, 72].map((top, index) => (
                    <span
                      key={`flash-${top}`}
                      data-chaos-flash
                      className="absolute left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      style={{ top: `${top}%` }}
                    />
                  ))}
                  {[
                    "left-[18%] top-[18%]",
                    "right-[18%] top-[16%]",
                    "left-[12%] top-[48%]",
                    "right-[14%] top-[46%]",
                    "left-[24%] bottom-[16%]",
                    "right-[22%] bottom-[14%]",
                    "left-[42%] top-[18%]",
                    "right-[42%] bottom-[16%]",
                  ].map((position, index) => (
                    <span
                      key={`dot-${index}`}
                      data-chaos-dot
                      className={`absolute ${position} h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.45)]`}
                    />
                  ))}
                </div>
              </div>

              <div
                data-system-visual-scene
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative h-[600px] w-full max-w-[820px]">
                  <div data-system-grid className="absolute inset-[10%] rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-sm" />
                  <div data-system-glow className="absolute inset-[18%] rounded-full bg-white/10 blur-[90px]" />

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 820 600" fill="none" aria-hidden="true">
                    <path data-system-path d="M410 300 L235 145" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                    <path data-system-path d="M410 300 L590 150" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                    <path data-system-path d="M410 300 L240 455" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                    <path data-system-path d="M410 300 L585 448" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                    <path data-system-path d="M410 300 L320 530" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                    <path data-system-path d="M410 300 L505 536" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>

                  <div
                    data-system-core
                    className="absolute left-1/2 top-1/2 z-10 -ml-[76px] -mt-[76px] flex h-[152px] w-[152px] items-center justify-center rounded-[34px] border border-white/14 bg-black/75 shadow-[0_0_60px_rgba(255,255,255,0.12)] backdrop-blur-xl"
                  >
                    <div data-system-core-pulse className="absolute inset-[-18px] rounded-[44px] border border-white/10" />
                    <img src={scaloLogo} alt="Scalo" className="h-20 w-20 rounded-[20px] object-contain" />
                  </div>

                  {modules.map((module) => {
                    const Icon = module.icon;

                    return (
                      <div
                        key={module.key}
                        data-system-node
                        className={`absolute ${module.className} z-10 min-w-[150px] rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 shadow-[0_0_36px_rgba(255,255,255,0.07)] backdrop-blur-md`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-md border border-white/10 bg-white/10 p-2 text-white">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-white/92">{module.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                data-system-visual-scene
                className="absolute inset-0 z-20 flex items-center justify-center"
              >
                <div className="relative h-[600px] w-full max-w-[760px]">
                  {Array.from({ length: 64 }).map((_, index) => (
                    <span
                      key={`burst-${index}`}
                      data-brand-burst-particle
                      className="absolute left-1/2 top-1/2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.34)]"
                      style={{
                        width: `${index % 7 === 0 ? 4 : 2}px`,
                        height: `${index % 7 === 0 ? 4 : 2}px`,
                      }}
                    />
                  ))}

                  <div data-active-core className="absolute left-1/2 top-1/2 z-10 -ml-[72px] -mt-[72px] flex h-36 w-36 items-center justify-center rounded-[32px] border border-white/14 bg-black/80 shadow-[0_0_60px_rgba(255,255,255,0.12)] backdrop-blur-xl">
                    <div data-system-core-pulse className="absolute inset-[-16px] rounded-[40px] border border-white/12" />
                    <img src={scaloLogo} alt="Scalo" className="h-[72px] w-[72px] rounded-[18px] object-contain" />
                  </div>

                  {["h-[420px] w-[420px]", "h-[520px] w-[520px]", "h-[620px] w-[620px]"].map((size, index) => (
                    <div
                      key={size}
                      data-orbit-ring
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                        index === 1 ? "border-white/12" : "border-white/10"
                      } ${size}`}
                    />
                  ))}

                  {[
                    "left-[50%] top-[15%]",
                    "left-[76%] top-[38%]",
                    "left-[28%] top-[34%]",
                    "left-[56%] bottom-[14%]",
                    "left-[22%] bottom-[22%]",
                    "right-[18%] bottom-[24%]",
                  ].map((position, index) => (
                    <span
                      key={`orbit-dot-${index}`}
                      data-orbit-dot
                      className={`absolute ${position} h-3 w-3 rounded-full bg-white/85 shadow-[0_0_22px_rgba(255,255,255,0.45)]`}
                    />
                  ))}

                  <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[100vw] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-8 text-center">
                    <div
                      data-brand-word
                      className="bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-center text-[clamp(4.3rem,15vw,11rem)] font-medium leading-none tracking-[0.18em] text-transparent"
                    >
                      SCALO
                    </div>
                    <p
                      data-brand-subtitle
                      className="mt-5 max-w-none text-center text-[clamp(0.9rem,1.55vw,1.25rem)] font-light tracking-[0.22em] text-white/74"
                    >
                      un click menos, mas scalo
                    </p>
                  </div>
                </div>
              </div>

              <div
                data-system-visual-scene
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative flex w-full max-w-[780px] flex-col items-center justify-center">
                  <div className="mb-10 flex w-full max-w-[520px] flex-col gap-4">
                    {[0, 1, 2].map((line) => (
                      <span
                        key={line}
                        data-result-line
                        className="h-px w-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      />
                    ))}
                  </div>

                  <div
                    data-result-logo
                    className="relative rounded-[34px] border border-white/14 bg-white/[0.04] p-10 shadow-[0_0_100px_rgba(255,255,255,0.12)] backdrop-blur-xl"
                  >
                    <div className="absolute inset-[-34px] rounded-[48px] bg-white/10 blur-[70px]" />
                    <img src={scaloLogo} alt="Scalo" className="relative h-32 w-32 rounded-[28px] object-contain" />
                  </div>

                  <div data-result-cta className="mt-12">
                    <LandingCTAButton
                      size="lg"
                      className="border border-white/15 bg-white text-black hover:bg-white/92"
                      scrollTo="#contacto"
                    >
                      Automatizar mi negocio
                    </LandingCTAButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative order-2 flex items-center py-10 pl-6">
              {scenes.map((scene, index) => (
                <div
                  key={scene.number}
                  data-system-text-scene
                  className={`absolute inset-y-0 right-0 flex w-full max-w-[360px] flex-col justify-center gap-5 ${
                    index === scenes.length - 1 ? "max-w-[390px]" : ""
                  }`}
                >
                  <span className="text-[11px] tracking-[0.42em] text-white/45">{scene.number}</span>
                  <h2 className="text-3xl font-medium tracking-[0.14em] text-white xl:text-4xl">{scene.title}</h2>
                  <p className="whitespace-pre-line text-lg font-light leading-relaxed text-white/68 xl:text-xl">
                    {scene.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="container space-y-12 px-4 py-16 sm:px-6">
          {scenes.map((scene, index) => (
            <article
              key={scene.number}
              data-mobile-scene
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-sm"
            >
              <div className="space-y-4">
                <span data-mobile-reveal className="block text-[11px] tracking-[0.42em] text-white/45">
                  {scene.number}
                </span>
                <h2 data-mobile-reveal className="text-2xl font-medium tracking-[0.12em] text-white">
                  {scene.title}
                </h2>
                <p data-mobile-reveal className="whitespace-pre-line text-base font-light leading-relaxed text-white/68">
                  {scene.description}
                </p>
              </div>

              <div className="mt-8" data-mobile-reveal>
                {index === 0 && (
                  <div className="relative flex items-center justify-center rounded-lg border border-white/10 bg-black/70 p-8 shadow-[0_0_50px_rgba(255,255,255,0.08)]">
                    <div className="absolute inset-[-14px] rounded-[22px] bg-white/10 blur-2xl" />
                    <img src={scaloLogo} alt="Scalo" className="relative h-24 w-24 rounded-[20px] object-contain" />
                  </div>
                )}

                {index === 1 && (
                  <div className="relative h-44 rounded-lg border border-white/10 bg-black/70">
                    {[
                      "left-[12%] top-[20%]",
                      "right-[12%] top-[24%]",
                      "left-[22%] bottom-[18%]",
                      "right-[18%] bottom-[14%]",
                    ].map((position) => (
                      <div key={position} className={`absolute ${position} rounded-xl border border-white/12 bg-white/[0.05] p-3`}>
                        <img src={scaloLogo} alt="" className="h-10 w-10 rounded-lg object-contain opacity-90" />
                      </div>
                    ))}
                  </div>
                )}

                {index === 2 && (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-black/70 p-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]">
                      <img src={scaloLogo} alt="Scalo" className="h-10 w-10 rounded-xl object-contain" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {modules.map((module) => {
                        const Icon = module.icon;

                        return (
                          <div key={module.key} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-white" />
                              <span className="text-xs text-white/88">{module.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {index === 3 && (
                  <div className="relative flex h-48 items-center justify-center rounded-lg border border-white/10 bg-black/70">
                    <div className="absolute h-28 w-28 rounded-full border border-white/10" />
                    <div className="absolute h-40 w-40 rounded-full border border-white/10" />
                    <div className="absolute h-52 w-52 rounded-full border border-white/10" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                      <img src={scaloLogo} alt="Scalo" className="h-10 w-10 rounded-xl object-contain" />
                    </div>
                  </div>
                )}

                {index === 4 && (
                  <div className="space-y-6 rounded-lg border border-white/10 bg-black/70 p-6 text-center">
                    <div className="relative mx-auto w-fit rounded-[28px] border border-white/12 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                      <img src={scaloLogo} alt="Scalo" className="h-20 w-20 rounded-[18px] object-contain" />
                    </div>
                    <LandingCTAButton
                      size="lg"
                      className="border border-white/15 bg-white text-black hover:bg-white/92"
                      scrollTo="#contacto"
                    >
                      Automatizar mi negocio
                    </LandingCTAButton>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
