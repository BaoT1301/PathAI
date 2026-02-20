"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Compass,
  Brain,
  Zap,
  Target,
  Database,
  Code2,
  Layers,
  GitBranch,
  ArrowRight,
  Sparkles,
  FileText,
  BarChart3,
  MessageSquare,
  Bookmark,
  Bell,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import Header from "@/components/Header";

/* ============================================================================
   Helpers
   ============================================================================ */

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

/* ============================================================================
   Section fade-up wrapper
   ============================================================================ */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
   Tech Stack card
   ============================================================================ */
const STACK = [
  {
    layer: "Frontend",
    color: "orange",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-100 dark:border-orange-800",
    icon: Code2,
    iconColor: "text-orange-500",
    items: ["Next.js 14 (App Router)", "TypeScript", "Tailwind CSS v4", "Framer Motion"],
  },
  {
    layer: "Backend",
    color: "blue",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-100 dark:border-blue-800",
    icon: Layers,
    iconColor: "text-blue-500",
    items: ["FastAPI (Python)", "SQLAlchemy Async", "Pydantic v2", "Uvicorn ASGI"],
  },
  {
    layer: "Database",
    color: "violet",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-100 dark:border-violet-800",
    icon: Database,
    iconColor: "text-violet-500",
    items: ["Supabase PostgreSQL", "pgvector extension", "Supabase Auth", "Row-level security"],
  },
  {
    layer: "AI / ML",
    color: "emerald",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-100 dark:border-emerald-800",
    icon: Brain,
    iconColor: "text-emerald-500",
    items: ["OpenAI GPT-4o-mini", "text-embedding-3-small", "Cosine similarity search", "Structured JSON extraction"],
  },
  {
    layer: "Real-time",
    color: "rose",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-100 dark:border-rose-800",
    icon: Zap,
    iconColor: "text-rose-500",
    items: ["WebSocket job feed", "PostgreSQL LISTEN/NOTIFY", "Server-sent events", "In-app notifications"],
  },
  {
    layer: "DevOps",
    color: "amber",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-100 dark:border-amber-800",
    icon: GitBranch,
    iconColor: "text-amber-500",
    items: ["Vercel (frontend)", "Railway (backend)", "Environment secrets", "Continuous deployment"],
  },
];

/* ============================================================================
   Features
   ============================================================================ */
const FEATURES = [
  {
    icon: Brain,
    title: "AI Resume Matching",
    desc: "Upload your resume once. Our dual-layer engine (seniority filter + vector similarity) surfaces roles that actually fit your level and background.",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  },
  {
    icon: Zap,
    title: "Live Job Feed",
    desc: "WebSocket connection keeps your job list live. New roles broadcast from the server in real-time — no refresh needed.",
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  },
  {
    icon: FileText,
    title: "AI Cover Letters",
    desc: "Upload your resume once. Generate tailored, role-specific cover letters for any job in seconds. Regenerate as many times as you like.",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
  {
    icon: MessageSquare,
    title: "Interview Coach",
    desc: "Get 8–10 role-specific questions across Technical, Behavioral, and Culture Fit categories — with tips on how to answer each.",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    icon: BarChart3,
    title: "Skills Gap Analysis",
    desc: "See exactly which skills you have vs. what each job requires. Green = you have it. Orange = missing. Know your gaps before you apply.",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Bookmark,
    title: "Application Tracker",
    desc: "Track every application through Applied → Phone Screen → Interview → Offer. Full Kanban pipeline, right in your dashboard.",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Bell,
    title: "Smart Job Alerts",
    desc: "Set your preferences and get real-time in-app notifications when matching jobs are posted. First-mover advantage.",
    color: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  },
  {
    icon: BarChart3,
    title: "Salary Insights",
    desc: "See where each role sits relative to market. Percentile benchmarks and AI-generated negotiation tips, per job.",
    color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  },
];

/* ============================================================================
   Matching steps
   ============================================================================ */
const MATCHING_STEPS = [
  {
    num: "01",
    title: "Resume Parsing",
    desc: "GPT-4o-mini reads your resume and extracts structured metadata: seniority level, domain, skills list, and years of experience.",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    num: "02",
    title: "Seniority Pre-filter",
    desc: "We eliminate obviously wrong matches before any vector math. A Junior Engineer never sees VP roles. A Director never sees internships.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    num: "03",
    title: "Vector Embedding",
    desc: "Your resume text is embedded with text-embedding-3-small (1536 dimensions). Each job has a pre-computed embedding stored in pgvector.",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    num: "04",
    title: "Cosine Similarity Ranking",
    desc: "pgvector computes cosine similarity between your resume embedding and every pre-filtered job. Top matches bubble up, low matches sink — nothing is hidden.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
];

/* ============================================================================
   Page Component
   ============================================================================ */
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* =====================================================================
          Hero
          ===================================================================== */}
      <section
        ref={heroRef}
        className="relative min-h-[88vh] flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(251,146,60,0.12) 0%, transparent 70%)",
              "radial-gradient(ellipse 80% 60% at 60% 30%, rgba(251,146,60,0.16) 0%, transparent 70%)",
              "radial-gradient(ellipse 80% 60% at 40% 20%, rgba(251,146,60,0.12) 0%, transparent 70%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
          style={{ opacity: "var(--gradient-opacity, 1)" }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-12 w-64 h-64 rounded-full bg-orange-100/40 dark:bg-orange-500/10 blur-3xl pointer-events-none"
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-24 right-16 w-96 h-96 rounded-full bg-orange-50/60 dark:bg-orange-500/5 blur-3xl pointer-events-none"
          animate={{ x: [0, -24, 0], y: [0, 16, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm font-semibold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Career Platform
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-6"
          >
            Path
            <span className="text-orange-500">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            An AI-powered career platform that matches candidates to roles with
            surgical precision — not keyword soup.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg"
            >
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              How It Works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

        </motion.div>
      </section>

      {/* =====================================================================
          Problem → Solution
          ===================================================================== */}
      <section className="py-28 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Job boards are broken.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "❌",
                title: "Keyword Matching",
                desc: "Traditional search finds jobs that contain your keywords — not jobs you'd actually succeed at. \"Python\" matches both intern tutorials and Staff Engineer roles.",
              },
              {
                icon: "🌊",
                title: "Application Black Holes",
                desc: "You send 100 applications and hear back from 3. No tracking, no context, no way to know where you stand or what to follow up on.",
              },
              {
                icon: "🎯",
                title: "No Preparation Path",
                desc: "You land an interview and scramble to prep. No tailored questions, no salary context, no skills gap awareness. Pure guesswork.",
              },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 0.1}>
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-7 border border-gray-100 dark:border-gray-600 shadow-sm h-full">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.3} className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 dark:shadow-orange-900/40">
              <Sparkles className="w-5 h-5" />
              PathAI solves all three.
            </div>
          </FadeUp>
        </div>
      </section>

      {/* =====================================================================
          How Matching Works
          ===================================================================== */}
      <section id="how-it-works" className="py-28 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">The Algorithm</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              Dual-layer matching.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mt-4 max-w-xl mx-auto">
              Pure vector similarity has a blind spot. We add structured pre-filtering to eliminate obviously wrong matches first.
            </p>
          </FadeUp>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-orange-200 via-blue-200 to-emerald-200 dark:from-orange-800 dark:via-blue-800 dark:to-emerald-800 hidden md:block" />

            <div className="space-y-6">
              {MATCHING_STEPS.map((step, i) => (
                <FadeUp key={step.num} delay={i * 0.1}>
                  <div className="flex gap-6 items-start pl-0 md:pl-20 relative">
                    {/* Step number bubble */}
                    <div className={`absolute left-0 top-0 hidden md:flex w-16 h-16 rounded-2xl ${step.bg} items-center justify-center shrink-0`}>
                      <span className={`text-lg font-black ${step.color}`}>{step.num}</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-7 border border-gray-100 dark:border-gray-600 flex-1 hover:border-gray-200 dark:hover:border-gray-500 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-4">
                        <div className={`md:hidden w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-xs font-black ${step.color}`}>{step.num}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* Seniority table */}
          <FadeUp delay={0.2} className="mt-14">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Seniority Compatibility Filter</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">A VP never sees intern roles. A junior never drowns in C-suite listings.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resume Level</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sees Jobs At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {[
                      { level: "Intern", sees: "Intern, Junior" },
                      { level: "Junior", sees: "Intern, Junior, Mid" },
                      { level: "Mid", sees: "Junior, Mid, Senior" },
                      { level: "Senior", sees: "Mid, Senior, Lead" },
                      { level: "Director", sees: "Senior, Lead, Director, VP" },
                      { level: "VP / C-Suite", sees: "Director, VP, C-Suite" },
                    ].map((row) => (
                      <tr key={row.level} className="hover:bg-white dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-3 font-semibold text-gray-800 dark:text-gray-100">{row.level}</td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{row.sees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* =====================================================================
          Features Grid
          ===================================================================== */}
      <section className="py-28 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">What You Get</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              The full job search stack.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.05}>
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-100 dark:border-gray-600 shadow-sm h-full hover:shadow-md hover:border-gray-200 dark:hover:border-gray-500 transition-all group">
                  <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          Tech Stack
          ===================================================================== */}
      <section className="py-28 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Under the Hood</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              Modern stack, intentionally chosen.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mt-4 max-w-xl mx-auto">
              Every technology choice has a reason. No cargo-culting, no resume-driven development.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STACK.map((s, i) => (
              <FadeUp key={s.layer} delay={i * 0.08}>
                <div className={`rounded-2xl p-6 border ${s.bg} ${s.border} h-full`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm`}>
                      <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{s.layer}</span>
                  </div>
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${s.iconColor} shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          Principles
          ===================================================================== */}
      <section className="py-28 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Design Philosophy</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              Opinions we hold strongly.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                title: "Re-rank, don't remove",
                desc: "After resume upload, jobs are re-ordered by match score — not hidden. Low-match jobs sink to the bottom, but remain visible. Job seekers often want to explore adjacent roles, and hiding options feels paternalistic.",
              },
              {
                icon: Lock,
                color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                title: "Upload once, use everywhere",
                desc: "Your resume is saved to your profile on first upload. Every cover letter, every interview prep session auto-uses it. No re-uploading for each action.",
              },
              {
                icon: Sparkles,
                color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
                title: "AI as assistant, not oracle",
                desc: "Generated cover letters come with a disclaimer: review and personalise before sending. Generated interview questions are starting points, not scripts. AI amplifies you — it doesn't replace judgment.",
              },
              {
                icon: Zap,
                color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                title: "Real-time as a default",
                desc: "Waiting for a page refresh to see new jobs is a product failure. WebSocket connections are maintained while you browse, new roles slide in instantly, alert matches toast immediately.",
              },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 0.1}>
                <div className="flex gap-5 p-7 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 hover:shadow-sm transition-all h-full">
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          Builder Section
          ===================================================================== */}
      <section className="py-28 bg-gradient-to-br from-orange-50 dark:from-orange-900/10 via-white dark:via-gray-900 to-orange-50 dark:to-orange-900/10">
        <div className="max-w-4xl mx-auto px-6">
          <FadeUp className="text-center mb-12">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3">Who Built This</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              One engineer. One vision.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mt-4 max-w-xl mx-auto">
              PathAI was designed and built from scratch — a full-stack product that reimagines how candidates find their next role.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-8 sm:p-10">
                <div className="flex items-start gap-6 flex-col sm:flex-row">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
                    P
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">PathAI Developer</h3>
                    <p className="text-orange-500 text-sm font-semibold mb-4">Full-Stack Engineer</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                      Built PathAI from scratch: FastAPI backend with pgvector semantic search, real-time WebSocket job broadcasting, Supabase Auth integration, AI cover letter generation, interview coaching, and a Next.js frontend with Framer Motion animations throughout.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        "FastAPI", "Next.js", "pgvector", "OpenAI", "Supabase",
                        "WebSockets", "Framer Motion", "TypeScript", "SQLAlchemy",
                      ].map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 px-8 sm:px-10 py-5 bg-gray-50 dark:bg-gray-700">
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    { label: "Backend endpoints", value: "12+" },
                    { label: "Frontend components", value: "20+" },
                    { label: "AI integrations", value: "4" },
                    { label: "Lines of TypeScript", value: "3,500+" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* =====================================================================
          CTA
          ===================================================================== */}
      <section className="py-28 bg-gray-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <FadeUp>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Compass className="w-10 h-10 text-orange-500" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-black mb-5">
              Ready to find your path?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Upload your resume, see your matches, prep your interview — all in one place.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                >
                  Browse Jobs <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/15 transition-colors"
                >
                  Create Account
                </Link>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* =====================================================================
          Footer
          ===================================================================== */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-white">
                Path<span className="text-orange-500">AI</span>
              </span>
              <span className="text-gray-600 text-sm">· 2026</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/jobs" className="hover:text-gray-300 transition-colors">Browse Jobs</Link>
              <Link href="/auth" className="hover:text-gray-300 transition-colors">Sign In</Link>
              <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
