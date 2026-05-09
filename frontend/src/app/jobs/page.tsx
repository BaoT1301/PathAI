"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Job, fetchJobs, fetchDepartments } from "@/lib/api";
import Header from "@/components/Header";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useNotifications } from "@/context/NotificationsContext";
import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";

const SENIORITY_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "intern", label: "Intern (0–1 yr)" },
  { value: "junior", label: "Junior (1–3 yrs)" },
  { value: "mid", label: "Mid-Senior (3–6 yrs)" },
  { value: "senior", label: "Senior (6–10 yrs)" },
  { value: "lead", label: "Lead / Principal (10+ yrs)" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-suite", label: "Executive" },
];

const ROLE_TYPE_FILTERS = [
  { label: "Engineering", value: "engineering" },
  { label: "Product Design", value: "design" },
  { label: "Data Science", value: "data_science" },
  { label: "Marketing", value: "marketing" },
];

function formatDept(d: string) {
  return d.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function formatSalary(n: number) {
  return `$${Math.round(n / 1000)}k`;
}

/* ── FeaturedJobCard ──────────────────────────────────────────── */

function FeaturedJobCard({ job, index }: { job: Job; index: number }) {
  const isFeatured = index === 1;
  const score = job.match_score;

  const badge = score != null && (
    <div className="absolute top-0 right-0 p-4">
      <div
        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
          isFeatured
            ? "bg-[#0051d5] text-white"
            : score >= 90
            ? "bg-[#316bf3] text-white"
            : "bg-[#0051d5]/10 text-[#0051d5] border border-[#0051d5]/20"
        }`}
      >
        <Zap className="w-3 h-3" />
        {Math.round(score)}% Match
      </div>
    </div>
  );

  if (isFeatured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="relative bg-neutral-950 text-white p-6 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
      >
        {badge}
        <div className="flex items-start gap-4 mb-6">
          <CompanyLogo company={job.company} className="w-12 h-12 rounded-xl text-base shadow-sm" />
          <div className="min-w-0 pr-20">
            <h3 className="font-bold text-lg leading-snug line-clamp-2">{job.title}</h3>
            <p className="text-white/70 text-xs font-medium mt-0.5">
              {job.company} • {job.location}
            </p>
          </div>
        </div>
        <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-6 flex-1">
          {job.description}
        </p>
        <Link
          href={`/jobs/${job.id}`}
          className="block w-full bg-white text-black py-2 rounded-lg text-sm font-bold text-center active:scale-95 transition-transform"
        >
          Apply Fast
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {badge}
      <div className="flex items-start gap-4 mb-6">
        <CompanyLogo company={job.company} className="w-12 h-12 rounded-xl text-base shadow-sm" />
        <div className="min-w-0 pr-20">
          <h3 className="font-bold text-lg leading-snug text-neutral-950 dark:text-white line-clamp-2">
            {job.title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium mt-0.5">
            {job.company} • {job.location}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 flex-1">
        {job.salary_range && (
          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase">
            {job.salary_range}
          </span>
        )}
        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase">
          {formatDept(job.department)}
        </span>
      </div>
      <Link
        href={`/jobs/${job.id}`}
        className="w-full text-neutral-950 dark:text-white font-bold text-sm flex items-center justify-center gap-1 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        View Details <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}

/* ── JobListRow ───────────────────────────────────────────────── */

function JobListRow({ job, index }: { job: Job; index: number }) {
  const score = job.match_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-all duration-200 border-b border-neutral-200 dark:border-neutral-800 last:border-0"
    >
      <div className="flex gap-4 items-center">
        <CompanyLogo company={job.company} className="w-10 h-10 rounded-lg shadow-sm text-sm" />
        <div>
          <h4 className="font-bold text-base text-neutral-950 dark:text-white group-hover:text-[#0051d5] dark:group-hover:text-blue-400 transition-colors">
            {job.title}
          </h4>
          <div className="flex gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
            <span>{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4 md:mt-0">
        {score != null && (
          <div className="flex flex-col items-end">
            <span className="text-[0.6rem] font-bold text-[#0051d5] uppercase tracking-widest">
              Match Score
            </span>
            <span className="text-sm font-bold text-neutral-950 dark:text-white">
              {Math.round(score)}%
            </span>
          </div>
        )}
        <Link href={`/jobs/${job.id}`}>
          <button className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-shadow text-neutral-900 dark:text-white">
            View
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ── Pagination ───────────────────────────────────────────────── */

function Pagination({
  page, total, pageSize, onChange,
}: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-neutral-600" />
      </button>

      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(Number(p))}
            className={`w-9 h-9 rounded-lg text-sm font-black transition-all ${
              page === p
                ? "bg-black text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === Math.ceil(total / pageSize)}
        className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-neutral-600" />
      </button>
    </div>
  );
}

/* ── JobsPage ─────────────────────────────────────────────────── */

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [salaryMax, setSalaryMax] = useState(300000);
  const [department, setDepartment] = useState("");
  const [seniority, setSeniority] = useState("");
  const [newJobAlert, setNewJobAlert] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const listRef = useRef<HTMLElement>(null);
  const PAGE_SIZE = 20;

  useJobFeed(
    useCallback(
      (job: Job) => {
        setJobs((prev) => {
          if (prev.some((j) => j.id === job.id)) return prev;
          return [job, ...prev];
        });
        setTotal((t) => t + 1);
        setNewJobAlert(`New: ${job.title}`);
        addNotification(job);
        setTimeout(() => setNewJobAlert(null), 4000);
      },
      [addNotification]
    )
  );

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJobs({
        page,
        page_size: PAGE_SIZE,
        department: department || undefined,
        seniority: seniority || undefined,
      });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch {
      /* API unavailable — jobs stay empty */
    } finally {
      setLoading(false);
    }
  }, [page, department, seniority]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [department, seniority]);

  const handlePageChange = (p: number) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setDepartment("");
    setSeniority("");
    setSalaryMax(300000);
  };

  const hasFilters = department || seniority || salaryMax < 300000;
  const featuredJobs = page === 1 ? jobs.slice(0, 3) : [];
  const listJobs = page === 1 ? jobs.slice(3) : jobs;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-neutral-950 text-neutral-900 dark:text-white">
      <Header />

      {/* Live toast */}
      <AnimatePresence>
        {newJobAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-950 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse" />
            {newJobAlert} just posted
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <main className="pt-24 pb-16 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col md:flex-row gap-12">

        {/* ── SIDEBAR ── */}
        <aside className="w-full md:w-72 flex-shrink-0 space-y-10">

          {/* Discovery Filters */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-neutral-500 dark:text-neutral-400 mb-6">
              Discovery Filters
            </h3>
            <div className="space-y-8">

              {/* Industry */}
              <div>
                <label className="block text-[0.75rem] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Industry
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-neutral-200 dark:border-neutral-700 focus:border-[#0051d5] focus:ring-0 text-sm py-2 text-neutral-900 dark:text-white transition-colors cursor-pointer"
                >
                  <option value="">All Industries</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{formatDept(d)}</option>
                  ))}
                </select>
              </div>

              {/* Role Type */}
              <div>
                <label className="block text-[0.75rem] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Role Type
                </label>
                <div className="space-y-2.5">
                  {ROLE_TYPE_FILTERS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={department === opt.value}
                        onChange={() =>
                          setDepartment(department === opt.value ? "" : opt.value)
                        }
                        className="rounded-sm border-neutral-400 text-neutral-900 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-[0.75rem] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Salary Range (USD)
                </label>
                <input
                  type="range"
                  min={50000}
                  max={300000}
                  step={10000}
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                />
                <div className="flex justify-between mt-2 text-[0.7rem] font-medium text-neutral-500 dark:text-neutral-400">
                  <span>$50k</span>
                  <span className="text-neutral-900 dark:text-white font-bold">
                    {salaryMax >= 300000 ? "$300k+" : formatSalary(salaryMax)}
                  </span>
                  <span>$300k+</span>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-[0.75rem] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Experience
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-neutral-200 dark:border-neutral-700 focus:border-[#0051d5] focus:ring-0 text-sm py-2 text-neutral-900 dark:text-white transition-colors cursor-pointer"
                >
                  {SENIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Insight Widget */}
          <div className="bg-neutral-950 dark:bg-neutral-900 p-6 rounded-xl text-white">
            <div className="w-8 h-8 bg-[#0051d5]/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-4 h-4 text-[#316bf3]" />
            </div>
            <p className="text-sm leading-relaxed font-medium text-white/80">
              PathAI has analyzed{" "}
              <span className="text-white font-bold">
                {total > 0 ? `${total} jobs` : "thousands of jobs"}
              </span>{" "}
              today.{" "}
              {total > 0 ? (
                <>
                  <span className="text-[#b4c5ff]">{total} matches</span> perfectly align
                  with your profile.
                </>
              ) : (
                <span className="text-white/50">Connecting to live feed…</span>
              )}
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <section ref={listRef} className="flex-1 min-w-0 scroll-mt-28">

          {loading ? (
            /* Skeleton */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-xl animate-pulse ${
                      i === 1
                        ? "bg-neutral-800"
                        : "bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                  </div>
                ))}
              </div>
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800 animate-pulse"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                      <div className="space-y-2">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-44" />
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-28" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="h-8 w-12 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      <div className="h-8 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-3"
            >
              <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl">
                🔍
              </div>
              <p className="text-lg font-bold">No positions found</p>
              <p className="text-sm text-neutral-400">Try adjusting your filters</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm font-semibold text-[#0051d5] hover:underline underline-offset-4"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Immediate Matches — top 3 bento grid */}
              {featuredJobs.length > 0 && (
                <div className="mb-16">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <span className="text-[0.75rem] font-bold text-[#0051d5] uppercase tracking-[0.1em] mb-2 block">
                        Prioritized For You
                      </span>
                      <h2 className="text-3xl font-extrabold tracking-tighter text-neutral-950 dark:text-white">
                        Immediate Matches
                      </h2>
                    </div>
                    <a
                      href="#recent"
                      className="text-[#0051d5] dark:text-blue-400 font-semibold text-sm hover:underline underline-offset-4 hidden sm:block"
                    >
                      Browse All Matches
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredJobs.map((job, i) => (
                      <FeaturedJobCard key={job.id} job={job} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Openings — simple list */}
              {listJobs.length > 0 && (
                <section id="recent">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-extrabold tracking-tighter text-neutral-950 dark:text-white whitespace-nowrap">
                      Recent Openings
                    </h2>
                    <div className="h-[2px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                  <div>
                    {listJobs.map((job, i) => (
                      <JobListRow key={job.id} job={job} index={i} />
                    ))}
                  </div>

                  <Pagination
                    page={page}
                    total={total}
                    pageSize={PAGE_SIZE}
                    onChange={handlePageChange}
                  />
                </section>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-lg font-black text-neutral-950 dark:text-white uppercase tracking-tighter">
              PathAI
            </span>
            <p className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400 dark:text-neutral-600">
              © 2024 PathAI. The Intelligent Curator.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors opacity-70 hover:opacity-100 duration-300"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
