"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowRight, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, BarChart3, AlertTriangle, SearchX, SlidersHorizontal } from "lucide-react";
import { Job, fetchJobs, fetchDepartments, fetchSavedJobs, saveJob, unsaveJob, recordEvent } from "@/lib/api";
import Header from "@/components/Header";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useNotifications } from "@/context/NotificationsContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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

// Threshold above which a match score earns the single brand accent; every
// other score reads as a quiet neutral number, not a colored pill.
const STRONG_MATCH = 90;

/* ── FeaturedJobCard ──────────────────────────────────────────── */

function FeaturedJobCard({
  job, index, isSaved, onBookmark,
}: {
  job: Job; index: number; isSaved: boolean; onBookmark: (id: string) => void;
}) {
  const isFeatured = index === 1;
  const score = job.match_score;
  const reduceMotion = useReducedMotion();
  const strong = score != null && score >= STRONG_MATCH;

  // Quiet mono readout instead of a colored "Zap % Match" pill — accent only
  // kicks in for a genuinely strong match, otherwise it's a neutral number.
  const scoreReadout = score != null && (
    <div className="absolute top-4 right-4 text-right leading-none pointer-events-none">
      <div
        className={`font-mono text-lg font-semibold tabular-nums ${
          isFeatured
            ? strong ? "text-white" : "text-white/50"
            : strong ? "text-[#0051d5] dark:text-[#6690ff]" : "text-neutral-400 dark:text-neutral-500"
        }`}
      >
        {Math.round(score)}
        <span className="text-[11px] font-normal opacity-60">%</span>
      </div>
      <div className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${isFeatured ? "text-white/40" : "text-neutral-400 dark:text-neutral-600"}`}>
        Match
      </div>
    </div>
  );

  if (isFeatured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="group relative bg-neutral-950 text-white p-6 rounded-2xl shadow-premium-lg edge-highlight ring-1 ring-white/[0.06] transition-shadow duration-300 flex flex-col overflow-hidden"
      >
        <div className="grain absolute inset-0 pointer-events-none" />
        <div className="spotlight pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {scoreReadout}
        <div className="relative flex items-start gap-4 mb-6">
          <CompanyLogo company={job.company} className="w-12 h-12 rounded-xl text-base shadow-premium" />
          <div className={`min-w-0 ${score != null ? "pr-16" : ""}`}>
            <h3 className="font-semibold text-lg leading-snug line-clamp-2">{job.title}</h3>
            <p className="text-white/70 text-xs font-medium mt-0.5">
              {job.company} • {job.location}
            </p>
          </div>
        </div>
        <div className="relative flex flex-wrap content-start gap-2 mb-6 flex-1">
          {job.salary_range && (
            <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-[0.65rem] font-mono font-semibold tabular-nums uppercase">
              {job.salary_range}
            </span>
          )}
          <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold uppercase">
            {formatDept(job.department)}
          </span>
        </div>
        <div className="relative flex gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="flex-1 bg-white text-black py-2 rounded-lg text-sm font-semibold text-center active:scale-95 transition-transform"
          >
            Apply Fast
          </Link>
          <button
            onClick={(e) => { e.preventDefault(); onBookmark(job.id); }}
            aria-label={isSaved ? "View saved job" : "Save job"}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            {isSaved
              ? <BookmarkCheck className="w-4 h-4 text-white" />
              : <Bookmark className="w-4 h-4 text-white/70" />
            }
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium hover:shadow-premium-lg border border-neutral-200/70 dark:border-white/[0.06] hover:border-[#0051d5]/25 dark:hover:border-[#0051d5]/40 transition-[box-shadow,border-color] duration-300 flex flex-col overflow-hidden"
    >
      <div className="spotlight pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {scoreReadout}
      <div className="relative flex items-start gap-4 mb-6">
        <CompanyLogo company={job.company} className="w-12 h-12 rounded-xl text-base shadow-premium" />
        <div className="min-w-0 pr-16">
          <h3 className="font-semibold text-lg leading-snug text-neutral-950 dark:text-white line-clamp-2">
            {job.title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium mt-0.5">
            {job.company} • {job.location}
          </p>
        </div>
      </div>
      <div className="relative flex flex-wrap content-start gap-2 mb-6 flex-1">
        {job.salary_range && (
          <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[0.65rem] font-mono font-semibold tabular-nums uppercase">
            {job.salary_range}
          </span>
        )}
        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold uppercase">
          {formatDept(job.department)}
        </span>
      </div>
      <div className="relative flex gap-2">
        <Link
          href={`/jobs/${job.id}`}
          className="flex-1 text-neutral-950 dark:text-white font-semibold text-sm flex items-center justify-center gap-1 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
        <button
          onClick={(e) => { e.preventDefault(); onBookmark(job.id); }}
          aria-label={isSaved ? "View saved job" : "Save job"}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-[#0051d5]" />
            : <Bookmark className="w-4 h-4 text-neutral-400" />
          }
        </button>
      </div>
    </motion.div>
  );
}

/* ── JobListRow ───────────────────────────────────────────────── */

function JobListRow({
  job, index, isSaved, onBookmark,
}: {
  job: Job; index: number; isSaved: boolean; onBookmark: (id: string) => void;
}) {
  const score = job.match_score;
  const reduceMotion = useReducedMotion();
  const strong = score != null && score >= STRONG_MATCH;
  const router = useRouter();

  const open = () => router.push(`/jobs/${job.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={open}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") open(); }}
      className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900 shadow-premium hover:shadow-premium-lg border border-neutral-200/70 dark:border-neutral-800 hover:border-[#0051d5]/25 dark:hover:border-[#0051d5]/35 transition-[box-shadow,border-color] duration-300 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0051d5]/40"
    >
      <div className="spotlight pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex gap-4 items-center">
        <CompanyLogo company={job.company} className="w-10 h-10 rounded-lg shadow-premium text-sm" />
        <div>
          <h4 className="font-semibold text-base text-neutral-950 dark:text-white group-hover:text-[#0051d5] dark:group-hover:text-[#6690ff] transition-colors">
            {job.title}
          </h4>
          <div className="flex gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
            <span>{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
          </div>
        </div>
      </div>
      <div className="relative flex items-center gap-4 mt-4 md:mt-0">
        {score != null && (
          <div className="flex flex-col items-end leading-none">
            <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.18em] tabular-nums mb-1">
              Match Score
            </span>
            <span className={`font-mono text-sm font-semibold tabular-nums ${strong ? "text-[#0051d5] dark:text-[#6690ff]" : "text-neutral-900 dark:text-white"}`}>
              {Math.round(score)}%
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark(job.id); }}
          aria-label={isSaved ? "View saved job" : "Save job"}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-[#0051d5]" />
            : <Bookmark className="w-4 h-4 text-neutral-400" />
          }
        </button>
        <Link href={`/jobs/${job.id}`} onClick={(e) => e.stopPropagation()}>
          <button className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-shadow text-neutral-900 dark:text-white">
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
        aria-label="Previous page"
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" strokeWidth={1.75} />
      </button>

      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-400 dark:text-neutral-600 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(Number(p))}
            className={`w-9 h-9 rounded-lg font-mono text-sm font-semibold tabular-nums transition-all ${
              page === p
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === Math.ceil(total / pageSize)}
        aria-label="Next page"
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" strokeWidth={1.75} />
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
  const [error, setError] = useState(false);
  const [salaryMin, setSalaryMin] = useState(0);
  const [debouncedSalary, setDebouncedSalary] = useState(0);
  const [department, setDepartment] = useState("");
  const [seniority, setSeniority] = useState("");
  const [newJobAlert, setNewJobAlert] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const { session } = useAuth();
  const router = useRouter();
  const listRef = useRef<HTMLElement>(null);
  const PAGE_SIZE = 20;
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!session?.access_token) return;
    fetchSavedJobs(session.access_token)
      .then((saved) => setSavedIds(new Set(saved.map((s) => s.job.id))))
      .catch(() => {});
  }, [session]);

  const handleBookmark = async (jobId: string) => {
    if (!session?.access_token) {
      router.push("/auth");
      return;
    }
    if (savedIds.has(jobId)) {
      router.push("/dashboard");
      return;
    }
    try {
      await saveJob(jobId, session.access_token);
      recordEvent(jobId, "saved", session.access_token);
      setSavedIds((prev) => new Set([...prev, jobId]));
      router.push("/dashboard");
    } catch { /* ignore */ }
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchJobs(
        {
          page,
          page_size: PAGE_SIZE,
          department: department || undefined,
          seniority: seniority || undefined,
          salary_min: debouncedSalary > 0 ? debouncedSalary : undefined,
        },
        session?.access_token
      );
      setJobs(data.jobs);
      setTotal(data.total);
    } catch {
      // Couldn't reach the API — surface a distinct error state instead of
      // masking it as "no jobs found".
      setError(true);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, department, seniority, debouncedSalary, session?.access_token]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Debounce the salary slider so dragging doesn't fire a request per tick.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSalary(salaryMin), 350);
    return () => clearTimeout(t);
  }, [salaryMin]);

  useEffect(() => {
    setPage(1);
  }, [department, seniority, debouncedSalary]);

  const handlePageChange = (p: number) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setDepartment("");
    setSeniority("");
    setSalaryMin(0);
  };

  const hasFilters = department || seniority || salaryMin > 0;
  const activeFilterCount =
    (department ? 1 : 0) + (seniority ? 1 : 0) + (salaryMin > 0 ? 1 : 0);
  // Only surface the featured bento grid when there are enough results to also
  // fill a list below it — otherwise show everything as list rows.
  const useFeatured = page === 1 && jobs.length >= 4;
  const featuredJobs = useFeatured ? jobs.slice(0, 3) : [];
  const listJobs = useFeatured ? jobs.slice(3) : jobs;

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

      {/* Editorial masthead + two-column layout */}
      <main className="pt-24 pb-16 px-6 md:px-12 max-w-[1440px] mx-auto">

        {/* ── MASTHEAD ── */}
        <header className="mb-12 md:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]" />
              Live opportunity feed
            </span>
            <h1 className="mt-5 font-serif text-4xl md:text-6xl font-medium leading-[1.02] tracking-tight text-neutral-950 dark:text-white text-balance">
              Roles that fit your trajectory.
            </h1>
            <p className="mt-5 max-w-xl text-base text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
              Every opening, ranked by how closely it matches your experience and
              refreshed the moment new roles land.
            </p>
          </div>
          {total > 0 && (
            <div className="shrink-0 text-left lg:text-right lg:border-l border-neutral-200 dark:border-neutral-800 lg:pl-8">
              <div className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-white leading-none">
                {total}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-600">
                Open roles indexed
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-col md:flex-row gap-12">

        {/* ── SIDEBAR ── */}
        <aside className="w-full md:w-72 flex-shrink-0 space-y-10">

          {/* Discovery Filters */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500 dark:text-neutral-400">
                <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                Discovery Filters
              </h3>
              {activeFilterCount > 0 && (
                <span className="font-mono text-[10px] tabular-nums text-[#0051d5] dark:text-[#6690ff]">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <div className="space-y-8">

              {/* Industry */}
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.18em] mb-3">
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

              {/* Popular quick-filters — single-select, synced with Industry above */}
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.18em] mb-3">
                  Popular
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_TYPE_FILTERS.map((opt) => {
                    const active = department === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDepartment(active ? "" : opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          active
                            ? "bg-[#0051d5] text-white border-[#0051d5]"
                            : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-[#0051d5] hover:text-[#0051d5]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minimum Salary */}
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.18em] mb-3">
                  Minimum Salary (USD)
                </label>
                <input
                  type="range"
                  min={0}
                  max={300000}
                  step={10000}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  aria-label="Minimum salary"
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                />
                <div className="flex justify-between mt-2 text-[0.7rem] font-medium text-neutral-500 dark:text-neutral-400">
                  <span>Any</span>
                  <span className={`font-mono font-semibold tabular-nums ${salaryMin > 0 ? "text-[#0051d5] dark:text-[#6690ff]" : "text-neutral-900 dark:text-white"}`}>
                    {salaryMin === 0 ? "Any" : `${formatSalary(salaryMin)}+`}
                  </span>
                  <span className="font-mono tabular-nums">$300k+</span>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.18em] mb-3">
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
          <div className="relative overflow-hidden bg-neutral-950 dark:bg-neutral-900 p-6 rounded-2xl text-white edge-highlight ring-1 ring-white/[0.06]">
            <div className="grain absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="w-8 h-8 bg-[#0051d5]/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#6690ff]" strokeWidth={1.75} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-white/40">
                PathAI Index
              </span>
            </div>
            <p className="text-sm leading-relaxed font-medium text-white/80">
              PathAI has indexed{" "}
              <span className="text-white font-semibold">
                {total > 0 ? (
                  <>
                    <span className="font-mono tabular-nums">{total}</span> jobs
                  </>
                ) : (
                  "thousands of jobs"
                )}
              </span>{" "}
              today.{" "}
              {total > 0 ? (
                session?.access_token ? (
                  <>
                    Open any job to see your{" "}
                    <span className="text-[#6690ff]">personalized match score</span>.
                  </>
                ) : (
                  <>
                    <span className="text-[#6690ff]">Sign in</span> and upload your resume to unlock match scores.
                  </>
                )
              ) : (
                <span className="text-white/50">Connecting to live feed…</span>
              )}
            </p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <section ref={listRef} className="flex-1 min-w-0 scroll-mt-28">

          {loading ? (
            /* Skeleton shaped like the real feed: bento grid + list rows */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {Array.from({ length: 3 }).map((_, i) => {
                  const dark = i === 1;
                  const block = dark ? "bg-white/10" : "bg-neutral-200 dark:bg-neutral-800";
                  return (
                    <div
                      key={i}
                      className={`p-6 rounded-2xl overflow-hidden animate-pulse ${
                        dark
                          ? "bg-neutral-900 ring-1 ring-white/[0.06]"
                          : "bg-white dark:bg-neutral-900 shadow-premium ring-1 ring-neutral-200/70 dark:ring-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-xl shrink-0 ${block}`} />
                        <div className="flex-1 space-y-2">
                          <div className={`h-4 rounded w-3/4 ${block}`} />
                          <div className={`h-3 rounded w-1/2 ${block}`} />
                        </div>
                      </div>
                      <div className="flex gap-2 mb-6">
                        <div className={`h-5 w-16 rounded-full ${block}`} />
                        <div className={`h-5 w-20 rounded-full ${block}`} />
                      </div>
                      <div className={`h-9 rounded-lg ${block}`} />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-neutral-900 shadow-premium ring-1 ring-neutral-200/70 dark:ring-white/[0.06] animate-pulse"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                      <div className="space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-44" />
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="h-8 w-12 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 ring-1 ring-red-100 dark:ring-red-900/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" strokeWidth={1.75} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-600">
                Connection error
              </span>
              <p className="text-lg font-semibold -mt-1">Couldn&apos;t reach the server</p>
              <p className="text-sm text-neutral-400 max-w-xs">
                The job service isn&apos;t responding. It may be starting up or temporarily down.
              </p>
              <button
                onClick={() => loadJobs()}
                className="mt-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
            </motion.div>
          ) : jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 ring-1 ring-neutral-200/70 dark:ring-white/[0.06] flex items-center justify-center">
                <SearchX className="w-6 h-6 text-neutral-400 dark:text-neutral-500" strokeWidth={1.75} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-600">
                No results
              </span>
              <p className="text-lg font-semibold -mt-1">No positions found</p>
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
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500 dark:text-neutral-400 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]" />
                        Prioritized for you
                      </span>
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                        Immediate Matches
                      </h2>
                    </div>
                    <a
                      href="#recent"
                      className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500 dark:text-neutral-400 border-b border-neutral-300 dark:border-neutral-700 pb-1 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-900 dark:hover:border-white transition-colors"
                    >
                      Browse all
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredJobs.map((job, i) => (
                      <FeaturedJobCard
                        key={job.id}
                        job={job}
                        index={i}
                        isSaved={savedIds.has(job.id)}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Openings — simple list */}
              {listJobs.length > 0 && (
                <section id="recent">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white whitespace-nowrap">
                      Recent Openings
                    </h2>
                    <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-600 whitespace-nowrap">
                      {total} roles
                    </span>
                  </div>
                  <div className="space-y-3">
                    {listJobs.map((job, i) => (
                      <JobListRow
                        key={job.id}
                        job={job}
                        index={i}
                        isSaved={savedIds.has(job.id)}
                        onBookmark={handleBookmark}
                      />
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
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-lg font-semibold text-neutral-950 dark:text-white uppercase tracking-tighter">
              PathAI
            </span>
            <p className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400 dark:text-neutral-600">
              © 2026 PathAI. The Intelligent Curator.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: "Browse Jobs", href: "/jobs" },
              { label: "Upload Resume", href: "/resume" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "About", href: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors opacity-70 hover:opacity-100 duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
