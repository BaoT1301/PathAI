"use client";

import { motion, useInView } from "framer-motion";
import { BadgeCheck, Brain, BarChart3, Lock, Sparkles, Eye, Navigation } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import Header from "@/components/Header";

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
    icon: Sparkles,
    title: "Editorial Integrity",
    desc: "Every job listed is curated through an AI-driven editorial lens, ensuring only roles from high-growth, high-impact companies reach your dashboard.",
  },
];


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <Header />

      <main className="pt-32 pb-24">

        {/* ── Hero ── */}
        <header className="max-w-[1440px] mx-auto px-6 md:px-12 mb-32">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8">
              <motion.span
                className="inline-block px-4 py-1.5 rounded-full bg-[#316bf3] text-white font-semibold text-[0.75rem] uppercase tracking-[0.05em] mb-6"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Our Mission
              </motion.span>

              <motion.h1
                className="text-[3.5rem] md:text-[5rem] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-8"
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
                className="text-xl text-[#45474b] max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                PathAI is more than a job board. We are the Intelligent Curator, leveraging
                large-scale language models to decode the complexities of the labor market for
                elite talent.
              </motion.p>

              {/* Animated stat strip */}
              <motion.div
                className="flex flex-wrap gap-8 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.58 }}
              >
                {[
                  { value: "10K+", label: "Professionals Placed" },
                  { value: "98%", label: "Match Accuracy" },
                  { value: "500+", label: "Partner Companies" },
                ].map(({ value, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.62 + i * 0.1 }}
                    whileHover={{ scale: 1.08, y: -3 }}
                    className="cursor-default"
                  >
                    <div className="text-3xl font-black text-black">{value}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#76777b] mt-1">{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </header>

        {/* ── Philosophy ── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 mb-40">
          <div className="grid grid-cols-12 gap-6 items-center">

            {/* Left: editorial visual */}
            <FadeUp className="col-span-12 md:col-span-5 order-2 md:order-1 relative" delay={0.05}>
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#181c22] shadow-lg relative">
                {/* Grid pattern */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                {/* Glow blob */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#0051d5]/20 rounded-full blur-3xl pointer-events-none" />
                {/* Center brand mark */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center relative z-10">
                    <motion.div
                      className="w-20 h-20 bg-[#0051d5] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(0,81,213,0.4)]"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Navigation className="text-white" size={32} />
                    </motion.div>
                    <div className="text-white font-black text-3xl tracking-tighter">PathAI</div>
                    <div className="text-white/40 text-xs uppercase tracking-[0.2em] mt-2 font-semibold">
                      The Intelligent Curator
                    </div>
                  </div>
                </div>
                {/* Corner watermarks */}
                <div className="absolute top-8 left-8 text-white/5 text-[120px] font-black leading-none select-none pointer-events-none">
                  AI
                </div>
                <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full border border-white/5 pointer-events-none" />
              </div>
              {/* Quote card */}
              <motion.div
                className="absolute -bottom-8 -right-8 p-8 bg-white rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)] hidden md:block max-w-[280px]"
                whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(25,28,29,0.12)" }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium italic text-[#45474b]">
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
              <h2 className="text-4xl font-bold tracking-tight mb-8">Our Philosophy</h2>
              <div className="space-y-8">
                {PHILOSOPHY.map(({ icon: Icon, title, desc }) => (
                  <motion.div
                    key={title}
                    whileHover={{ x: 6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="group cursor-default"
                  >
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-[#0051d5] shrink-0 group-hover:scale-110 transition-transform duration-200" />
                      {title}
                    </h3>
                    <p className="text-[#45474b] leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Technology Bento ── */}
        <section className="bg-[#f3f4f5] py-32 mb-40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12">
            <FadeUp className="text-center mb-20">
              <span className="text-[#0051d5] text-[0.75rem] uppercase tracking-[0.1em] font-bold">
                Technology Stack
              </span>
              <h2 className="text-4xl font-bold tracking-tight mt-4">The Intelligent Curator</h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* LLM Core — 2 cols */}
              <motion.div
                className="md:col-span-2 bg-white p-10 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)] flex flex-col justify-between cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -8, boxShadow: "0 28px 64px rgba(25,28,29,0.12)" }}
              >
                <div>
                  <motion.div
                    className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-8"
                    whileHover={{ rotate: 8, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Brain className="text-white w-5 h-5" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4">LLM Semantic Reasoning</h3>
                  <p className="text-[#45474b] text-lg leading-relaxed max-w-xl">
                    Our core engine uses customized Large Language Models to read between the lines
                    of job descriptions and resumes, identifying latent skills and cultural
                    alignment that traditional keyword searches miss.
                  </p>
                </div>
                <div className="mt-12 flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#edeeef] rounded-full text-[0.7rem] font-bold uppercase tracking-wider text-[#45474b]">
                    Context Aware
                  </span>
                  <span className="px-3 py-1 bg-[#edeeef] rounded-full text-[0.7rem] font-bold uppercase tracking-wider text-[#45474b]">
                    Vector Embeddings
                  </span>
                </div>
              </motion.div>

              {/* 98% Accuracy — 1 col */}
              <motion.div
                className="bg-[#316bf3] p-10 rounded-xl flex flex-col justify-center text-white cursor-default overflow-hidden relative"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.03, boxShadow: "0 24px 60px rgba(49,107,243,0.4)" }}
              >
                <motion.div
                  className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="text-[4rem] font-black mb-4 leading-none relative z-10">98%</div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Accuracy Rate</h3>
                <p className="opacity-80 leading-relaxed relative z-10">
                  Our proprietary Match Scoring algorithm predicts long-term retention and job
                  satisfaction with unprecedented precision.
                </p>
              </motion.div>

              {/* Market Data — 1 col */}
              <motion.div
                className="bg-white p-10 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)] cursor-default"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -8, boxShadow: "0 28px 64px rgba(25,28,29,0.12)" }}
              >
                <motion.div
                  className="w-12 h-12 bg-[#e7e8e9] rounded-lg flex items-center justify-center mb-8"
                  whileHover={{ rotate: -8, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <BarChart3 className="text-black w-5 h-5" />
                </motion.div>
                <h3 className="text-xl font-bold mb-4">Dynamic Market Mapping</h3>
                <p className="text-[#45474b] leading-relaxed">
                  Real-time analysis of industry trends, compensation benchmarks, and hiring
                  velocity across global tech hubs.
                </p>
              </motion.div>

              {/* Privacy — 2 cols */}
              <motion.div
                className="md:col-span-2 bg-black text-white p-10 rounded-xl flex items-center gap-12 cursor-default overflow-hidden relative"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.015, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
              >
                <motion.div
                  className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#0051d5]/10 rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="hidden lg:flex shrink-0 items-center justify-center relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Lock className="text-white/20 w-16 h-16" />
                  </motion.div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Sovereign Privacy</h3>
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

        {/* ── CTA ── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12">
          <motion.div
            className="relative bg-black rounded-[4rem] p-16 md:p-32 overflow-hidden text-white shadow-[0_50px_100px_rgba(0,0,0,0.15)]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Grid pattern */}
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

            {/* Glow orbs */}
            <motion.div
              className="absolute -top-20 -left-20 w-80 h-80 bg-[#0051d5]/20 rounded-full blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#316bf3]/15 rounded-full blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest mb-10"
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                Network Active
              </motion.div>

              <motion.h2
                className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tight mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                READY TO
                <br />
                <span className="text-[#0051d5]">EVOLVE?</span>
              </motion.h2>

              <motion.p
                className="text-xl text-neutral-400 font-medium mb-14 leading-relaxed"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Join 10,000+ top professionals letting AI match them to roles that
                fit their trajectory — not just their keywords.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/jobs"
                    className="inline-block bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:bg-neutral-100 transition-colors shadow-2xl"
                  >
                    Explore Roles
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/auth"
                    className="inline-block bg-white/10 text-white px-12 py-5 rounded-full font-black text-lg border border-white/20 hover:bg-white/15 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-zinc-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-lg font-black text-zinc-950">PathAI</div>
            <div className="text-xs uppercase tracking-[0.1em] font-semibold text-zinc-400">
              © 2024 PathAI. The Intelligent Curator.
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
