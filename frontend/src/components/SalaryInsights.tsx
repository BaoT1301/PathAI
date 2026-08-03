"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, ChevronDown, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* Shared editorial spec-label: Geist Mono, tracked, tabular. */
const SPEC = "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-500";

interface SalaryData {
  min: number;
  max: number;
  median: number;
  percentile: number;
  target_min: number;
  target_max: number;
  peer_count: number;
  department: string;
  seniority: string;
}

function formatK(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
}

interface Props {
  jobId: string;
}

export default function SalaryInsights({ jobId }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && !data) {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}/salary-insights`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  };

  const barPercent = data
    ? Math.min(100, Math.max(0, ((data.target_min + data.target_max) / 2 - data.min) / (data.max - data.min) * 100))
    : 0;

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
        Salary Insights
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" strokeWidth={1.75} />
          : <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />
        }
      </button>

      <AnimatePresence>
        {open && data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Bar visualization */}
              <div>
                <span className={`${SPEC} block mb-2`}>Market Range</span>
                <div className="flex justify-between text-xs font-mono tabular-nums text-neutral-400 dark:text-neutral-500 mb-1.5">
                  <span>{formatK(data.min)}</span>
                  <span className="text-neutral-900 dark:text-white font-semibold">
                    {formatK(data.target_min)} to {formatK(data.target_max)}
                  </span>
                  <span>{formatK(data.max)}</span>
                </div>
                <div className="relative h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  {/* market range */}
                  <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-600 rounded-full" />
                  {/* target range */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute left-0 top-0 h-full bg-[#0051d5] rounded-full"
                  />
                </div>
              </div>

              {/* Percentile label */}
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  This role pays above{" "}
                  <span className="font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{data.percentile}%</span> of{" "}
                  {data.seniority} {data.department} roles{" "}
                  <span className="text-neutral-400 dark:text-neutral-500">
                    (<span className="font-mono tabular-nums">{data.peer_count}</span> comparable jobs)
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
