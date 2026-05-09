"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  Navigation,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ScanLine,
  GitBranch,
  Rocket,
  BadgeCheck,
  Check,
  FileText,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Job, fetchJobs } from "@/lib/api";

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
  const [extracted, setExtracted] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setExtracted(true), 1500);
    return () => clearTimeout(t);
  }, [inView]);

  const chips = ["Python", "ML / AI", "5 yrs exp", "Leadership", "System Design", "React"];
  const keywords = ["Python", "TensorFlow", "PyTorch", "Kubernetes", "Go", "System Design"];

  return (
    <div ref={ref} className="bg-neutral-900/50 rounded-[3rem] border border-neutral-800 p-8 overflow-hidden relative h-full flex flex-col gap-5">
      {/* Resume document */}
      <div className="bg-neutral-800/60 rounded-2xl p-5 relative overflow-hidden flex-1">
        {/* Scanning beam */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
          style={{ background: "linear-gradient(to right, transparent, #0051d5 45%, #93c5fd 55%, transparent)", boxShadow: "0 0 14px 3px rgba(0,81,213,0.5)" }}
          initial={{ top: "0%", opacity: 0 }}
          animate={inView ? { top: ["0%", "100%", "0%"], opacity: [0, 1, 1, 0] } : {}}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />

        {/* Name / header */}
        <motion.div className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
            AC
          </div>
          <div>
            <div className="text-white text-xs font-bold">Alex Chen</div>
            <div className="text-neutral-500 text-[10px]">San Francisco, CA Â· alex@gmail.com</div>
          </div>
        </motion.div>

        <motion.div className="text-[11px] font-bold text-white/90 mb-0.5"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.25 }}>
          Senior Machine Learning Engineer
        </motion.div>
        <motion.div className="text-[10px] text-neutral-500 mb-3.5"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.35 }}>
          Google DeepMind Â· 2019 â€“ 2024
        </motion.div>

        <motion.p className="text-[10px] text-neutral-400 leading-[1.7] mb-4"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.45 }}>
          Led production ML pipelines serving 2B+ requests/day. Architected distributed
          training on TPU v4 pods for large-scale language models and contributed to
          internal AutoML frameworks used across Google.
        </motion.p>

        {/* Skills line â€” lights up when scan detects it */}
        <motion.div
          className="rounded-xl p-3 border transition-all duration-500"
          style={{
            backgroundColor: extracted ? "rgba(0,81,213,0.12)" : "rgba(255,255,255,0.03)",
            borderColor: extracted ? "rgba(0,81,213,0.35)" : "rgba(255,255,255,0.06)",
          }}
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.55 }}>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {keywords.map((kw, i) => (
              <motion.span
                key={kw}
                className="text-[10px] font-semibold transition-colors duration-400"
                style={{ color: extracted ? "#93c5fd" : "#52525b" }}
                animate={extracted ? { scale: [1, 1.08, 1] } : {}}
                transition={{ delay: i * 0.06, duration: 0.28 }}>
                {kw}{i < keywords.length - 1 ? " Â·" : ""}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Extracted signals */}
      <div>
        <motion.p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}>
          Extracted Signals
        </motion.p>
        <div className="flex flex-wrap gap-2">
          {chips.map((skill, i) => (
            <motion.span
              key={skill}
              className="px-3 py-1 bg-[#0051d5]/20 border border-[#0051d5]/40 rounded-full text-xs font-bold text-[#0051d5]"
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ delay: 1.65 + i * 0.1, type: "spring", stiffness: 400, damping: 20 }}>
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

  const matches = [
    { role: "Principal Engineer", co: "Stripe",    score: 98, abbr: "S", tag: "Top Pick"   },
    { role: "AI Research Lead",   co: "OpenAI",    score: 94, abbr: "O", tag: "Strong Fit" },
    { role: "ML Architect",       co: "Anthropic", score: 91, abbr: "A", tag: "High Match" },
  ];

  return (
    <div ref={ref} className="bg-neutral-900/60 rounded-[3rem] border border-neutral-800 overflow-hidden h-full flex flex-col">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#0051d5]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">AI Matching</span>
        </div>
        <motion.span className="text-[10px] font-mono text-neutral-600"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
          50,247 scanned
        </motion.span>
      </div>

      <div className="p-5 flex flex-col gap-2.5 flex-1 justify-center">
        {matches.map((m, i) => (
          <motion.div
            key={m.role}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}>

            {/* Company monogram */}
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-sm text-neutral-300 shrink-0">
              {m.abbr}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-[11px] font-bold truncate">{m.role}</span>
                {i === 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-wide bg-[#0051d5]">
                    #1
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mb-2">
                <span>{m.co}</span>
                <span className="text-neutral-700">Â·</span>
                <span>{m.tag}</span>
              </div>
              <div className="h-[3px] w-full bg-neutral-700/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#0051d5] rounded-full"
                  initial={{ width: "0%" }}
                  animate={inView ? { width: `${m.score}%` } : {}}
                  transition={{ delay: 0.5 + i * 0.18, duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="text-right shrink-0 pl-1">
              <motion.span
                className="text-lg font-black tabular-nums text-[#0051d5]"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.65 + i * 0.18 }}>
                {m.score}
              </motion.span>
              <span className="text-neutral-600 text-[10px] font-bold">%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div className="px-5 pb-5 flex items-center gap-2"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.95 }}>
        <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        <span className="text-[10px] text-neutral-600">Updated continuously via PathAI engine</span>
      </motion.div>
    </div>
  );
}

/** Step 03 â€” activity feed / notification panel style */
function InsertionVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const events = [
    { title: "Profile verified",                meta: "98th percentile fit detected",       time: "0:00", live: false },
    { title: "Forwarded to Stripe Recruiting",  meta: "Sent to Sarah Chen Â· Sr. Recruiter", time: "0:03", live: false },
    { title: "Recruiter opened profile",        meta: "3 min 24 sec dwell time",            time: "0:15", live: false },
    { title: "Interview request sent",          meta: "Thu Â· 2:00 PM Pacific",              time: "now",  live: true  },
  ];

  return (
    <div ref={ref} className="bg-neutral-900/60 rounded-[2.5rem] border border-neutral-800 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-800/50 border-b border-neutral-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
        </div>
        <span className="text-[10px] text-neutral-500 font-mono tracking-wide">Application Â· Stripe</span>
        <motion.div
          className="px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-[9px] font-black text-green-400 uppercase tracking-wide"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}>
          Live
        </motion.div>
      </div>

      <div className="p-4 space-y-2">
        {events.map((ev, i) => (
          <motion.div
            key={ev.title}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
              ev.live
                ? "bg-[#0051d5]/10 border-[#0051d5]/20"
                : "bg-white/[0.03] border-transparent"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>

            {/* Icon */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              ev.live ? "bg-[#0051d5]/25 text-[#60a5fa]" : "bg-green-500/15 text-green-400"
            }`}>
              {ev.live ? (
                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Zap size={11} />
                </motion.div>
              ) : (
                <Check size={11} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold ${ev.live ? "text-[#60a5fa]" : "text-white/90"}`}>
                  {ev.title}
                </span>
                <span className="text-[10px] text-neutral-600 font-mono shrink-0">{ev.time}</span>
              </div>
              <span className="text-[10px] text-neutral-500 block mt-0.5">{ev.meta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calendar invite chip */}
      <motion.div
        className="mx-4 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 22 }}>
        <div className="w-9 h-9 rounded-xl bg-[#0051d5] flex items-center justify-center shrink-0">
          <span className="text-white text-[9px] font-black leading-none text-center">THU</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-[11px] font-bold">Interview Scheduled</div>
          <div className="text-neutral-500 text-[10px]">Thursday Â· 2:00 PM Pacific Â· Google Meet</div>
        </div>
        <motion.div className="w-2 h-2 rounded-full bg-green-400 shrink-0"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
      </motion.div>
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

  return (
    <div className="relative flex min-h-screen flex-col bg-white overflow-x-hidden text-neutral-900">
      <Header />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 -z-10 pointer-events-none" />

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
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black text-white mb-8 shadow-lg"
            >
              <Sparkles size={13} className="text-white" fill="white" />
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

            {/* Right: floating product card */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <motion.div
                ref={cardRef}
                className="relative w-full max-w-lg cursor-default"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -16, transition: { type: "spring", stiffness: 220, damping: 18 } }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onMouseMove={(e) => {
                  const rect = cardRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  cardMouseX.set(e.clientX - rect.left - rect.width / 2);
                  cardMouseY.set(e.clientY - rect.top - rect.height / 2);
                }}
                onMouseLeave={() => { cardMouseX.set(0); cardMouseY.set(0); }}
              >
                <motion.div
                  animate={{ y: [-10, 10] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  style={{
                    rotateX: cardRotateX,
                    rotateY: cardRotateY,
                    transformPerspective: 1000,
                  }}
                  className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100"
                >
                  <div className="flex items-center gap-6 mb-10">
                    <motion.div
                      className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg"
                      whileHover={{ backgroundColor: "#0051d5", scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <TrendingUp className="text-white" size={28} />
                    </motion.div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                        Current Match
                      </div>
                      <div className="text-2xl font-black tracking-tight">
                        Principal Product
                      </div>
                    </div>
                  </div>


                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-black uppercase mb-2">
                        <span>Alignment</span>
                        <span className="text-[#0051d5]">98%</span>
                      </div>
                      <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#0051d5] rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "98%" }}
                          transition={{
                            duration: 1.5,
                            delay: 0.9,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-sm md:text-base font-medium text-neutral-500 leading-relaxed">
                      Profile resonance detected with OpenAI&apos;s core strategy
                      group. High probability of culture-fit match.
                    </p>

                    <div className="pt-6 border-t border-neutral-100 flex items-center justify-between opacity-50">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        PathAI Analytics
                      </span>
                      <BadgeCheck size={20} />
                    </div>
                  </div>
                </motion.div>

                {/* Decorative blobs */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#0051d5]/5 rounded-full -z-10 blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-neutral-200/20 rounded-full -z-10 blur-2xl pointer-events-none" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SOCIAL PROOF â€” infinite scrolling logos
          ================================================================ */}
      <section className="py-12 border-y border-neutral-100 overflow-hidden">
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
                      <ScanLine size={36} className="text-white" />
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
                      <GitBranch size={36} className="text-white" />
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
                    <div className="w-20 h-20 rounded-3xl bg-[#0051d5] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,81,213,0.3)]">
                      <Rocket size={36} className="text-white" />
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Large featured card */}
              <motion.div
                className="lg:col-span-7 group relative bg-white p-12 md:p-16 rounded-[3rem] shadow-xl border border-neutral-200/50 flex flex-col justify-between min-h-[560px] overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => router.push(`/jobs/${displayJobs[0].id}`)}
              >
                {/* Background score watermark */}
                <div className="absolute top-0 right-0 p-12 pointer-events-none select-none">
                  <div className="text-8xl font-black text-neutral-200 group-hover:text-[#0051d5]/20 transition-colors duration-500">
                    {PLACEHOLDER_SCORES[0]}%
                  </div>
                </div>

                <div>
                  <div className="w-20 h-20 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center text-4xl font-black mb-12">
                    {(displayJobs[0].company ?? displayJobs[0].title)[0]}
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 group-hover:text-[#0051d5] transition-colors leading-tight">
                    {displayJobs[0].title}
                  </h3>
                  <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm mb-12">
                    {displayJobs[0].company &&
                      `${displayJobs[0].company} â€¢ `}
                    {displayJobs[0].location}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-12">
                    <span className="px-5 py-2 bg-neutral-50 border border-neutral-100 rounded-full text-xs font-black text-neutral-500 uppercase tracking-widest">
                      {fmtDept(displayJobs[0].department)}
                    </span>
                    <span className="px-5 py-2 bg-neutral-50 border border-neutral-100 rounded-full text-xs font-black text-neutral-500 uppercase tracking-widest">
                      {displayJobs[0].seniority}
                    </span>
                  </div>
                </div>

                <MagneticButton>
                  <button
                    className="bg-black text-white px-10 py-5 rounded-2xl font-black text-base shadow-xl hover:bg-neutral-800 transition-all w-max"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/jobs");
                    }}
                  >
                    Fast-Track Application
                  </button>
                </MagneticButton>
              </motion.div>

              {/* Secondary cards */}
              <div className="lg:col-span-5 space-y-6">
                {displayJobs.slice(1, 4).map((job, i) => (
                  <motion.div
                    key={job.id}
                    className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-neutral-200/50 flex items-center justify-between group hover:border-[#0051d5] transition-all cursor-pointer"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <div className="flex gap-5 items-center min-w-0">
                      <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0">
                        {(job.company ?? job.title)[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black leading-tight truncate">
                          {job.title}
                        </h4>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1 truncate">
                          {job.company && `${job.company} â€¢ `}
                          {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-2xl font-black text-[#0051d5]">
                        {PLACEHOLDER_SCORES[i + 1]}%
                      </div>
                      <ArrowRight
                        className="text-neutral-300 group-hover:text-black transition-colors ml-auto mt-1"
                        size={16}
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
                { value: "10K+",  label: "Professionals Placed",  icon: Users,    delay: 0    },
                { value: "95%",   label: "Match Accuracy",        icon: BarChart3, delay: 0.1  },
                { value: "3.2x",  label: "Faster Hiring",         icon: Zap,      delay: 0.2  },
                { value: "500+",  label: "Partner Companies",     icon: FileText, delay: 0.3  },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stat.delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon size={20} className="text-neutral-500" />
                  </div>
                  <div className="text-5xl font-black tracking-tight text-black mb-2">
                    {stat.value}
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
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                <MagneticButton>
                  <Link
                    href="/auth"
                    className="bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl inline-block"
                  >
                    Get Started Free
                  </Link>
                </MagneticButton>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-1">
                    Status
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm font-bold">Network Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="w-full py-24 px-8 md:px-16 border-t border-neutral-100 bg-white">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-20">
            <div className="lg:col-span-4">
              <Link
                href="/"
                className="text-2xl font-black tracking-tighter text-black flex items-center gap-3 mb-10"
              >
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <Navigation className="text-white" size={18} />
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
