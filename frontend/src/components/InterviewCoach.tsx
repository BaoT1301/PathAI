"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Lightbulb, Code2, Users, Heart, ChevronDown, RefreshCw } from "lucide-react";
import { Job } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface InterviewQuestion {
  category: string;
  question: string;
  why_asked: string;
  tip: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Technical:    Code2,
  Behavioral:   Users,
  "Culture Fit": Heart,
};

const CATEGORY_STYLES: Record<string, { pill: string; icon: string }> = {
  Technical:    { pill: "bg-violet-50 text-violet-700 border-violet-200",     icon: "text-violet-600" },
  Behavioral:   { pill: "bg-[#0051d5]/10 text-[#0051d5] border-[#0051d5]/20", icon: "text-[#0051d5]" },
  "Culture Fit": { pill: "bg-pink-50 text-pink-700 border-pink-200",           icon: "text-pink-600"   },
};

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[q.category] ?? Lightbulb;
  const styles = CATEGORY_STYLES[q.category] ?? { pill: "bg-neutral-100 text-neutral-700 border-neutral-200", icon: "text-neutral-600" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-neutral-200 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className={`mt-0.5 p-1.5 rounded-lg border ${styles.pill} shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${styles.icon}`} />
        </div>
        <span className="flex-1 text-sm font-semibold text-black leading-snug">{q.question}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="px-4 py-4 bg-neutral-50 space-y-3">
              <div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Why they ask</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{q.why_asked}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#0051d5] uppercase tracking-widest mb-1">Your tip</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{q.tip}</p>
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
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">
              AI Interview Coach
            </p>
            <h2 className="font-black text-black text-lg leading-tight line-clamp-1">{job.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors mt-0.5"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!generated ? (
            <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
              <div className="w-16 h-16 bg-[#0051d5] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#0051d5]/20">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-black text-black text-xl mb-3">Interview Prep</h3>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-8 max-w-xs">
                Get role-specific questions for <strong className="text-black">{job.title}</strong> — each with a why-they-ask breakdown and an expert answer tip.
              </p>

              {error && (
                <p className="text-xs text-red-500 font-semibold mb-4">
                  Something went wrong. Please try again.
                </p>
              )}

              <motion.button
                onClick={generate}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-xs py-4 bg-black text-white text-sm font-black rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                      const styles = CATEGORY_STYLES[category] ?? { icon: "text-neutral-400" };
                      return <Icon className={`w-4 h-4 ${styles.icon}`} />;
                    })()}
                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      {category}
                    </h3>
                    <span className="text-[10px] font-black text-neutral-300">
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
                className="flex items-center gap-2 text-xs text-neutral-400 hover:text-black transition-colors font-semibold mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate questions
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
