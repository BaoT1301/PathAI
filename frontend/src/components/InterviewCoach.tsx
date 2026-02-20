"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Lightbulb, Code2, Users, Heart, ChevronDown } from "lucide-react";
import { Job } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface InterviewQuestion {
  category: string;
  question: string;
  why_asked: string;
  tip: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Technical: Code2,
  Behavioral: Users,
  "Culture Fit": Heart,
};

const CATEGORY_COLORS: Record<string, string> = {
  Technical:    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
  Behavioral:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  "Culture Fit": "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700",
};

function QuestionCard({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[q.category] ?? Lightbulb;
  const color = CATEGORY_COLORS[q.category] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className={`mt-0.5 p-1.5 rounded-lg border ${color} shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white leading-snug">{q.question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
          >
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Why they ask: </span>
                {q.why_asked}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-orange-600 dark:text-orange-400">Tip: </span>
                {q.tip}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${job.id}/interview-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_summary: resumeSummary }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const grouped = questions.reduce<Record<string, InterviewQuestion[]>>((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Interview Prep</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!generated ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI Interview Coach</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                Generate role-specific interview questions with expert tips tailored to{" "}
                <strong>{job.title}</strong>.
              </p>
              <motion.button
                onClick={generate}
                disabled={loading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto"
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
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, qs]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {qs.map((q, i) => (
                      <QuestionCard key={i} q={q} />
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setGenerated(false); setQuestions([]); }}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-2"
              >
                Regenerate questions
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
