"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { BadgeCheck, BarChart3, Lock, BookOpen, Eye, Network, Gauge } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import Header from "@/components/Header";
import CompanyLogo from "@/components/CompanyLogo";
import { PathMark } from "@/components/Logo";

/* Shared editorial vocabulary with the landing page: a mono "spec-label"
   for eyebrows, step markers and status text. Uppercase, wide tracking,
   tabular numerals, quiet neutral color everywhere it appears. */
const SPEC =
  "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURED_MATCHES = [
  { company: "Stripe", role: "Principal Engineer", score: 98 },
  { company: "OpenAI", role: "AI Research Lead", score: 94 },
  { company: "Anthropic", role: "ML Architect", score: 91 },
];
const TOP_MATCH_SCORE = Math.max(...FEATURED_MATCHES.map((m) => m.score));

/* Real capability statements, no fabricated counters. */
const CAPABILITIES = [
  {
    title: "Semantic matching",
    desc: "Every role scored against your trajectory, not just your keywords.",
  },
  {
    title: "Legible reasoning",
    desc: "See exactly why each recommendation ranks where it does.",
  },
  {
    title: "Curated sources",
    desc: "High-growth companies, reviewed through an editorial lens.",
  },
];

const PHILOSOPHY = [
  {
    icon: BadgeCheck,
    title: "Precision over Volume",
    desc: "Traditional platforms focus on the number of matches. We focus on the quality of fit. Our AI acts as a digital agent, vetting opportunities against your unique career narrative.",
  },
  {
    icon: Eye,
    title: "Transparent Intelligence",
    desc: "We don't hide behind 'black box' algorithms. PathAI provides legible reasoning for every recommendation, empowering you with data-driven confidence.",
  },
  {
    icon: BookOpen,
    title: "Editorial Integrity",
    desc: "Every job listed is curated through an AI-driven editorial lens, ensuring only roles from high-growth, high-impact companies reach your dashboard.",
  },
];

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <Header />

      <main className="pt-32">
        {/* ============================================================
            HERO
            ============================================================ */}
        <header className="max-w-[1440px] mx-auto px-6 md:px-12 pb-28 md:pb-36">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-9 lg:col-span-8">
              <motion.span
                className={`${SPEC} block`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Our Mission
              </motion.span>

              <motion.h1
                className="font-serif font-medium text-5xl md:text-7xl leading-[1.02] tracking-tight text-balance text-neutral-900 mt-6 mb-8"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                The editorial lens for your{" "}
                <motion.span
                  className="text-[#0051d5]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  career trajectory.
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-neutral-500 font-medium max-w-2xl leading-relaxed text-balance"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                PathAI is more than a job board. We are the Intelligent Curator, leveraging
                large-scale language models to decode the complexities of the labor market for
                elite talent.
              </motion.p>

              {/* Capability statements, styled as the same spec-labelled ledger
                  used for the process steps on the landing page. */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-16 pt-10 border-t border-neutral-200/70"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                {CAPABILITIES.map(({ title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  >
                    <span className={`${SPEC} mb-3 block`}>{`Capability 0${i + 1}`}</span>
                    <div className="text-base font-semibold tracking-tight text-neutral-900 mb-2">
                      {title}
                    </div>
                    <div className="text-sm text-neutral-500 leading-relaxed">{desc}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </header>

        {/* ============================================================
            PHILOSOPHY
            ============================================================ */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 pb-28 md:pb-36">
          <div className="grid grid-cols-12 gap-6 lg:gap-16 items-center">
            {/* Left: live matches panel */}
            <FadeUp className="col-span-12 md:col-span-5 order-2 md:order-1 relative" delay={0.05}>
              <div className="relative aspect-[4/5] rounded-[1.75rem] overflow-hidden bg-neutral-900 ring-1 ring-white/[0.06] edge-highlight shadow-premium-lg flex flex-col">
                <div className="grain absolute inset-0 pointer-events-none" />

                <div className="relative z-10 flex h-full flex-col">
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"
                        animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className={SPEC}>Live Matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10">
                        <PathMark className="w-3 h-3 text-white" />
                      </span>
                      <span className="text-white font-semibold text-sm tracking-tight">PathAI</span>
                    </div>
                  </div>

                  {/* Match rows: real logos via CompanyLogo, blue reserved for the
                      single decisive row (the top-ranked match). */}
                  <div className="flex-1 flex flex-col justify-center gap-3 px-6 py-6">
                    {FEATURED_MATCHES.map(({ company, role, score }) => {
                      const isTop = score === TOP_MATCH_SCORE;
                      return (
                        <div
                          key={company}
                          className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-colors ${
                            isTop ? "border-[#0051d5]/30 bg-[#0051d5]/[0.06]" : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          {isTop && (
                            <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[#0051d5]" />
                          )}
                          <CompanyLogo company={company} className="w-10 h-10 rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-white text-sm font-semibold truncate">{role}</div>
                              {isTop && (
                                <span className="shrink-0 inline-flex items-center rounded-md bg-[#0051d5]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-[#6690ff] leading-none">
                                  #1
                                </span>
                              )}
                            </div>
                            <div className="text-white/40 text-xs truncate mt-0.5">{company}</div>
                          </div>
                          <div
                            className={`font-mono tabular-nums font-semibold text-base shrink-0 ${
                              isTop ? "text-[#6690ff]" : "text-white/45"
                            }`}
                          >
                            {score}%
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-5 border-t border-white/[0.06] shrink-0">
                    <p className="font-serif italic text-[13px] leading-snug text-neutral-500">
                      &ldquo;The Intelligent Curator, scoring every role against your career
                      trajectory.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Right: principles */}
            <FadeUp
              className="col-span-12 md:col-start-7 md:col-span-6 order-1 md:order-2 mb-16 md:mb-0"
              delay={0.1}
            >
              <span className={`${SPEC} block mb-5`}>Why It Matters · 03 Principles</span>
              <h2 className="font-serif font-medium text-4xl md:text-5xl tracking-tight text-balance mb-10 text-neutral-900">
                Our Philosophy
              </h2>
              <div className="space-y-10">
                {PHILOSOPHY.map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    whileHover={reduceMotion ? undefined : { x: 6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="group cursor-default"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className={SPEC}>{`0${i + 1}`}</span>
                      <span className="flex-1 h-px bg-neutral-200" />
                      <Icon className="w-[18px] h-[18px] text-neutral-400 shrink-0" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-serif font-medium text-2xl tracking-tight text-balance mb-3 text-neutral-900">
                      {title}
                    </h3>
                    <p className="text-neutral-500 leading-relaxed max-w-md">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ============================================================
            HOW MATCHING WORKS
            ============================================================ */}
        <section className="bg-neutral-50 py-32 md:py-40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12">
            <FadeUp className="max-w-2xl mb-20">
              <span className={`${SPEC} block mb-5`}>How Matching Works · 03 Steps</span>
              <h2 className="font-serif font-medium text-4xl md:text-6xl tracking-tight text-balance mb-6 text-neutral-900">
                The Intelligent Curator.
              </h2>
              <p className="text-lg text-neutral-500 font-medium leading-relaxed max-w-xl">
                Three systems run on every resume: language models that read context, a
                transparent scoring layer, and an editorial pass across the market.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 01: LLM reasoning, 2 cols */}
              <motion.div
                className="md:col-span-2 bg-white ring-1 ring-neutral-200/70 p-10 md:p-12 rounded-3xl shadow-premium flex flex-col justify-between cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <span className={SPEC}>Step 01</span>
                    <span className="flex-1 h-px bg-neutral-200" />
                    <Network className="w-[18px] h-[18px] text-neutral-400 shrink-0" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-serif font-medium text-2xl md:text-3xl tracking-tight text-balance mb-4 text-neutral-900">
                    LLM Semantic Reasoning
                  </h3>
                  <p className="text-neutral-500 text-lg leading-relaxed max-w-xl">
                    Our core engine uses customized Large Language Models to read between the lines
                    of job descriptions and resumes, identifying latent skills and cultural
                    alignment that traditional keyword searches miss.
                  </p>
                </div>
                <div className="mt-12 flex items-center gap-3">
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Context Aware
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Vector Embeddings
                  </span>
                </div>
              </motion.div>

              {/* Step 02: transparent scoring, 1 col, the section's one accent card */}
              <motion.div
                className="relative bg-[#0051d5] ring-1 ring-white/[0.06] edge-highlight p-10 rounded-3xl flex flex-col justify-between text-white cursor-default shadow-premium-lg overflow-hidden"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="relative z-10 flex items-center gap-4 mb-8">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-white/60">
                    Step 02
                  </span>
                  <span className="flex-1 h-px bg-white/20" />
                  <Gauge className="w-[18px] h-[18px] text-white/70 shrink-0" strokeWidth={1.75} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-serif font-medium text-2xl tracking-tight text-balance mb-3">
                    Scoring you can read
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Every role is scored on skills, trajectory, and culture fit, with the reasoning
                    behind each number shown so you can trust the ranking.
                  </p>
                </div>
              </motion.div>

              {/* Step 03: market mapping, 1 col */}
              <motion.div
                className="bg-white ring-1 ring-neutral-200/70 p-10 rounded-3xl shadow-premium cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <span className={SPEC}>Step 03</span>
                  <span className="flex-1 h-px bg-neutral-200" />
                  <BarChart3 className="w-[18px] h-[18px] text-neutral-400 shrink-0" strokeWidth={1.75} />
                </div>
                <h3 className="font-serif font-medium text-2xl tracking-tight text-balance mb-4 text-neutral-900">
                  Dynamic Market Mapping
                </h3>
                <p className="text-neutral-500 leading-relaxed">
                  Real-time analysis of industry trends, compensation benchmarks, and hiring
                  velocity across global tech hubs.
                </p>
              </motion.div>

              {/* Trust band: privacy commitment, deliberately unnumbered since
                  it sits outside the three-step matching flow above. */}
              <motion.div
                className="md:col-span-2 relative bg-black text-white p-10 rounded-3xl flex items-center gap-8 cursor-default shadow-premium-lg ring-1 ring-white/[0.06] edge-highlight overflow-hidden"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="grain absolute inset-0 pointer-events-none" />
                <div className="relative z-10 hidden sm:flex shrink-0 w-12 h-12 bg-white/10 rounded-xl items-center justify-center">
                  <Lock className="text-white w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="relative z-10">
                  <span className={`${SPEC} block mb-2`}>A Note on Privacy</span>
                  <h3 className="font-serif font-medium text-xl tracking-tight mb-2">
                    Sovereign Privacy
                  </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    Your data is yours. PathAI utilizes zero-retention LLM processing and
                    localized encryption to ensure your job search remains entirely confidential
                    and secure.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CTA
            ============================================================ */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-28 md:py-36">
          <motion.div
            className="relative bg-black rounded-[2.5rem] p-16 md:p-32 overflow-hidden text-white shadow-[0_50px_100px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.06] edge-highlight"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="grain absolute inset-0 pointer-events-none" />
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -bottom-16 right-2 md:right-10 font-serif leading-none text-[10rem] md:text-[16rem] text-white/[0.04]"
            >
              PathAI
            </span>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              {/* Signal-thread terminus: the one blue thread motif lands here,
                  right above the headline's blue word. */}
              <div className="mb-10 flex justify-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    aria-hidden
                    className="h-16 w-px origin-top"
                    style={{
                      background: "linear-gradient(to bottom, rgba(102,144,255,0) 0%, #6690ff 100%)",
                    }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                  <span className="-mt-0.5 h-2 w-2 rounded-full bg-[#6690ff]" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-10"
              >
                <span className={SPEC}>The Intelligent Curator</span>
              </motion.div>

              <motion.h2
                className="font-serif font-medium text-6xl md:text-8xl leading-[0.95] tracking-tight text-balance mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Ready to
                <br />
                <span className="text-[#6690ff]">evolve?</span>
              </motion.h2>

              <motion.p
                className="text-xl text-neutral-400 font-medium mb-14 leading-relaxed text-balance"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Let AI match you to roles that fit your trajectory, not just your keywords.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.div whileHover={reduceMotion ? undefined : { scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/jobs"
                    className="inline-block bg-white text-black px-12 py-5 rounded-full font-semibold text-lg hover:bg-neutral-100 transition-colors shadow-premium-lg"
                  >
                    Explore Roles
                  </Link>
                </motion.div>
                <motion.div whileHover={reduceMotion ? undefined : { scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/auth"
                    className="inline-block bg-white/10 text-white px-12 py-5 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/15 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </motion.div>
              </motion.div>

              <motion.p
                className="text-sm font-medium text-neutral-500 mt-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Free to start. No card required.
              </motion.p>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="relative overflow-hidden border-t border-neutral-100 bg-white">
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-10 md:-bottom-16 left-1/2 -translate-x-1/2 font-serif leading-none text-[6rem] md:text-[11rem] text-neutral-900/[0.03]"
        >
          PathAI
        </span>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black">
                <PathMark className="w-[18px] h-[18px] text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight text-neutral-950">PathAI</span>
            </Link>
            <div className={SPEC}>© 2026 PathAI. The Intelligent Curator.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((label) => (
              <a
                key={label}
                href="#"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:text-black transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
