"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Loader2, Lightbulb, Code2, Users, Heart, ChevronDown, RefreshCw } from "lucide-react";
import { Job } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface InterviewQuestion {
  category: string;
  question: string;
  why_asked: string;
  tip: string;
}

// One neutral treatment for every category (the icon shape carries the
// distinction, not a rainbow of hues) plus the single brand accent, reserved
// for the "Your tip" callout below.
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Technical:    Code2,
  Behavioral:   Users,
  "Culture Fit": Heart,
};

const CATEGORY_STYLE = {
  pill: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
  icon: "text-neutral-500 dark:text-neutral-400",
};

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[q.category] ?? Lightbulb;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
      >
        <div className={`mt-0.5 p-1.5 rounded-lg border ${CATEGORY_STYLE.pill} shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${CATEGORY_STYLE.icon}`} strokeWidth={1.75} />
        </div>
        <span className="flex-1 text-sm font-semibold text-neutral-900 dark:text-white leading-snug">{q.question}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-100 dark:border-neutral-800"
          >
            <div className="px-4 py-4 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-neutral-900 dark:text-white uppercase tracking-widest mb-1">Why they ask</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{q.why_asked}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#0051d5] dark:text-[#6690ff] uppercase tracking-widest mb-1">Your tip</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{q.tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Props {
  job: Job;
  resumeSummary?: string;
  onClose: () => void;
}

export default function InterviewCoach({ job, resumeSummary = "", onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${job.id}/interview-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_summary: resumeSummary }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setGenerated(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setGenerated(false); setQuestions([]); setError(false); };

  const grouped = questions.reduce<Record<string, InterviewQuestion[]>>((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});

  const categoryOrder = ["Technical", "Behavioral", "Culture Fit"];
  const sortedGroups = categoryOrder
    .filter((c) => grouped[c]?.length)
    .map((c) => [c, grouped[c]] as [string, InterviewQuestion[]]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />

      {/* Panel */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
        animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200/70 dark:border-neutral-800 shadow-premium-lg z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-1">
              AI Interview Coach
            </p>
            <h2 className="font-semibold text-neutral-900 dark:text-white text-lg leading-tight tracking-tight line-clamp-1">{job.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mt-0.5"
          >
            <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!generated ? (
            <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
              <div className="w-16 h-16 bg-[#0051d5] rounded-2xl flex items-center justify-center mx-auto mb-6 glow-accent">
                <Lightbulb className="w-8 h-8 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-xl mb-3 tracking-tight">Interview Prep</h3>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed mb-8 max-w-xs">
                Get role-specific questions for <strong className="text-neutral-900 dark:text-white">{job.title}</strong>, each with a why-they-ask breakdown and an expert answer tip.
              </p>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 font-semibold mb-4">
                  Something went wrong. Please try again.
                </p>
              )}

              <motion.button
                onClick={generate}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-xs py-4 bg-black text-white dark:bg-white dark:text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                    Generating questions…
                  </>
                ) : (
                  "Generate Questions"
                )}
              </motion.button>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {sortedGroups.map(([category, qs]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const Icon = CATEGORY_ICONS[category] ?? Lightbulb;
                      return <Icon className={`w-4 h-4 ${CATEGORY_STYLE.icon}`} strokeWidth={1.75} />;
                    })()}
                    <h3 className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      {category}
                    </h3>
                    <span className="text-[10px] font-semibold font-mono tabular-nums text-neutral-300 dark:text-neutral-600">
                      {qs.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {qs.map((q, i) => (
                      <QuestionCard key={i} q={q} index={i} />
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={reset}
                className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors font-semibold mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                Regenerate questions
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
