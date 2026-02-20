"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  MapPin, DollarSign, Clock, Building2, ExternalLink, Users, ChevronLeft,
  GraduationCap, Loader2, CheckCircle2, Briefcase, FileText, Bookmark,
  BookmarkCheck, Zap,
} from "lucide-react";
import { Job, fetchJob, applyToJob, getApplicationStatus, saveJob, unsaveJob } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SalaryInsights from "@/components/SalaryInsights";
import InterviewCoach from "@/components/InterviewCoach";
import CoverLetter from "@/components/CoverLetter";
import Header from "@/components/Header";

const DEPT_STYLES: Record<string, { bg: string; text: string; border: string; from: string; darkFrom: string }> = {
  engineering:  { bg: "bg-violet-50 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-300",  border: "border-violet-200 dark:border-violet-700",  from: "from-violet-50/60",  darkFrom: "dark:from-violet-950/40"  },
  data_science: { bg: "bg-indigo-50 dark:bg-indigo-900/30",  text: "text-indigo-700 dark:text-indigo-300",  border: "border-indigo-200 dark:border-indigo-700",  from: "from-indigo-50/60",  darkFrom: "dark:from-indigo-950/40"  },
  product:      { bg: "bg-sky-50 dark:bg-sky-900/30",        text: "text-sky-700 dark:text-sky-300",        border: "border-sky-200 dark:border-sky-700",        from: "from-sky-50/60",     darkFrom: "dark:from-sky-950/40"     },
  design:       { bg: "bg-pink-50 dark:bg-pink-900/30",      text: "text-pink-700 dark:text-pink-300",      border: "border-pink-200 dark:border-pink-700",      from: "from-pink-50/60",    darkFrom: "dark:from-pink-950/40"    },
  marketing:    { bg: "bg-orange-50 dark:bg-orange-900/30",  text: "text-orange-700 dark:text-orange-300",  border: "border-orange-200 dark:border-orange-700",  from: "from-orange-50/60",  darkFrom: "dark:from-orange-950/40"  },
  sales:        { bg: "bg-teal-50 dark:bg-teal-900/30",      text: "text-teal-700 dark:text-teal-300",      border: "border-teal-200 dark:border-teal-700",      from: "from-teal-50/60",    darkFrom: "dark:from-teal-950/40"    },
  finance:      { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700", from: "from-emerald-50/60", darkFrom: "dark:from-emerald-950/40" },
  hr:           { bg: "bg-rose-50 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-200 dark:border-rose-700",      from: "from-rose-50/60",    darkFrom: "dark:from-rose-950/40"    },
  operations:   { bg: "bg-slate-50 dark:bg-slate-900/30",    text: "text-slate-700 dark:text-slate-300",    border: "border-slate-200 dark:border-slate-700",    from: "from-slate-50/60",   darkFrom: "dark:from-slate-950/40"   },
  healthcare:   { bg: "bg-red-50 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",        border: "border-red-200 dark:border-red-700",        from: "from-red-50/60",     darkFrom: "dark:from-red-950/40"     },
};
const DEPT_DEFAULT = { bg: "bg-gray-50 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-200", border: "border-gray-200 dark:border-gray-600", from: "from-gray-50/60", darkFrom: "dark:from-gray-950/40" };

function formatDept(d: string) {
  return d.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function formatSeniority(s: string) {
  return s === "c-suite" ? "C-Suite" : s[0].toUpperCase() + s.slice(1);
}
function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, session } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob(id)
      .then(setJob)
      .catch(() => router.push("/jobs"))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!id || !session?.access_token) return;
    getApplicationStatus(id, session.access_token).then((s) => {
      if (s.status) setAppStatus(s.status);
    });
  }, [id, session]);

  const handleApply = async () => {
    if (!session?.access_token || applying || !job) return;
    setApplying(true);
    try {
      await applyToJob(job.id, session.access_token);
      setAppStatus("applied");
    } catch {
      setAppStatus("applied");
    } finally {
      setApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!session?.access_token || savingBookmark || !job) return;
    setSavingBookmark(true);
    try {
      if (saved) {
        await unsaveJob(job.id, session.access_token);
        setSaved(false);
      } else {
        await saveJob(job.id, session.access_token);
        setSaved(true);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 700);
      }
    } catch { /* ignore */ } finally {
      setSavingBookmark(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading job…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const dept = DEPT_STYLES[job.department] || DEPT_DEFAULT;
  const isApplied = appStatus !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Header />

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className={`bg-gradient-to-b ${dept.from} ${dept.darkFrom} to-white dark:to-gray-800 border-b border-gray-100 dark:border-gray-700`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          {/* Back button */}
          <motion.button
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to jobs
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            {/* Chips row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold border ${dept.bg} ${dept.text} ${dept.border}`}>
                {formatDept(job.department)}
              </span>
              <span className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-300">
                {formatSeniority(job.seniority)}
              </span>
              {job.source === "adzuna" && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-blue-100 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-300">
                  <Zap className="w-3 h-3" /> Adzuna
                </span>
              )}
              {job.match_score != null && (
                <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold ${
                  job.match_score >= 75 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
                  job.match_score >= 50 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
                  "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                  {Math.round(job.match_score)}% match
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-3">
              {job.title}
            </h1>

            {/* Company */}
            {job.company && (
              <p className="flex items-center gap-2 text-lg text-gray-500 dark:text-gray-400 font-medium mb-5">
                <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                {job.company}
              </p>
            )}

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 pb-6 text-sm">
              <span className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-gray-500 dark:text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-200">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                {job.salary_range}
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                Posted {timeAgo(job.posted_date)}
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-gray-500 dark:text-gray-400">
                <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                {job.applicant_count === 0 ? "Be first to apply" : `${job.applicant_count} applicants`}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Main content ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex-1 min-w-0 space-y-5"
          >
            {/* Salary Insights */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <SalaryInsights jobId={job.id} />
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                </div>
                Job Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 leading-relaxed
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                  [&_li]:text-gray-600 dark:[&_li]:text-gray-300
                  [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-white
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2
                  [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-800 dark:[&_h3]:text-gray-100 [&_h3]:mt-4 [&_h3]:mb-1.5"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
              />
              {job.external_url && (
                <a
                  href={job.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read full description on Adzuna
                </a>
              )}
            </div>
          </motion.div>

          {/* ── Sidebar ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 space-y-4"
          >
            {/* Action card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-2.5">
              {user ? (
                <>
                  {/* Apply */}
                  {job.source === "adzuna" && job.external_url ? (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Apply on Adzuna
                    </a>
                  ) : isApplied ? (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Applied
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60"
                    >
                      {applying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Briefcase className="w-4 h-4" /> Quick Apply</>
                      )}
                    </button>
                  )}

                  {/* Interview Prep */}
                  <button
                    onClick={() => setShowCoach(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-orange-400 hover:text-orange-600 transition-all"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Prep Interview
                  </button>

                  {/* Cover Letter */}
                  <button
                    onClick={() => setShowCoverLetter(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-orange-400 hover:text-orange-600 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Cover Letter
                  </button>

                  {/* Save */}
                  <motion.button
                    onClick={handleBookmark}
                    disabled={savingBookmark}
                    animate={justSaved ? { scale: [1, 1.05, 0.97, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      saved
                        ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-600 hover:text-orange-500 dark:hover:text-orange-400"
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {saved ? (
                        <motion.span
                          key="saved"
                          initial={{ scale: 0, rotate: -15 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="flex items-center gap-2"
                        >
                          <BookmarkCheck className="w-4 h-4" /> Saved
                        </motion.span>
                      ) : (
                        <motion.span
                          key="unsaved"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Bookmark className="w-4 h-4" /> Save Job
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </>
              ) : (
                <>
                  <a
                    href="/auth"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Sign in to Apply
                  </a>
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                    Sign in to apply, save jobs, and get interview prep
                  </p>
                </>
              )}
            </div>

            {/* Details card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Job Details
              </h3>
              <div className="space-y-3">
                {[
                  { icon: MapPin, label: "Location", value: job.location },
                  { icon: DollarSign, label: "Salary", value: job.salary_range },
                  { icon: Clock, label: "Posted", value: timeAgo(job.posted_date) },
                  {
                    icon: Users,
                    label: "Applicants",
                    value: job.applicant_count === 0 ? "Be first to apply" : `${job.applicant_count} applied`,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide leading-none mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCoach && <InterviewCoach job={job} onClose={() => setShowCoach(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCoverLetter && <CoverLetter job={job} onClose={() => setShowCoverLetter(false)} />}
      </AnimatePresence>
    </div>
  );
}
