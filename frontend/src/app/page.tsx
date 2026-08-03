"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  LayoutGroup,
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

   Shared editorial vocabulary across all three cards:
   - mono "spec-label" headers (Geist Mono, tracking, tabular-nums)
   - one-accent discipline: #0051d5 (#6690ff on dark) marks ONLY the
     decisive moment per card (lifted signals / the #1 match / the
     Interview node). Everything else stays neutral.
   - each dark card: unified radius + .edge-highlight + .grain + hairline ring
   - one signature motion per card, all reduced-motion safe (final state)
   ============================================================ */

const SPEC =
  "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500";

/* Resume signals: real tokens from Alex Chen's resume, with a match weight.
   Blue lands only on the weight value in the ledger. */
const SIGNALS = [
  { name: "Python",         score: "0.98" },
  { name: "PyTorch",        score: "0.95" },
  { name: "TensorFlow",     score: "0.94" },
  { name: "Kubernetes",     score: "0.89" },
  { name: "System Design",  score: "0.91" },
  { name: "Distributed ML", score: "0.93" },
];

/* Match rows in unranked source order (Stripe is NOT first) so the
   ranking visibly resolves on enter. */
const MATCHES = [
  { id: "openai",    role: "AI Research Lead",   co: "OpenAI",    score: 94 },
  { id: "stripe",    role: "Principal Engineer", co: "Stripe",    score: 98 },
  { id: "anthropic", role: "ML Architect",       co: "Anthropic", score: 91 },
];

/* Pipeline events for the scroll-scrubbed trace. */
const EVENTS = [
  { code: "EVT·01", title: "Profile verified",               meta: "98th percentile fit detected",       time: "0:00" },
  { code: "EVT·02", title: "Forwarded to Stripe Recruiting", meta: "Sent to Sarah Chen · Sr. Recruiter", time: "0:03" },
  { code: "EVT·03", title: "Recruiter opened profile",       meta: "3 min 24 sec dwell time",            time: "0:15" },
  { code: "EVT·04", title: "Interview request sent",         meta: "Thu · 2:00 PM Pacific",              time: "now"  },
];

/** Step 01: parse ledger + shared-layout token lift.
 *  A blue caret steps DOWN the resume line by line, drawing a baseline under
 *  the current row. When parsing completes, the skill tokens fly (shared-layout
 *  FLIP) out of the resume and settle into a dotted-leader ledger. */
function ResumeScanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [line, setLine] = useState(0);
  const [parsed, setParsed] = useState(false);

  const ROWS = 4; // identity · role · summary · skills

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setLine(ROWS);
      setParsed(true);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= ROWS) {
        clearInterval(id);
        setLine(ROWS);
        setParsed(true);
      } else {
        setLine(i);
      }
    }, 440);
    return () => clearInterval(id);
  }, [inView, reduceMotion]);

  const done = parsed;
  const rowState = (i: number): "todo" | "active" | "done" =>
    done || line > i ? "done" : line === i ? "active" : "todo";

  return (
    <div
      ref={ref}
      className="relative font-sans h-full rounded-[1.75rem] border border-neutral-800 bg-neutral-900/60 edge-highlight ring-1 ring-white/[0.06] p-7 overflow-hidden flex flex-col gap-6"
    >
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col gap-6">
        {/* spec-label header */}
        <div className="flex items-center justify-between">
          <span className={SPEC}>RESUME · PARSE · 6 SIGNALS</span>
          <span className={SPEC}>{done ? "COMPLETE" : "READING"}</span>
        </div>

        <LayoutGroup>
          {/* Resume, read as a ledger: no window chrome, no scan sweep */}
          <div className="relative flex-1 rounded-2xl border border-white/[0.06] bg-neutral-950/40 overflow-hidden">
            <div className="py-1">
              {[0, 1, 2, 3].map((i) => {
                const st = rowState(i);
                return (
                  <div key={i} className="relative flex">
                    {/* gutter: row number + stepping caret on a hairline rule */}
                    <div className="relative w-9 shrink-0 border-r border-white/[0.06] flex justify-end pr-2.5 pt-3">
                      <span
                        className={`font-mono text-[9px] tabular-nums leading-none transition-colors duration-300 ${
                          st === "active" ? "text-[#6690ff]" : "text-neutral-600"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="absolute right-[-1px] top-2.5 h-4 w-px rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor:
                            st === "active"
                              ? "#0051d5"
                              : st === "done"
                              ? "rgba(255,255,255,0.12)"
                              : "transparent",
                        }}
                      />
                    </div>

                    {/* row content */}
                    <div className="flex-1 min-w-0 pl-4 pr-4 py-2.5">
                      {i === 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 shrink-0">
                            <User size={16} strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-[13px] font-semibold tracking-tight leading-tight">Alex Chen</div>
                            <div className="text-neutral-500 text-[10px] font-mono tracking-tight">San Francisco, CA · alex@gmail.com</div>
                          </div>
                        </div>
                      )}
                      {i === 1 && (
                        <>
                          <div className="text-[12px] font-semibold text-white/90 tracking-tight leading-tight">Senior Machine Learning Engineer</div>
                          <div className="text-[10px] text-neutral-500 font-mono tracking-tight mt-1">Google DeepMind · 2019 to 2024</div>
                        </>
                      )}
                      {i === 2 && (
                        <p className="text-[10px] text-neutral-400 leading-[1.75]">
                          Led production ML pipelines serving 2B+ requests/day. Architected
                          distributed training on TPU v4 pods for large-scale language models
                          and contributed to internal AutoML frameworks used across Google.
                        </p>
                      )}
                      {i === 3 && (
                        <>
                          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">Core Skills</div>
                          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 min-h-[18px]">
                            {!done ? (
                              SIGNALS.map((s, k) => (
                                <span key={s.name} className="inline-flex items-center text-[10px] font-medium tracking-tight leading-none">
                                  <motion.span
                                    layoutId={`sig-${s.name}`}
                                    className="rounded px-1 py-0.5 text-neutral-300"
                                    transition={{ layout: { duration: reduceMotion ? 0 : 0.55, ease: [0.25, 0.46, 0.45, 0.94] } }}
                                  >
                                    {s.name}
                                  </motion.span>
                                  {k < SIGNALS.length - 1 && <span className="text-neutral-700 px-0.5">·</span>}
                                </span>
                              ))
                            ) : (
                              <span className="font-mono text-[9px] tracking-[0.14em] text-neutral-600">6 SIGNALS LIFTED →</span>
                            )}
                          </div>
                        </>
                      )}

                      {/* baseline the caret draws under the current row */}
                      <motion.div
                        className="mt-2 h-px origin-left"
                        style={{ backgroundColor: st === "active" ? "#0051d5" : "rgba(255,255,255,0.06)" }}
                        initial={false}
                        animate={{ scaleX: st === "todo" ? 0 : 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extracted signals: dotted-leader ledger; blue only on the value */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
                style={{ backgroundColor: done ? "#0051d5" : "#3f3f46" }}
              />
              <p className={SPEC}>Extracted Signals</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {SIGNALS.map((s) => (
                <div key={s.name} className="flex items-baseline gap-2">
                  {done && (
                    <motion.span
                      layoutId={`sig-${s.name}`}
                      className="text-[11px] font-medium tracking-tight text-white/90 shrink-0"
                      transition={{ layout: { duration: reduceMotion ? 0 : 0.55, ease: [0.25, 0.46, 0.45, 0.94] } }}
                    >
                      {s.name}
                    </motion.span>
                  )}
                  <span className="flex-1 translate-y-[-3px] border-b border-dotted border-white/15" />
                  <motion.span
                    className="font-mono text-[11px] tabular-nums text-[#6690ff] shrink-0"
                    initial={false}
                    animate={{ opacity: done ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.15 }}
                  >
                    {s.score}
                  </motion.span>
                </div>
              ))}
            </div>
            <p className="mt-4 font-serif italic text-[13px] leading-snug text-neutral-500">
              &ldquo;It read the trajectory, not just the keywords.&rdquo;
            </p>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

/** Step 02: ranking resolves + tick / EQ meter.
 *  Rows enter in source order then re-sort (shared-layout) so #1 rises to the
 *  top; the tick meter fills left-to-right on resolve. Blue marks only #1. */
function MatchVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [ranked, setRanked] = useState(false);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const t = setTimeout(() => setRanked(true), 650);
    return () => clearTimeout(t);
  }, [inView, reduceMotion]);

  const resolved = ranked || reduceMotion;
  const topScore = Math.max(...MATCHES.map((m) => m.score));
  const ordered = resolved ? [...MATCHES].sort((a, b) => b.score - a.score) : MATCHES;
  const TICKS = 24;

  return (
    <div
      ref={ref}
      className="relative font-sans h-full rounded-[1.75rem] border border-neutral-800 bg-neutral-900/60 edge-highlight ring-1 ring-white/[0.06] overflow-hidden flex flex-col"
    >
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col">
        {/* spec-label header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className={SPEC}>MATCH ENGINE · ~50K ROLES</span>
          <span className={SPEC}>RANKED 0.4s</span>
        </div>

        <div className="p-4 flex flex-1 flex-col justify-center gap-2.5">
          {ordered.map((m) => {
            const isTop = resolved && m.score === topScore;
            const lit = Math.round((m.score / 100) * TICKS);
            const delta = m.score - topScore;
            return (
              <motion.div
                key={m.id}
                layout="position"
                transition={{ layout: { duration: reduceMotion ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }}
                className={`group relative flex items-center gap-4 pl-5 pr-4 py-3.5 rounded-xl border transition-colors ${
                  isTop ? "border-[#0051d5]/30 bg-[#0051d5]/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {isTop && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[#0051d5]" />}

                <CompanyLogo company={m.co} className="w-11 h-11 rounded-xl" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-[13px] font-semibold tracking-tight truncate leading-none">{m.role}</span>
                    {isTop && (
                      <span className="shrink-0 inline-flex items-center rounded-md bg-[#0051d5]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-[#6690ff] leading-none">
                        #1
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 tracking-tight leading-none mb-2.5">{m.co}</div>

                  {/* tick / EQ meter: N lit ticks proportional to score, blue only on #1 */}
                  <div className="flex items-end gap-[2px] h-3">
                    {Array.from({ length: TICKS }).map((_, t) => {
                      const on = resolved && t < lit;
                      return (
                        <motion.span
                          key={t}
                          className="w-[3px] rounded-sm"
                          style={{
                            backgroundColor: on
                              ? isTop
                                ? "#0051d5"
                                : "rgba(255,255,255,0.32)"
                              : "rgba(255,255,255,0.08)",
                          }}
                          initial={false}
                          animate={{ height: on ? "100%" : "45%" }}
                          transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : resolved ? t * 0.012 : 0 }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 w-16 text-right">
                  <div className="text-[22px] font-semibold font-mono tabular-nums tracking-tight text-white leading-none">
                    <CountUp to={m.score} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] tabular-nums text-neutral-500 leading-none">
                    {!resolved ? " " : isTop ? "top" : delta}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* footer: status reads once, no pulsing dot */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] tracking-tight text-neutral-500">Ranked by the PathAI engine</span>
          <span className={SPEC}>{resolved ? "RESOLVED" : "SORTING"}</span>
        </div>
      </div>
    </div>
  );
}

/** Step 03: scroll-scrubbed trace + interview ticket.
 *  GSAP ScrollTrigger (over the active Lenis) draws the connector and lights
 *  each node as you scroll; the final Interview node is the single blue moment,
 *  threading into a tactile perforated ticket. Markup renders the final state,
 *  so reduced-motion (GSAP skipped) shows the completed pipeline. */
function InsertionVisual() {
  const reduceMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const connectorRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const finalDotRef = useRef<HTMLDivElement | null>(null);
  const dotRefs = useRef<HTMLDivElement[]>([]);
  const statusProgRef = useRef<HTMLSpanElement>(null);
  const statusDoneRef = useRef<HTMLSpanElement>(null);

  const N = EVENTS.length;

  useEffect(() => {
    if (reduceMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
      });

      tl.fromTo(connectorRef.current, { scaleY: 0 }, { scaleY: 1, ease: "none" }, 0);

      dotRefs.current.forEach((d, i) => {
        if (d) tl.fromTo(d, { scale: 0.5, opacity: 0.35 }, { scale: 1, opacity: 1, ease: "none" }, i * 0.8);
      });

      // final node becomes the single blue moment
      tl.fromTo(
        finalDotRef.current,
        { backgroundColor: "#27272a", borderColor: "rgba(255,255,255,0.10)", color: "#a1a1aa" },
        { backgroundColor: "#0051d5", borderColor: "#0051d5", color: "#ffffff", ease: "none" },
        (N - 1) * 0.8
      );

      // blue thread + ticket resolve
      tl.fromTo(threadRef.current, { scaleY: 0 }, { scaleY: 1, ease: "none" }, "<+0.15");
      tl.fromTo(ticketRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: "none" }, "<+0.1");

      // status reads once: IN PROGRESS → SCHEDULED
      tl.fromTo(statusProgRef.current, { autoAlpha: 1 }, { autoAlpha: 0, ease: "none" }, "<");
      tl.fromTo(statusDoneRef.current, { autoAlpha: 0 }, { autoAlpha: 1, ease: "none" }, "<");
    }, rootRef);

    return () => ctx.revert();
  }, [reduceMotion, N]);

  return (
    <div
      ref={rootRef}
      className="relative font-sans rounded-[1.75rem] border border-neutral-800 bg-neutral-900/60 edge-highlight ring-1 ring-white/[0.06] overflow-hidden"
    >
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10">
        {/* header + status */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <CompanyLogo company="Stripe" className="w-7 h-7 rounded-lg" />
            <div className="min-w-0 leading-none">
              <div className="text-[12px] font-semibold text-white tracking-tight leading-none">Stripe</div>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono tracking-tight">Application timeline</div>
            </div>
          </div>
          {/* Two stacked status labels. CSS default shows the FINAL state
              (Scheduled) so reduced-motion / no-JS renders the completed
              pipeline; GSAP reveals "In Progress" first, then crossfades. */}
          <div className="relative h-3 w-24 shrink-0">
            <span ref={statusProgRef} className="absolute right-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 opacity-0">
              In Progress
            </span>
            <span ref={statusDoneRef} className="absolute right-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6690ff]">
              Scheduled
            </span>
          </div>
        </div>

        {/* spec-label */}
        <div className="px-5 pt-4">
          <span className={SPEC}>PIPELINE · STRIPE · 4 EVENTS</span>
        </div>

        {/* scroll-scrubbed event trace */}
        <div className="px-5 pt-4 pb-5">
          <div
            className="grid"
            style={{ gridTemplateColumns: "56px 28px 1fr", columnGap: 12, rowGap: 4 }}
          >
            {/* connector runs down the dot column */}
            <div
              ref={connectorRef}
              className="w-px justify-self-center bg-white/[0.10] origin-top"
              style={{ gridColumn: 2, gridRow: `1 / ${N + 1}` }}
            />

            {EVENTS.map((ev, i) => {
              const isFinal = i === N - 1;
              return (
                <div key={ev.code} style={{ display: "contents" }}>
                  {/* ledger */}
                  <div className="text-right pt-1.5" style={{ gridColumn: 1, gridRow: i + 1 }}>
                    <div className="font-mono text-[9px] tracking-[0.12em] tabular-nums text-neutral-500 leading-none">{ev.code}</div>
                    <div className="mt-1 font-mono text-[9px] tabular-nums text-neutral-600 leading-none">{ev.time}</div>
                  </div>

                  {/* node */}
                  <div className="justify-self-center pt-0.5" style={{ gridColumn: 2, gridRow: i + 1 }}>
                    <div
                      ref={(n) => {
                        if (n) {
                          dotRefs.current[i] = n;
                          if (isFinal) finalDotRef.current = n;
                        }
                      }}
                      className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${
                        isFinal ? "bg-[#0051d5] text-white" : "bg-neutral-800 border border-white/10 text-neutral-300"
                      }`}
                    >
                      {isFinal ? <Send size={12} strokeWidth={1.75} /> : <Check size={12} strokeWidth={1.75} />}
                    </div>
                  </div>

                  {/* content */}
                  <div className="min-w-0 pb-3" style={{ gridColumn: 3, gridRow: i + 1 }}>
                    <div className={`text-[12px] font-semibold tracking-tight ${isFinal ? "text-white" : "text-white/90"}`}>{ev.title}</div>
                    <div className="mt-1 text-[10px] text-neutral-500 tracking-tight">{ev.meta}</div>
                  </div>
                </div>
              );
            })}

            {/* blue thread from the Interview node down into the ticket */}
            <div
              ref={threadRef}
              className="w-px justify-self-center bg-[#0051d5] origin-top"
              style={{ gridColumn: 2, gridRow: N + 1, height: 22 }}
            />
          </div>

          {/* interview ticket: perforation seam + punched notches */}
          <div
            ref={ticketRef}
            className="relative mt-1 flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
          >
            {/* left stub: the date, the blue interview moment */}
            <div className="flex w-[84px] shrink-0 flex-col items-center justify-center bg-[#0051d5]/[0.08] py-4">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#6690ff]">THU</span>
              <span className="mt-0.5 font-serif text-2xl leading-none text-white">14</span>
            </div>

            {/* perforation seam + punch-hole notches */}
            <div className="my-2 w-px border-l border-dashed border-white/25" />
            <span className="absolute left-[84px] -top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-neutral-950" />
            <span className="absolute left-[84px] -bottom-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-neutral-950" />

            {/* right: details */}
            <div className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold tracking-tight text-white">Interview Scheduled</div>
                <div className="mt-0.5 text-[10px] tracking-tight text-neutral-500">Thursday · 2:00 PM Pacific · Google Meet</div>
              </div>
              <BadgeCheck size={16} strokeWidth={1.75} className="shrink-0 text-[#6690ff]" />
            </div>
          </div>
        </div>
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
      // Connective tissue: the single blue "signal thread" now runs the whole
      // page (hero drop, process spine, CTA terminus). Each [data-thread]
      // scrubs to full as it scrolls through, so the blue reads as one spine
      // down the page. Renders drawn (CSS default) when GSAP is skipped.
      gsap.utils.toArray<HTMLElement>("[data-thread]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "bottom 45%",
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

        {/* Signal-thread seed: the blue spine starts here as a subtle drop and
            recurs down the page, terminating in the final CTA. Scrubbed via
            [data-thread]; renders drawn under reduced motion. */}
        <div
          aria-hidden
          data-thread
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-20 w-px origin-top"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,81,213,0) 0%, rgba(0,81,213,0.5) 100%)",
          }}
        />

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
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums text-white/90">
                Intelligence Driven Hiring
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-sans text-7xl md:text-[9rem] font-black leading-[0.85] tracking-tight hero-gradient-text"
            >
              THE JOB SEARCH
            </motion.h1>

            <motion.span
              variants={fadeUp}
              custom={2}
              className="font-serif italic text-neutral-500 text-4xl md:text-6xl mt-4 lowercase tracking-tight"
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
                skills; they fit your trajectory.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={1}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
              >
                <MagneticButton>
                  <Link href="/jobs">
                    <button className="bg-[#0051d5] text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shrink-0">
                      <ArrowRight size={30} strokeWidth={1.75} />
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
                  className="bg-white p-8 md:p-10 rounded-[2rem] ring-1 ring-neutral-200/70 shadow-premium-lg edge-highlight"
                >
                  {/* Header: real logo + role + score chip */}
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4 min-w-0">
                      <CompanyLogo company="Stripe" className="w-16 h-16 rounded-2xl" />
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 mb-1">
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
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#0051d5]">96%</span>
                    </div>
                  </div>

                  {/* Evidence rows with mini bars. Accent discipline: only the
                      decisive signal (Skills, the 96% match) is blue; the other
                      bars stay neutral. */}
                  <div className="space-y-4">
                    {[
                      { label: "Skills", value: 96, decisive: true },
                      { label: "Trajectory", value: 92, decisive: false },
                      { label: "Culture", value: 88, decisive: false },
                    ].map((sig, i) => (
                      <div key={sig.label}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-neutral-500">{sig.label}</span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              sig.decisive ? "text-[#0051d5]" : "text-neutral-900"
                            }`}
                          >
                            {sig.value}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              sig.decisive ? "bg-[#0051d5]" : "bg-neutral-300"
                            }`}
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
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400">
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
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 text-center mb-8">
          Trusted by teams at
        </p>
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
                  className="h-8 w-auto object-contain grayscale opacity-50 hover:opacity-70 hover:grayscale-0 transition-all duration-300"
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
          {/* Section header: editorial serif */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start mb-28">
            <ScrollReveal>
              <span className={`${SPEC} mb-6 block`}>HOW IT WORKS · 03 STEPS</span>
              <h2 className="font-serif font-medium text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance">
                Beyond the standard application.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-neutral-400 font-medium leading-relaxed max-w-lg lg:mt-14 text-balance">
                We&apos;ve built a proprietary pipeline that removes the friction of
                discovery and replaces it with the precision of AI.
              </p>
            </ScrollReveal>
          </div>

          {/* Steps: one thin blue signal thread ties the three visuals into
              a single instrument (V1 signals → V2 #1 match → V3 timeline).
              The thread is scroll-scrubbed via [data-thread] (page GSAP); under
              reduced motion GSAP is skipped and it renders drawn. */}
          <div className="relative">
            <div
              data-thread
              className="absolute left-10 top-0 bottom-0 w-px hidden md:block origin-top"
              style={{
                background:
                  "linear-gradient(to bottom, #0051d5 0%, rgba(0,81,213,0.55) 60%, rgba(0,81,213,0) 100%)",
              }}
            />

            <div className="space-y-32">
              {/* Step 01 */}
              <motion.div
                className="relative pl-0 md:pl-24"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <span className="hidden md:block absolute left-10 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#0051d5] ring-4 ring-black" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-4 mb-7">
                      <span className={SPEC}>STEP 01</span>
                      <span className="flex-1 h-px bg-white/10" />
                      <ScanLine size={18} strokeWidth={1.75} className="text-neutral-400 shrink-0" />
                    </div>
                    <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-balance mb-5">
                      Deep contextual scanning
                    </h3>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed">
                      We don&apos;t just read keywords. Our models analyze the
                      narrative arc of your career, surfacing latent strengths
                      that even you might have missed.
                    </p>
                  </div>
                  <div className="lg:col-span-7 relative">
                    <span aria-hidden className="pointer-events-none select-none hidden md:block absolute -top-14 -left-4 font-serif text-[10rem] leading-none text-white/[0.03]">01</span>
                    <div className="relative"><ResumeScanner /></div>
                  </div>
                </div>
              </motion.div>

              {/* Step 02 */}
              <motion.div
                className="relative pl-0 md:pl-24"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <span className="hidden md:block absolute left-10 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#0051d5] ring-4 ring-black" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 order-2 lg:order-1 relative">
                    <span aria-hidden className="pointer-events-none select-none hidden md:block absolute -top-14 -right-4 font-serif text-[10rem] leading-none text-white/[0.03]">02</span>
                    <div className="relative"><MatchVisual /></div>
                  </div>
                  <div className="lg:col-span-5 order-1 lg:order-2">
                    <div className="flex items-center gap-4 mb-7">
                      <span className={SPEC}>STEP 02</span>
                      <span className="flex-1 h-px bg-white/10" />
                      <GitBranch size={18} strokeWidth={1.75} className="text-neutral-400 shrink-0" />
                    </div>
                    <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-balance mb-5">
                      Autonomous pattern matching
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
                className="relative pl-0 md:pl-24"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
              >
                <span className="hidden md:block absolute left-10 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#0051d5] ring-4 ring-black" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-4 mb-7">
                      <span className={SPEC}>STEP 03</span>
                      <span className="flex-1 h-px bg-white/10" />
                      <Rocket size={18} strokeWidth={1.75} className="text-neutral-400 shrink-0" />
                    </div>
                    <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-balance mb-5">
                      Verified direct insertion
                    </h3>
                    <p className="text-lg text-neutral-400 font-medium leading-relaxed">
                      We bypass the &quot;black hole&quot; of traditional applications.
                      Your profile lands directly in front of the
                      decision-makers who matter most.
                    </p>
                  </div>
                  <div className="lg:col-span-7 relative">
                    <span aria-hidden className="pointer-events-none select-none hidden md:block absolute -top-14 -left-4 font-serif text-[10rem] leading-none text-white/[0.03]">03</span>
                    <div className="relative"><InsertionVisual /></div>
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
                <h2 className="font-serif font-medium text-6xl tracking-tight text-balance mb-8">
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
                className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums border-b border-neutral-900 pb-2 hover:opacity-50 transition-opacity whitespace-nowrap"
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

                {/* Match-evidence ledger: dotted-leader rows echo the process
                    section's ledgers so the featured card carries the same
                    density instead of a large empty gap. Values stay neutral
                    mono (blue is reserved for the match chip and hover); the
                    values resolve in sequence as the card enters, this
                    section's signature motion. */}
                <div className="relative">
                  <div className={`${SPEC} mb-4`}>Match Evidence</div>
                  <div className="flex flex-col gap-3">
                    {[
                      { k: "Skills alignment",  v: "96" },
                      { k: "Career trajectory", v: "92" },
                      { k: "Culture signal",    v: "88" },
                      { k: "Comp range",        v: "in band" },
                    ].map((row, i) => (
                      <div key={row.k} className="flex items-baseline gap-3">
                        <span className="shrink-0 text-sm font-medium text-neutral-600">
                          {row.k}
                        </span>
                        <span className="flex-1 translate-y-[-3px] border-b border-dotted border-neutral-300" />
                        <motion.span
                          className="shrink-0 font-mono text-sm tabular-nums text-neutral-900"
                          initial={{ opacity: 0, y: 4 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.45,
                            delay: reduceMotion ? 0 : 0.3 + i * 0.12,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                        >
                          {row.v}
                        </motion.span>
                      </div>
                    ))}
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
                      <span className="text-xl font-semibold font-mono tabular-nums text-neutral-900 leading-none transition-colors group-hover:text-[#0051d5]">
                        {PLACEHOLDER_SCORES[i + 1]}
                        <span className="text-neutral-400 text-sm">%</span>
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
              <h2 className="font-serif font-medium text-5xl md:text-7xl tracking-tight text-balance mb-6">
                The numbers
                <br />
                <span className="font-serif italic text-neutral-500">speak for themselves.</span>
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { to: 10,  decimals: 0, suffix: "K+", label: "Professionals Placed", delay: 0,   accent: false },
                { to: 95,  decimals: 0, suffix: "%",  label: "Match Accuracy",       delay: 0.1, accent: true  },
                { to: 3.2, decimals: 1, suffix: "x",  label: "Faster Hiring",        delay: 0.2, accent: false },
                { to: 500, decimals: 0, suffix: "+",  label: "Partner Companies",    delay: 0.3, accent: false },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className={`text-center ${i > 0 ? "md:border-l md:border-neutral-200/70" : ""}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stat.delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div
                    className={`font-mono text-5xl font-semibold tabular-nums tracking-tight mb-3 ${
                      stat.accent ? "text-[#0051d5]" : "text-neutral-900"
                    }`}
                  >
                    <CountUp to={stat.to} decimals={stat.decimals} suffix={stat.suffix} />
                  </div>
                  {/* Signature motion: a thin blue baseline draws under each
                      number as it resolves. Reduced motion renders it final. */}
                  <motion.span
                    aria-hidden
                    className="mx-auto mb-4 block h-px w-10 origin-center bg-[#0051d5]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : 1.2,
                      delay: reduceMotion ? 0 : stat.delay + 0.25,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  />
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA block: the page's dark terminus. The blue signal thread
              arrives from the spine above and lands on the single blue action.
              Depth via grain + edge-highlight + hairline ring; a faint serif
              "04" reads as the culminating act (scan / match / insert / evolve). */}
          <motion.div
            className="relative bg-black rounded-[2.5rem] p-16 md:p-32 overflow-hidden text-white shadow-[0_50px_100px_rgba(0,0,0,0.2)] edge-highlight ring-1 ring-white/[0.06]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="grain absolute inset-0 pointer-events-none" />
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -bottom-16 right-2 md:right-10 font-serif leading-none text-[13rem] md:text-[20rem] text-white/[0.04]"
            >
              04
            </span>

            <div className="relative z-10 max-w-3xl mx-auto">
              {/* Signal-thread terminus: the spine lands here on a blue node.
                  Scrubbed via [data-thread]; renders drawn under reduced motion. */}
              <div className="mb-10 flex justify-center">
                <div className="flex flex-col items-center">
                  <div
                    data-thread
                    aria-hidden
                    className="h-16 w-px origin-top"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(102,144,255,0) 0%, #6690ff 100%)",
                    }}
                  />
                  <span className="-mt-0.5 h-2 w-2 rounded-full bg-[#6690ff]" />
                </div>
              </div>

              <motion.h2
                className="font-serif font-medium text-6xl md:text-8xl leading-[0.95] tracking-tight text-balance mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                Ready to
                <br />
                evolve?
              </motion.h2>
              <p className="text-xl text-neutral-400 font-medium mb-16 leading-relaxed">
                Join 10,000+ top professionals who are letting AI do the heavy
                lifting of career management.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <MagneticButton>
                  <Link
                    href="/auth"
                    className="bg-[#0051d5] text-white px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl inline-block"
                  >
                    Get Started Free
                  </Link>
                </MagneticButton>
                <span className="text-sm font-medium text-neutral-400">
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
      <footer data-reveal className="relative w-full overflow-hidden py-24 px-8 md:px-16 border-t border-neutral-100 bg-white">
        {/* Large faint serif wordmark: a quiet page terminus. */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-14 md:-bottom-24 left-1/2 -translate-x-1/2 font-serif leading-none text-[7rem] md:text-[16rem] text-neutral-900/[0.03]"
        >
          PathAI
        </span>
        <div className="relative z-10 max-w-[1920px] mx-auto">
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
              <p className="font-serif text-xl text-neutral-500 leading-relaxed max-w-sm">
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500">
                    {col.title}
                  </p>
                  <ul className="space-y-4">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm font-medium text-neutral-400 hover:text-black transition-colors"
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
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400">
              © 2026 PathAI. All Rights Reserved.
            </div>
            <div className="flex gap-12">
              <a
                href="#"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:text-black transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:text-black transition-colors"
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
