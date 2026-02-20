"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, ChevronDown, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        Salary Insights
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
          : <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
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
            <div className="pt-3 space-y-3">
              {/* Bar visualization */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                  <span>{formatK(data.min)}</span>
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">
                    {formatK(data.target_min)} – {formatK(data.target_max)}
                  </span>
                  <span>{formatK(data.max)}</span>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  {/* market range */}
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 rounded-full" />
                  {/* target range */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute left-0 top-0 h-full bg-orange-400 rounded-full"
                  />
                </div>
              </div>

              {/* Percentile label */}
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  This role pays above{" "}
                  <span className="font-bold text-gray-900 dark:text-white">{data.percentile}%</span> of{" "}
                  {data.seniority} {data.department} roles{" "}
                  <span className="text-gray-400 dark:text-gray-500">({data.peer_count} comparable jobs)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
