"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import {
  Job,
  SkillGap,
  ResumeProfile,
  fetchJobs,
  fetchDepartments,
  uploadResume,
} from "@/lib/api";
import JobCard from "@/components/JobCard";
import ResumeUpload from "@/components/ResumeUpload";
import ProfileBanner from "@/components/ProfileBanner";
import Header from "@/components/Header";
import { useJobFeed } from "@/hooks/useJobFeed";
import LiveIndicator from "@/components/LiveIndicator";
import { useNotifications } from "@/context/NotificationsContext";
import { useAuth } from "@/context/AuthContext";

const SENIORITY_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-suite", label: "C-Suite" },
];

function formatDept(d: string) {
  return d.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default function JobsPage() {
  const { session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [department, setDepartment] = useState("");
  const [seniority, setSeniority] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Personalization
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Job[] | null>(null);
  const [skillGaps, setSkillGaps] = useState<Record<string, SkillGap>>({});
  const [newJobAlert, setNewJobAlert] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const feedStatus = useJobFeed(
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
    const timer = setTimeout(() => setSearchDebounce(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({
        page,
        page_size: 20,
        department: department || undefined,
        seniority: seniority || undefined,
        search: searchDebounce || undefined,
      });
      setJobs(data.jobs);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch {
      setError("Failed to load jobs. Please check that the API is running.");
    } finally {
      setLoading(false);
    }
  }, [page, department, seniority, searchDebounce]);

  useEffect(() => {
    if (!matchedJobs) loadJobs();
  }, [loadJobs, matchedJobs]);

  useEffect(() => {
    setPage(1);
  }, [department, seniority, searchDebounce]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadResume(file, session?.access_token);
      setProfile(result.profile);
      setMatchedJobs(result.matched_jobs);
      setSkillGaps(result.skill_gaps ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClearProfile = () => {
    setProfile(null);
    setMatchedJobs(null);
    setSkillGaps({});
    setPage(1);
  };

  const clearFilters = () => {
    setDepartment("");
    setSeniority("");
    setSearch("");
  };

  const hasFilters = department || seniority || search;
  const displayedJobs = matchedJobs || jobs;
  const displayedTotal = matchedJobs ? matchedJobs.length : total;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Live toast */}
      <AnimatePresence>
        {newJobAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {newJobAlert} just posted
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAGE HERO ─────────────────────────────────────────────── */}
      <div className="pt-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <AnimatePresence mode="wait">
            {!profile ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"
              >
                {/* Left headline */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-sm">
                    <Compass className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      Path<span className="text-orange-500 font-bold">AI</span> — Live Job Feed
                    </span>
                    <LiveIndicator status={feedStatus} />
                  </div>
                  <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[0.95]">
                    Find Your<br />
                    <span className="text-orange-500">Next Role</span>
                  </h1>
                  <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                    {total > 0
                      ? `${total} open positions — or upload your resume for AI-matched results.`
                      : "Upload your resume for personalized AI-matched recommendations."}
                  </p>
                </div>

                {/* Right: Resume upload */}
                <div className="lg:flex-shrink-0">
                  <ResumeUpload onUpload={handleUpload} isUploading={uploading} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProfileBanner profile={profile} onClear={handleClearProfile} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SEARCH + FILTER BAR ──────────────────────────────── */}
          {!matchedJobs && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              {/* Search */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search jobs, companies, skills…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-400/10 transition-all shadow-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Department pill select */}
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-sm appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{formatDept(d)}</option>
                ))}
              </select>

              {/* Seniority pill select */}
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 shadow-sm appearance-none cursor-pointer min-w-[140px]"
              >
                {SENIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Clear filters */}
              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── ERROR ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 mt-4"
          >
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOB LIST ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Count row */}
        <motion.div
          layout
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {matchedJobs ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{displayedTotal}</strong> AI-matched positions
                </span>
              </span>
            ) : (
              <span>
                <strong className="text-gray-900 dark:text-white">{displayedTotal}</strong> positions
              </span>
            )}
          </p>
        </motion.div>

        {/* Grid / list */}
        {loading && !matchedJobs ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 pt-5 pb-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/3" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-5 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                      <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-5">
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Search className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">No positions found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm font-medium text-orange-500 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedJobs.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i}
                  skillGap={skillGaps[job.id]}
                />
              ))}
            </div>

            {/* Pagination */}
            {!matchedJobs && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex items-center justify-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </motion.button>
                <span className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold min-w-[2.5rem] text-center">
                  {page}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center gap-2">
          <Compass className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Path<span className="text-orange-500">AI</span>
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">— AI-powered job matching</span>
        </div>
      </footer>
    </div>
  );
}
