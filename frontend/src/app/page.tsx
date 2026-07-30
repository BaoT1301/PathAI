"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ScanLine,
  GitBranch,
  Rocket,
  BadgeCheck,
  Check,
  Send,
  User,
} from "lucide-react";
import Header from "@/components/Header";
import CompanyLogo from "@/components/CompanyLogo";
import { PathMark } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Job, fetchJobs } from "@/lib/api";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   Animation Variants
   ============================================================ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

/* ============================================================
   MagneticButton
   ============================================================ */

function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * 0.15);
        y.set((e.clientY - (rect.top + rect.height / 2)) * 0.15);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   ScrollReveal â€” fade-up on enter viewport
   ============================================================ */

function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   CountUp: animates a number when scrolled into view.
   Reduced-motion safe: snaps straight to the final value.
   ============================================================ */

function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(to * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(to);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduceMotion]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function fmtDept(d: string) {
  return d
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/* Static fallback jobs â€” shown when backend is offline (landing page demo) */
const STATIC_JOBS = [
  { id: "s1", title: "Senior AI Research Engineer", company: "Stripe",    location: "San Francisco / Hybrid", department: "engineering",  seniority: "Senior"    },
  { id: "s2", title: "Lead Product Designer",        company: "OpenAI",   location: "Remote",                 department: "design",        seniority: "Lead"      },
  { id: "s3", title: "Principal ML Researcher",      company: "Anthropic",location: "London",                 department: "data_science",  seniority: "Principal" },
  { id: "s4", title: "Staff Frontend Engineer",      company: "Linear",   location: "New York",               department: "engineering",   seniority: "Staff"     },
] as unknown as import("@/lib/api").Job[];

/* ============================================================
   Process Step Visuals
   ============================================================ */

/** Step 01 â€” resume scanner with real text + keyword extraction */
function ResumeScanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [extracted, setExtracted] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setExtracted(true), 1500);
    return () => clearTimeout(t);
  }, [inView]);

  const chips = ["Python", "ML / AI", "5 yrs exp", "Leadership", "System Design", "React"];
  const keywords = ["Python", "TensorFlow", "PyTorch", "Kubernetes", "Go", "System Design"];

  return (
    <div ref={ref} className="font-sans bg-neutral-900/50 rounded-[3rem] border border-neutral-800 p-8 overflow-hidden relative h-full flex flex-col gap-6">
      {/* Resume document */}
      <div className="relative flex-1 rounded-2xl border border-white/[0.06] bg-neutral-800/40 overflow-hidden">
        {/* Soft extraction sweep â€” a low-opacity band, never a neon laser */}
        <motion.div
          className="absolute inset-x-0 h-20 pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,81,213,0.10), transparent)" }}
          initial={{ top: "-25%" }}
          animate={inView && !reduceMotion ? { top: ["-25%", "110%"] } : {}}
          transition={{ duration: 2.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.6 }}
        />

        {/* Document window chrome */}
        <div className="flex items-center gap-1.5 px-5 pt-4 pb-3">
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="ml-2 text-[10px] font-mono tracking-tight text-neutral-500">alex-chen-resume.pdf</span>
        </div>
        <div className="h-px bg-white/[0.06]" />

        <div className="p-5">
          {/* Identity */}
          <motion.div className="flex items-center gap-3"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}>
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 shrink-0">
              <User size={16} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="text-white text-[13px] font-semibold tracking-tight leading-tight">Alex Chen</div>
              <div className="text-neutral-500 text-[10px] font-mono tracking-tight">San Francisco, CA · alex@gmail.com</div>
            </div>
          </motion.div>

          <div className="h-px bg-white/[0.06] my-4" />

          {/* Role */}
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.22 }}>
            <div className="text-[12px] font-semibold text-white/90 tracking-tight leading-tight">
              Senior Machine Learning Engineer
            </div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-tight mt-1">
              Google DeepMind · 2019 to 2024
            </div>
          </motion.div>

          <motion.p className="text-[10px] text-neutral-400 leading-[1.75] mt-3"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.34 }}>
            Led production ML pipelines serving 2B+ requests/day. Architected distributed
            training on TPU v4 pods for large-scale language models and contributed to
            internal AutoML frameworks used across Google.
          </motion.p>

          <div className="h-px bg-white/[0.06] my-4" />

          {/* Skills row â€” the extraction target; keywords tint to accent when parsed */}
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.46 }}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
              Core Skills
            </div>
            <div className="flex flex-wrap items-center gap-y-1">
              {keywords.map((kw, i) => (
                <span key={kw} className="inline-flex items-center text-[10px] font-medium tracking-tight leading-none">
                  <motion.span
                    className="rounded px-1 py-0.5 transition-colors duration-500"
                    style={{
                      color: extracted ? "#6690ff" : "#71717a",
                      backgroundColor: extracted ? "rgba(0,81,213,0.10)" : "transparent",
                    }}
                    animate={extracted && !reduceMotion ? { opacity: [0.45, 1] } : {}}
                    transition={{ delay: i * 0.08, duration: 0.45 }}>
                    {kw}
                  </motion.span>
                  {i < keywords.length - 1 && <span className="text-neutral-700 px-1">·</span>}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Extracted signals */}
      <div>
        <motion.div className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.7 }}>
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"
            animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Extracted Signals
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((skill, i) => (
            <motion.span
              key={skill}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight bg-[#0051d5]/10 border border-[#0051d5]/20 text-[#6690ff]"
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.5 + i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
              {skill}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Step 02 â€” match results panel, modern startup style */
function MatchVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  const matches = [
    { role: "Principal Engineer", co: "Stripe",    score: 98, tag: "Top Pick"   },
    { role: "AI Research Lead",   co: "OpenAI",    score: 94, tag: "Strong Fit" },
    { role: "ML Architect",       co: "Anthropic", score: 91, tag: "High Match" },
  ];

  return (
    <div ref={ref} className="font-sans bg-neutral-900/60 rounded-[3rem] border border-neutral-800 overflow-hidden h-full flex flex-col">
      {/* Header bar â€” one subtle live dot */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"
            animate={reduceMotion ? {} : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-300">AI Matching</span>
        </div>
        <span className="text-[10px] font-mono tabular-nums text-neutral-500 tracking-tight">~50k roles</span>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1 justify-center">
        {matches.map((m, i) => (
          <motion.div
            key={m.role}
            className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.16, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>

            {/* Company logo tile */}
            <CompanyLogo company={m.co} className="w-11 h-11 rounded-xl" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-white text-[13px] font-semibold tracking-tight truncate leading-none">{m.role}</span>
                {i === 0 && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-[#0051d5]/15 px-1.5 py-0.5 text-[9px] font-semibold font-mono tabular-nums text-[#6690ff] leading-none">
                    #1
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] text-neutral-400 tracking-tight leading-none">{m.co}</span>
                <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-400 leading-none">
                  {m.tag}
                </span>
              </div>
              {/* Thin accent progress bar */}
              <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#0051d5] rounded-full"
                  initial={{ width: "0%" }}
                  animate={inView ? { width: `${m.score}%` } : {}}
                  transition={{ delay: 0.5 + i * 0.16, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="shrink-0 text-right pl-1 w-14">
              <span className="text-[22px] font-semibold font-mono tabular-nums tracking-tight text-white leading-none">
                <CountUp to={m.score} />
              </span>
              <span className="text-neutral-500 text-[11px] font-mono ml-0.5">%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.95 }}>
        <span className="text-[10px] text-neutral-500 tracking-tight">Ranked by PathAI engine</span>
        <span className="text-[10px] font-mono tabular-nums text-neutral-600">updated live</span>
      </motion.div>
    </div>
  );
}

/** Step 03 â€” activity feed / notification panel style */
function InsertionVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  const events = [
    { title: "Profile verified",                meta: "98th percentile fit detected",       time: "0:00", live: false },
    { title: "Forwarded to Stripe Recruiting",  meta: "Sent to Sarah Chen · Sr. Recruiter", time: "0:03", live: false },
    { title: "Recruiter opened profile",        meta: "3 min 24 sec dwell time",            time: "0:15", live: false },
    { title: "Interview request sent",          meta: "Thu · 2:00 PM Pacific",              time: "now",  live: true  },
  ];

  return (
    <div ref={ref} className="font-sans bg-neutral-900/60 rounded-[2.5rem] border border-neutral-800 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyLogo company="Stripe" className="w-7 h-7 rounded-lg" />
          <div className="min-w-0 leading-none">
            <div className="text-[12px] font-semibold text-white tracking-tight leading-none">Stripe</div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-tight mt-1">Application timeline</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#0051d5]/10 border border-[#0051d5]/20 px-2 py-1">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"
            animate={reduceMotion ? {} : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="text-[9px] font-semibold text-[#6690ff] uppercase tracking-[0.14em]">Live</span>
        </div>
      </div>

      {/* Connected activity timeline */}
      <div className="p-5">
        <div className="relative">
          {/* Vertical connector, draws in behind the nodes */}
          <motion.div
            className="absolute left-[25px] top-4 bottom-4 w-px bg-white/[0.08] origin-top"
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />

          <div className="space-y-1">
            {events.map((ev, i) => (
              <motion.div
                key={ev.title}
                className={`relative flex items-start gap-3.5 rounded-xl px-3 py-3 ${
                  ev.live ? "bg-[#0051d5]/[0.08] glow-accent" : ""
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25 + i * 0.22, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}>

                {/* Node */}
                <div className={`relative z-10 w-[27px] h-[27px] rounded-full flex items-center justify-center shrink-0 ${
                  ev.live
                    ? "bg-[#0051d5] text-white"
                    : "bg-neutral-800 border border-white/10 text-neutral-300"
                }`}>
                  {ev.live ? (
                    <Send size={12} strokeWidth={1.75} />
                  ) : (
                    <Check size={12} strokeWidth={1.75} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[12px] font-semibold tracking-tight ${ev.live ? "text-white" : "text-white/90"}`}>
                      {ev.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono tabular-nums shrink-0">{ev.time}</span>
                  </div>
                  <span className="block text-[10px] text-neutral-500 tracking-tight mt-1">{ev.meta}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Calendar invite chip */}
        <motion.div
          className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25 + events.length * 0.22 + 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className="w-10 h-10 rounded-xl bg-[#0051d5]/12 border border-[#0051d5]/25 flex items-center justify-center shrink-0">
            <span className="text-[#6690ff] text-[10px] font-semibold tracking-wide leading-none">THU</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[12px] font-semibold tracking-tight">Interview Scheduled</div>
            <div className="text-neutral-500 text-[10px] tracking-tight mt-0.5">Thursday · 2:00 PM Pacific · Google Meet</div>
          </div>
          <BadgeCheck size={16} strokeWidth={1.75} className="text-[#6690ff] shrink-0" />
        </motion.div>
      </div>
    </div>
  );
}

const LOGO_COMPANIES = [
  { name: "Google",      logo: "/logos/google-logo-transparent.png" },
  { name: "Meta",        logo: "/logos/Meta-Logo.png" },
  { name: "Apple",       logo: "/logos/apple-logo-transparent.png" },
  { name: "Amazon",      logo: "/logos/amazon-logo-amazon-icon-transparent-free-png.png" },
  { name: "Microsoft",   logo: "/logos/Microsoft-Logo.png" },
  { name: "Tesla",       logo: "/logos/Tesla_logo.png" },
  { name: "OpenAI",      logo: "/logos/OpenAI_Logo.svg.png" },
  { name: "Uber",        logo: "/logos/Uber_logo_2018.png" },
  { name: "Stripe",      logo: "/logos/Stripe_Logo,_revised_2016.svg.png" },
  { name: "Nvidia",      logo: "/logos/Logo-nvidia-transparent-PNG.png" },
  { name: "Databricks",  logo: "/logos/Databricks_Logo.png" },
  { name: "IBM",         logo: "/logos/ibm-logo-black-transparent.png" },
];

const PLACEHOLDER_SCORES = [98, 94, 91, 89];

/* ============================================================
   HOME PAGE
   ============================================================ */

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const cardMouseX = useMotionValue(0);
  const cardMouseY = useMotionValue(0);
  const cardRotateX = useSpring(useTransform(cardMouseY, [-200, 200], [6, -6]), { stiffness: 150, damping: 25 });
  const cardRotateY = useSpring(useTransform(cardMouseX, [-260, 260], [-8, 8]), { stiffness: 150, damping: 25 });

  useEffect(() => {
    fetchJobs({ page: 1, page_size: 4 })
      .then((r) => setFeaturedJobs(r.jobs))
      .catch(console.error);
  }, []);

  /* ------------------------------------------------------------
     GSAP scroll polish, layered on top of the existing
     framer-motion. It only touches decorative layers and the
     two purely-static sections (logos + footer) so it never
     fights the framer-motion reveals already on the page.
     Transform/opacity only. Disabled under reduced motion.
     ------------------------------------------------------------ */
  useEffect(() => {
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      // Hero: gentle scrub parallax on the floating decorative blobs.
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0");
        const trigger =
          el.closest<HTMLElement>("[data-hero-section]") || el;
        gsap.fromTo(
          el,
          { yPercent: 0 },
          {
            yPercent: speed,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      // Static sections: fade/rise reveal, once.
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 48,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-screen flex-col bg-white overflow-x-hidden text-neutral-900"
    >
      <Header />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section
        data-hero-section
        className="relative min-h-[90vh] flex items-center pt-20 pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 grid-bg opacity-[0.12] -z-10 pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-8 w-full">
          {/* Badge + headline */}
          <motion.div
            className="flex flex-col items-center text-center mb-16"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black text-white mb-8 shadow-lg"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                Intelligence Driven Hiring
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-7xl md:text-[9rem] font-black leading-[0.85] tracking-tight hero-gradient-text"
            >
              THE JOB SEARCH
            </motion.h1>

            <motion.span
              variants={fadeUp}
              custom={2}
              className="font-thin italic text-neutral-300 text-4xl md:text-6xl mt-4 lowercase tracking-tight"
            >
              Redefined.
            </motion.span>
          </motion.div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: copy + CTA */}
            <motion.div
              className="lg:col-span-5 space-y-10 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.p
                variants={fadeUp}
                className="text-xl md:text-2xl text-neutral-500 font-medium leading-relaxed tracking-tight"
              >
                We leverage proprietary LLMs to decode your career DNA and
                match you with roles that don&apos;t just fit your
                skills—they fit your trajectory.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={1}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
              >
                <MagneticButton>
                  <Link href="/jobs">
                    <button className="bg-[#0051d5] text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shrink-0">
                      <ArrowRight size={30} />
                    </button>
                  </Link>
                </MagneticButton>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                    Start Your
                  </span>
                  <span className="text-xl font-extrabold text-black">
                    Journey Now
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: product match card */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <motion.div
                ref={cardRef}
                className="relative w-full max-w-lg cursor-default"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onMouseMove={(e) => {
                  if (reduceMotion) return;
                  const rect = cardRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  cardMouseX.set(e.clientX - rect.left - rect.width / 2);
                  cardMouseY.set(e.clientY - rect.top - rect.height / 2);
                }}
                onMouseLeave={() => { cardMouseX.set(0); cardMouseY.set(0); }}
              >
                <motion.div
                  style={
                    reduceMotion
                      ? undefined
                      : {
                          rotateX: cardRotateX,
                          rotateY: cardRotateY,
                          transformPerspective: 1000,
                        }
                  }
                  className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-neutral-200/80 shadow-[0_40px_80px_-20px_rgba(0,81,213,0.15)]"
                >
                  {/* Header: real logo + role + score chip */}
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4 min-w-0">
                      <CompanyLogo company="Stripe" className="w-16 h-16 rounded-2xl" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">
                          Top Match
                        </div>
                        <div className="text-2xl font-black tracking-tight leading-none">
                          Senior Product Engineer
                        </div>
                        <div className="text-sm font-medium text-neutral-400 mt-1.5 truncate">
                          Stripe · San Francisco · Hybrid
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 inline-flex items-center rounded-full bg-[#0051d5]/10 px-3 py-1.5">
                      <span className="text-sm font-black tabular-nums text-[#0051d5]">96%</span>
                    </div>
                  </div>

                  {/* Evidence rows with mini bars */}
                  <div className="space-y-4">
                    {[
                      { label: "Skills", value: 96 },
                      { label: "Trajectory", value: 92 },
                      { label: "Culture", value: 88 },
                    ].map((sig, i) => (
                      <div key={sig.label}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-neutral-500">{sig.label}</span>
                          <span className="text-neutral-900 tabular-nums">{sig.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#0051d5] rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${sig.value}%` }}
                            transition={{
                              duration: 1.1,
                              delay: 0.9 + i * 0.15,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm font-medium text-neutral-500 leading-relaxed mt-7">
                    Strong overlap with your ML infrastructure background. Matched
                    on 12 of 14 core competencies.
                  </p>

                  <div className="pt-6 mt-7 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Analyzed by PathAI
                    </span>
                    <BadgeCheck size={18} strokeWidth={1.75} className="text-[#0051d5]" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SOCIAL PROOF â€” infinite scrolling logos
          ================================================================ */}
      <section data-reveal className="py-12 border-y border-neutral-100 overflow-hidden">
        <div className="relative">
          {/* Left + right fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-16 animate-scroll">
            {[...LOGO_COMPANIES, ...LOGO_COMPANIES].map((company, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-14 flex items-center justify-center px-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-8 w-auto object-contain grayscale opacity-40 hover:opacity-70 hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PROCESS SECTION
          ================================================================ */}
      <section className="py-40 px-8 bg-black text-white relative">
        <div className="max-w-[1440px] mx-auto">
          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start mb-32">
            <ScrollReveal>
              <h2 className="text-5xl md:text-7xl font-extrabold leading-[0.9] tracking-tight">
                Beyond the
                <br />
                standard
                <br />
                application.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-neutral-400 font-medium leading-relaxed max-w-lg lg:mt-12">
                We&apos;ve built a proprietary pipeline that removes the friction of
                discovery and replaces it with the precision of AI.
              </p>
            </ScrollReveal>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Animated vertical line */}
            <div className="absolute left-10 top-0 bottom-0 w-[2px] hidden md:block overflow-hidden opacity-30">
              <motion.div
                className="w-full h-full"
                style={{
                  background:
                    "linear-gradient(to bottom, #0051d5 0%, #404040 100%)",
                  transformOrigin: "top",
                }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>

            <div className="space-y-32">
              {/* Step 01 */}
              <motion.div
                className="relative pl-0 md:pl-32"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="hidden md:flex absolute left-4 top-0 w-12 h-12 rounded-full bg-white text-black items-center justify-center font-black z-10 border-4 border-black text-sm">
                  01
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-5">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-8">
                      <ScanLine size={36} strokeWidth={1.75} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-6">
                      Deep Contextual Scanning
                    </h3>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed">
                      We don&apos;t just read keywords. Our LLMs analyze the
                      narrative arc of your career, identifying latent strengths
                      that even you might have missed.
                    </p>
                  </div>
                  <div className="lg:col-span-7">
                    <ResumeScanner />
                  </div>
                </div>
              </motion.div>

              {/* Step 02 */}
              <motion.div
                className="relative pl-0 md:pl-32"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="hidden md:flex absolute left-4 top-0 w-12 h-12 rounded-full bg-white text-black items-center justify-center font-black z-10 border-4 border-black text-sm">
                  02
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-5 order-2 lg:order-1">
                    <MatchVisual />
                  </div>
                  <div className="lg:col-span-7 order-1 lg:order-2">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-8">
                      <GitBranch size={36} strokeWidth={1.75} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-6">
                      Autonomous Pattern Matching
                    </h3>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed">
                      Cross-referencing your profile with 50,000+ data points
                      from high-growth startups to find the 1% of roles where
                      you&apos;ll thrive.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 03 */}
              <motion.div
                className="relative pl-0 md:pl-32"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="hidden md:flex absolute left-4 top-0 w-12 h-12 rounded-full bg-[#0051d5] text-white items-center justify-center font-black z-10 border-4 border-black text-sm">
                  03
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-5">
                    <div className="w-20 h-20 rounded-3xl bg-[#0051d5] flex items-center justify-center mb-8 shadow-[0_8px_24px_-8px_rgba(0,81,213,0.35)]">
                      <Rocket size={36} strokeWidth={1.75} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-6">
                      Verified Direct Insertion
                    </h3>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed">
                      We bypass the &quot;black hole&quot; of traditional applications.
                      Your profile lands directly in front of the
                      decision-makers who matter most.
                    </p>
                  </div>
                  <div className="lg:col-span-7">
                    <InsertionVisual />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SELECTED MATCHES
          ================================================================ */}
      <section className="py-40 bg-neutral-50 px-8 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
            <div className="max-w-2xl">
              <ScrollReveal>
                <h2 className="text-6xl font-black tracking-tight mb-8">
                  Selected Matches.
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="text-xl text-neutral-500 font-medium leading-relaxed">
                  Curated specifically for your current career trajectory.
                  These are not suggestions; they are opportunities.
                </p>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={0.15}>
              <Link
                href="/jobs"
                className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 hover:opacity-50 transition-opacity whitespace-nowrap"
              >
                View All Openings
              </Link>
            </ScrollReveal>
          </div>

          {/* Cards â€” uses real API data, falls back to static demo jobs */}
          {(() => {
            const displayJobs = featuredJobs.length > 0 ? featuredJobs : STATIC_JOBS;
            return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              {/* Large featured card */}
              <motion.div
                className="lg:col-span-7 group relative bg-white p-10 md:p-14 rounded-[2.5rem] shadow-premium-lg border border-neutral-200/70 flex flex-col justify-between min-h-[560px] overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                onClick={() => router.push(`/jobs/${displayJobs[0].id}`)}
              >
                {/* Soft accent wash on hover */}
                <div className="spotlight pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Top row: logo + refined match chip */}
                <div className="relative flex items-start justify-between gap-4">
                  <CompanyLogo
                    company={displayJobs[0].company ?? displayJobs[0].title}
                    className="w-16 h-16 rounded-2xl shadow-premium"
                  />
                  <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#0051d5]/10 border border-[#0051d5]/15 px-3.5 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]" />
                    <span className="text-[13px] font-semibold font-mono tabular-nums text-[#0051d5] leading-none">
                      {PLACEHOLDER_SCORES[0]}%
                    </span>
                    <span className="text-[11px] font-medium text-[#0051d5]/70 leading-none">match</span>
                  </div>
                </div>

                <div className="relative">
                  <h3 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95] mb-4 group-hover:text-[#0051d5] transition-colors">
                    {displayJobs[0].title}
                  </h3>
                  <p className="text-neutral-400 font-semibold uppercase tracking-[0.18em] text-xs mb-8">
                    {displayJobs[0].company &&
                      `${displayJobs[0].company} · `}
                    {displayJobs[0].location}
                  </p>
                  <div className="flex flex-wrap gap-2.5 mb-10">
                    <span className="px-4 py-1.5 bg-neutral-50 border border-neutral-200/70 rounded-full text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">
                      {fmtDept(displayJobs[0].department)}
                    </span>
                    <span className="px-4 py-1.5 bg-neutral-50 border border-neutral-200/70 rounded-full text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">
                      {displayJobs[0].seniority}
                    </span>
                  </div>

                  <MagneticButton>
                    <button
                      className="group/btn inline-flex items-center gap-2.5 bg-black text-white px-8 py-4 rounded-2xl font-semibold text-[15px] shadow-premium hover:bg-neutral-800 transition-colors w-max"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/jobs");
                      }}
                    >
                      Fast-Track Application
                      <ArrowRight size={18} strokeWidth={1.75} className="transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </MagneticButton>
                </div>
              </motion.div>

              {/* Secondary cards */}
              <div className="lg:col-span-5 space-y-5">
                {displayJobs.slice(1, 4).map((job, i) => (
                  <motion.div
                    key={job.id}
                    className="group bg-white p-6 md:p-7 rounded-[2rem] shadow-premium border border-neutral-200/70 flex items-center justify-between gap-4 cursor-pointer transition-[box-shadow,border-color] duration-300 hover:shadow-premium-lg hover:border-[#0051d5]/30"
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <CompanyLogo
                        company={job.company ?? job.title}
                        className="w-14 h-14 rounded-2xl shadow-premium"
                      />
                      <div className="min-w-0">
                        <h4 className="text-[17px] font-bold tracking-tight leading-tight truncate group-hover:text-[#0051d5] transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.14em] mt-1.5 truncate">
                          {job.company && `${job.company} · `}
                          {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xl font-semibold font-mono tabular-nums text-[#0051d5] leading-none">
                        {PLACEHOLDER_SCORES[i + 1]}
                        <span className="text-neutral-300 text-sm">%</span>
                      </span>
                      <ArrowRight
                        size={16}
                        strokeWidth={1.75}
                        className="text-neutral-300 transition-all group-hover:text-[#0051d5] group-hover:translate-x-0.5"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            );
          })()}
        </div>
      </section>

      {/* ================================================================
          STATS + FINAL CTA
          ================================================================ */}
      <section className="py-40 px-8 bg-white relative">
        <div className="max-w-[1440px] mx-auto text-center">
          {/* Stats */}
          <div className="mb-40 max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                The numbers
                <br />
                <span className="text-neutral-300 font-thin italic">speak for themselves.</span>
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { to: 10,  decimals: 0, suffix: "K+", label: "Professionals Placed", delay: 0    },
                { to: 95,  decimals: 0, suffix: "%",  label: "Match Accuracy",       delay: 0.1  },
                { to: 3.2, decimals: 1, suffix: "x",  label: "Faster Hiring",        delay: 0.2  },
                { to: 500, decimals: 0, suffix: "+",  label: "Partner Companies",    delay: 0.3  },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stat.delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="text-5xl font-black tracking-tight text-black mb-2">
                    <CountUp to={stat.to} decimals={stat.decimals} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA block */}
          <motion.div
            className="relative bg-black rounded-[4rem] p-16 md:p-32 overflow-hidden text-white shadow-[0_50px_100px_rgba(0,0,0,0.2)]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative z-10 max-w-3xl mx-auto">
              <motion.h2
                className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tight mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                READY TO
                <br />
                EVOLVE?
              </motion.h2>
              <p className="text-xl text-neutral-400 font-medium mb-16 leading-relaxed">
                Join 10,000+ top professionals who are letting AI do the heavy
                lifting of career management.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <MagneticButton>
                  <Link
                    href="/auth"
                    className="bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl inline-block"
                  >
                    Get Started Free
                  </Link>
                </MagneticButton>
                <span className="text-sm font-bold text-neutral-400">
                  Free to start. No card required.
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer data-reveal className="w-full py-24 px-8 md:px-16 border-t border-neutral-100 bg-white">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-20">
            <div className="lg:col-span-4">
              <Link
                href="/"
                className="text-2xl font-black tracking-tighter text-black flex items-center gap-3 mb-10"
              >
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <PathMark className="w-[18px] h-[18px] text-white" />
                </div>
                PathAI
              </Link>
              <p className="text-lg font-medium text-neutral-400 leading-relaxed max-w-sm">
                The intelligent curator for high-growth tech careers. Built for
                builders.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                {
                  title: "Product",
                  links: [
                    { label: "Find Jobs", href: "/jobs" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Resume", href: "/resume" },
                  ],
                },
                {
                  title: "Account",
                  links: [
                    { label: "Sign In", href: "/auth" },
                    { label: "Create Account", href: "/auth" },
                  ],
                },
              ].map((col) => (
                <div key={col.title} className="space-y-6">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-black">
                    {col.title}
                  </p>
                  <ul className="space-y-4">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm font-bold text-neutral-400 hover:text-black transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-neutral-100 gap-8">
            <div className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
              © 2026 PathAI. All Rights Reserved.
            </div>
            <div className="flex gap-12">
              <a
                href="#"
                className="text-xs font-bold text-neutral-400 hover:text-black transition-colors uppercase tracking-[0.2em]"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-xs font-bold text-neutral-400 hover:text-black transition-colors uppercase tracking-[0.2em]"
              >
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
