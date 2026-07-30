"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { BadgeCheck, BarChart3, Lock, BookOpen, Eye, Network, Gauge } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import Header from "@/components/Header";
import CompanyLogo from "@/components/CompanyLogo";
import { PathMark } from "@/components/Logo";

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

/* Real capability statements replace fabricated stat counters. */
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
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <Header />

      <main className="pt-32 pb-24">

        {/* Hero */}
        <header className="max-w-[1440px] mx-auto px-6 md:px-12 mb-32">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8">
              <motion.span
                className="inline-block px-4 py-1.5 rounded-full bg-[#0051d5] text-white font-semibold text-[0.75rem] uppercase tracking-[0.05em] mb-6"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Our Mission
              </motion.span>

              <motion.h1
                className="text-[3.5rem] md:text-[5rem] font-bold leading-[1.05] tracking-[-0.03em] text-balance text-black mb-8"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                className="text-xl text-[#45474b] max-w-2xl leading-relaxed text-balance"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                PathAI is more than a job board. We are the Intelligent Curator, leveraging
                large-scale language models to decode the complexities of the labor market for
                elite talent.
              </motion.p>

              {/* Capability statements (not fabricated counters) */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 pt-10 border-t border-[#e2e4e6]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.58 }}
              >
                {CAPABILITIES.map(({ title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.62 + i * 0.1 }}
                    className="pl-4 border-l-2 border-[#0051d5]/30"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] shrink-0" />
                      <div className="text-sm font-semibold tracking-tight text-black">{title}</div>
                    </div>
                    <div className="text-sm text-[#76777b] leading-relaxed">{desc}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </header>

        {/* Philosophy */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 mb-40">
          <div className="grid grid-cols-12 gap-6 items-center">

            {/* Left: real matches panel */}
            <FadeUp className="col-span-12 md:col-span-5 order-2 md:order-1 relative" delay={0.05}>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-900 border border-white/[0.06] shadow-premium-lg relative flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"
                      animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      Live Matches
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10">
                      <PathMark className="w-3 h-3 text-white" />
                    </span>
                    <span className="text-white font-semibold text-sm tracking-tight">PathAI</span>
                  </div>
                </div>

                {/* Match rows: real logos via CompanyLogo */}
                <div className="flex-1 flex flex-col justify-center gap-3 px-6 py-6">
                  {FEATURED_MATCHES.map(({ company, role, score }) => (
                    <div
                      key={company}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10"
                    >
                      <CompanyLogo company={company} className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{role}</div>
                        <div className="text-white/40 text-xs truncate mt-0.5">{company}</div>
                      </div>
                      <div className="text-[#6690ff] font-semibold font-mono tabular-nums text-base shrink-0">
                        {score}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-white/10 shrink-0">
                  <p className="text-white/30 text-[11px] leading-relaxed">
                    The Intelligent Curator, scoring every role against your career trajectory.
                  </p>
                </div>
              </div>
              {/* Quote card */}
              <motion.div
                className="absolute -bottom-8 -right-8 p-8 bg-white rounded-2xl border border-neutral-200/70 shadow-premium-lg hidden md:block max-w-[280px]"
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium italic text-[#45474b] leading-relaxed">
                  &ldquo;Intelligence is not just data collection; it is the art of discerning what
                  matters.&rdquo;
                </p>
              </motion.div>
            </FadeUp>

            {/* Right: principles */}
            <FadeUp
              className="col-span-12 md:col-start-7 md:col-span-6 order-1 md:order-2 mb-12 md:mb-0"
              delay={0.1}
            >
              <h2 className="text-4xl font-semibold tracking-tight text-balance mb-8">Our Philosophy</h2>
              <div className="space-y-8">
                {PHILOSOPHY.map(({ icon: Icon, title, desc }) => (
                  <motion.div
                    key={title}
                    whileHover={reduceMotion ? undefined : { x: 6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="group cursor-default"
                  >
                    <h3 className="text-lg font-semibold tracking-tight mb-3 flex items-center gap-2.5">
                      <Icon className="w-5 h-5 text-[#0051d5] shrink-0" strokeWidth={1.75} />
                      {title}
                    </h3>
                    <p className="text-[#45474b] leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Technology Bento */}
        <section className="bg-[#f3f4f5] py-32 mb-40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12">
            <FadeUp className="text-center mb-20">
              <span className="text-[#0051d5] text-[0.75rem] uppercase tracking-[0.1em] font-semibold">
                Technology Stack
              </span>
              <h2 className="text-4xl font-semibold tracking-tight text-balance mt-4">The Intelligent Curator</h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* LLM Core, 2 cols */}
              <motion.div
                className="md:col-span-2 bg-white border border-neutral-200/70 p-10 rounded-3xl shadow-premium flex flex-col justify-between cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div>
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-8">
                    <Network className="text-white w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-balance mb-4">LLM Semantic Reasoning</h3>
                  <p className="text-[#45474b] text-lg leading-relaxed max-w-xl">
                    Our core engine uses customized Large Language Models to read between the lines
                    of job descriptions and resumes, identifying latent skills and cultural
                    alignment that traditional keyword searches miss.
                  </p>
                </div>
                <div className="mt-12 flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#edeeef] rounded-full text-[0.7rem] font-semibold uppercase tracking-wider text-[#45474b]">
                    Context Aware
                  </span>
                  <span className="px-3 py-1 bg-[#edeeef] rounded-full text-[0.7rem] font-semibold uppercase tracking-wider text-[#45474b]">
                    Vector Embeddings
                  </span>
                </div>
              </motion.div>

              {/* Transparent scoring, 1 col (replaces the fabricated accuracy stat) */}
              <motion.div
                className="bg-[#0051d5] p-10 rounded-3xl flex flex-col justify-between text-white cursor-default shadow-premium-lg"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-8">
                  <Gauge className="text-white w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-balance mb-3">Scoring you can read</h3>
                  <p className="opacity-80 leading-relaxed">
                    Every role is scored on skills, trajectory, and culture fit, with the reasoning
                    behind each number shown so you can trust the ranking.
                  </p>
                </div>
              </motion.div>

              {/* Market Data, 1 col */}
              <motion.div
                className="bg-white border border-neutral-200/70 p-10 rounded-3xl shadow-premium cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="w-12 h-12 bg-[#e7e8e9] rounded-xl flex items-center justify-center mb-8">
                  <BarChart3 className="text-black w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-4">Dynamic Market Mapping</h3>
                <p className="text-[#45474b] leading-relaxed">
                  Real-time analysis of industry trends, compensation benchmarks, and hiring
                  velocity across global tech hubs.
                </p>
              </motion.div>

              {/* Privacy, 2 cols */}
              <motion.div
                className="md:col-span-2 bg-black text-white p-10 rounded-3xl flex items-center gap-8 cursor-default shadow-premium-lg"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
              >
                <div className="hidden sm:flex shrink-0 w-12 h-12 bg-white/10 rounded-xl items-center justify-center">
                  <Lock className="text-white w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight mb-2">Sovereign Privacy</h3>
                  <p className="opacity-80 leading-relaxed">
                    Your data is yours. PathAI utilizes zero-retention LLM processing and
                    localized encryption to ensure your job search remains entirely confidential
                    and secure.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12">
          <motion.div
            className="relative bg-black rounded-[4rem] p-16 md:p-32 overflow-hidden text-white shadow-[0_50px_100px_rgba(0,0,0,0.2)]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-semibold uppercase tracking-widest mb-10"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6690ff] inline-block" />
                The Intelligent Curator
              </motion.div>

              <motion.h2
                className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight text-balance mb-10"
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

      {/* Footer */}
      <footer className="bg-zinc-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black">
                <PathMark className="w-[18px] h-[18px] text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight text-zinc-950">PathAI</span>
            </Link>
            <div className="text-xs uppercase tracking-[0.1em] font-semibold text-zinc-400">
              © 2026 PathAI. The Intelligent Curator.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((label) => (
              <a
                key={label}
                href="#"
                className="text-xs uppercase tracking-[0.1em] font-semibold text-zinc-400 hover:text-zinc-950 transition-all opacity-70 hover:opacity-100 duration-300"
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
