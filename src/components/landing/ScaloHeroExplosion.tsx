import { useLayoutEffect, useMemo, useRef } from "react";
import { Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { LandingCTAButton } from "@/components/landing/LandingCTAButton";

gsap.registerPlugin(ScrollTrigger);

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

type SphereNode = {
  theta: number;
  phi: number;
  depth: number;
  size: number;
};

type BurstParticle = {
  angle: number;
  speed: number;
  spread: number;
  size: number;
};

type AmbientParticle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  drift: number;
};

function createSphereNodes(count: number): SphereNode[] {
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / count;
    return {
      theta: ratio * Math.PI * 2.35,
      phi: Math.acos(1 - 2 * ratio),
      depth: 0.74 + (index % 7) * 0.05,
      size: 1.2 + (index % 5) * 0.45,
    };
  });
}

function createBurstParticles(count: number): BurstParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2,
    speed: 0.52 + (index % 11) * 0.055,
    spread: 0.32 + (index % 7) * 0.07,
    size: 1 + (index % 4) * 0.75,
  }));
}

function createAmbientParticles(count: number): AmbientParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    x: ((index * 37) % 100) / 100,
    y: ((index * 29) % 100) / 100,
    radius: 0.7 + (index % 3) * 0.7,
    speed: 0.16 + (index % 5) * 0.03,
    alpha: 0.08 + (index % 4) * 0.03,
    drift: (index % 2 === 0 ? 1 : -1) * (0.8 + (index % 5) * 0.12),
  }));
}

export function ScaloHeroExplosion() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef({ value: 0 });
  const frameRef = useRef<number | null>(null);

  const nodesDesktop = useMemo(() => createSphereNodes(96), []);
  const nodesMobile = useMemo(() => createSphereNodes(54), []);
  const burstDesktop = useMemo(() => createBurstParticles(240), []);
  const burstMobile = useMemo(() => createBurstParticles(120), []);
  const ambientDesktop = useMemo(() => createAmbientParticles(42), []);
  const ambientMobile = useMemo(() => createAmbientParticles(22), []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const mm = gsap.matchMedia();
    const ctxGsap = gsap.context(() => {
      mm.add("(min-width: 768px)", () => {
        const progressTarget = { value: 0 };
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=3400",
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });

        timeline.to(progressTarget, {
          value: 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            progressRef.current.value = progressTarget.value;
          },
        });
      });

      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          progressRef.current,
          { value: 0 },
          {
            value: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=1400",
              scrub: true,
            },
          },
        );
      });
    }, section);

    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const isMobile = width < 768;
      const nodes = isMobile ? nodesMobile : nodesDesktop;
      const burstParticles = isMobile ? burstMobile : burstDesktop;
      const ambient = isMobile ? ambientMobile : ambientDesktop;

      const progress = progressRef.current.value;
      const tension = clamp((progress - 0.22) / 0.18);
      const explosion = easeOutExpo(clamp((progress - 0.47) / 0.18));
      const dissipate = clamp((progress - 0.66) / 0.22);

      const centerX = width * (isMobile ? 0.5 : 0.62);
      const centerY = height * 0.48;
      const radius = Math.min(width, height) * (isMobile ? 0.16 : 0.21);
      const rotation = time * 0.00018 * (1 + tension * 2.5);
      const pulse = 1 + Math.sin(time * 0.0035) * 0.025;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const radial = ctx.createRadialGradient(centerX, centerY - height * 0.08, radius * 0.25, centerX, centerY, radius * 3.6);
      radial.addColorStop(0, `rgba(8, 204, 184, ${0.08 + tension * 0.08})`);
      radial.addColorStop(0.42, "rgba(255,255,255,0.06)");
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      ambient.forEach((particle) => {
        const x = particle.x * width + Math.sin(time * 0.00018 * particle.drift + particle.x * 12) * 24;
        const y = particle.y * height + ((time * 0.01 * particle.speed) % height);
        ctx.beginPath();
        ctx.fillStyle = `rgba(184, 255, 247, ${particle.alpha + tension * 0.06})`;
        ctx.arc(x % width, y % height, particle.radius + tension * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      const projected = nodes.map((node, index) => {
        const theta = node.theta + rotation + index * 0.006;
        const x3 = radius * Math.sin(node.phi) * Math.cos(theta);
        const y3 = radius * Math.cos(node.phi);
        const z3 = radius * Math.sin(node.phi) * Math.sin(theta);
        const perspective = 1 + (z3 / radius) * 0.35;
        const baseX = centerX + x3 * perspective;
        const baseY = centerY + y3 * perspective;

        const burst = burstParticles[index % burstParticles.length];
        const burstDistance = Math.min(width, height) * (0.18 + burst.speed * 0.12) * explosion;
        const burstX = centerX + Math.cos(burst.angle) * burstDistance;
        const burstY = centerY + Math.sin(burst.angle) * burstDistance * burst.spread;
        const explodeMix = clamp((progress - 0.47) / 0.18);
        const driftDistance = Math.min(width, height) * 0.16 * dissipate;
        const driftX = burstX + Math.cos(burst.angle) * driftDistance;
        const driftY = burstY + Math.sin(burst.angle) * driftDistance * burst.spread;
        const explodedX = lerp(baseX, burstX, explodeMix);
        const explodedY = lerp(baseY, burstY, explodeMix);

        return {
          x: lerp(explodedX, driftX, dissipate),
          y: lerp(explodedY, driftY, dissipate),
          depth: z3,
          size: node.size * (1 + tension * 0.8) * (1 - dissipate * 0.35),
        };
      });

      const edgeAlpha = clamp(1 - explosion * 1.2);
      if (edgeAlpha > 0.02) {
        ctx.lineWidth = 0.9 + tension * 0.45;
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const a = projected[i];
            const b = projected[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < radius * 0.68) {
              const alpha = (1 - distance / (radius * 0.68)) * 0.18 * edgeAlpha;
              ctx.strokeStyle = `rgba(170, 255, 244, ${alpha + tension * 0.04})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();

              if ((i + j) % 18 === 0) {
                const flow = ((time * 0.00032) + (i + j) * 0.01) % 1;
                const px = lerp(a.x, b.x, flow);
                const py = lerp(a.y, b.y, flow);
                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${0.48 * edgeAlpha})`;
                ctx.arc(px, py, 1.4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
      }

      projected.forEach((node, index) => {
        const alpha = 0.5 + clamp((node.depth + radius) / (radius * 2), 0, 1) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(219,255,250,${alpha * (1 - dissipate * 0.45)})`;
        ctx.shadowBlur = 16 + tension * 16;
        ctx.shadowColor = tension > 0.2 ? "rgba(84,255,232,0.68)" : "rgba(255,255,255,0.5)";
        ctx.arc(node.x, node.y, node.size + explosion * 0.85 + (index % 3 === 0 ? 0.6 : 0), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      if (explosion > 0.05) {
        const shockwave = clamp((progress - 0.5) / 0.16);
        const shockRadius = radius * 0.65 + shockwave * Math.min(width, height) * 0.62;
        ctx.strokeStyle = `rgba(200,255,248,${0.32 * (1 - shockwave)})`;
        ctx.lineWidth = 2 + (1 - shockwave) * 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      const brandAlpha = clamp(1 - explosion * 1.3) * (1 - dissipate * 0.8);
      const brandSize = Math.min(width * 0.14, isMobile ? 58 : 112) * pulse * (1 + tension * 0.08);
      ctx.save();
      ctx.globalAlpha = clamp(brandAlpha, 0, 1);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 24 + tension * 20;
      ctx.shadowColor = tension > 0.2 ? "rgba(90,255,230,0.55)" : "rgba(255,255,255,0.32)";
      ctx.fillStyle = "#f8fffe";
      ctx.font = `600 ${brandSize}px "DM Sans", sans-serif`;
      ctx.fillText("SCALO", centerX, centerY);
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resizeCanvas);
      ctxGsap.revert();
      mm.revert();
    };
  }, [ambientDesktop, ambientMobile, burstDesktop, burstMobile, nodesDesktop, nodesMobile]);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-screen overflow-hidden border-b border-white/10 bg-black"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,204,184,0.08),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_24%,transparent_74%,rgba(255,255,255,0.03))]" />
      <div className="pointer-events-none absolute inset-y-0 left-[6%] hidden w-px bg-white/8 lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-[6%] hidden w-px bg-white/8 lg:block" />

      <div className="container relative z-10 flex min-h-screen items-center px-4 pb-20 pt-36 sm:px-6 lg:pb-24 lg:pt-32">
        <div className="w-full max-w-[500px] space-y-6 lg:ml-0 lg:max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.34em] text-white/58 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Sistema vivo
          </div>

          <div className="space-y-4">
            <h1 className="max-w-[11.5ch] text-[2rem] font-medium leading-[0.98] tracking-tight text-white sm:text-[2.5rem] lg:text-[clamp(3.1rem,4.8vw,5.2rem)]">
              Tecnología que ordena, responde y escala.
            </h1>
            <p className="max-w-[31rem] text-[0.95rem] font-light leading-relaxed text-white/68 sm:text-base lg:text-lg">
              Diseñamos sistemas que convierten consultas en procesos, procesos en seguimiento y seguimiento en crecimiento real.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <LandingCTAButton
              size="lg"
              className="w-fit border border-[#7dfff0]/20 bg-[#d7fffb] text-black hover:bg-white"
              scrollTo="#contacto"
            >
              Solicita tu Auditoria GRATIS
            </LandingCTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
