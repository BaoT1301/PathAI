"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Building2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Zap,
  Users,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  FileText,
} from "lucide-react";
import { Job, JobSummary, SkillGap, applyToJob, fetchJobSummary, saveJob, unsaveJob } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import InterviewCoach from "./InterviewCoach";
import CoverLetter from "./CoverLetter";
import SalaryInsights from "./SalaryInsights";

const DEPT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  engineering:  { bg: "bg-violet-50 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-300",  border: "border-violet-200 dark:border-violet-700"  },
  data_science: { bg: "bg-indigo-50 dark:bg-indigo-900/30",  text: "text-indigo-700 dark:text-indigo-300",  border: "border-indigo-200 dark:border-indigo-700"  },
  product:      { bg: "bg-sky-50 dark:bg-sky-900/30",        text: "text-sky-700 dark:text-sky-300",        border: "border-sky-200 dark:border-sky-700"        },
  design:       { bg: "bg-pink-50 dark:bg-pink-900/30",      text: "text-pink-700 dark:text-pink-300",      border: "border-pink-200 dark:border-pink-700"      },
  marketing:    { bg: "bg-orange-50 dark:bg-orange-900/30",  text: "text-orange-700 dark:text-orange-300",  border: "border-orange-200 dark:border-orange-700"  },
  sales:        { bg: "bg-teal-50 dark:bg-teal-900/30",      text: "text-teal-700 dark:text-teal-300",      border: "border-teal-200 dark:border-teal-700"      },
  finance:      { bg: "bg-emerald-50 dark:bg-emerald-900/30",text: "text-emerald-700 dark:text-emerald-300",border: "border-emerald-200 dark:border-emerald-700" },
  hr:           { bg: "bg-rose-50 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-200 dark:border-rose-700"      },
  operations:   { bg: "bg-slate-50 dark:bg-slate-800",       text: "text-slate-700 dark:text-slate-300",    border: "border-slate-200 dark:border-slate-600"    },
  healthcare:   { bg: "bg-red-50 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",        border: "border-red-200 dark:border-red-700"        },
};
const DEPT_DEFAULT = { bg: "bg-gray-50 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-600" };

function scoreColor(score: number) {
  if (score >= 75) return { ring: "ring-emerald-400 dark:ring-emerald-700", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" };
  if (score >= 50) return { ring: "ring-blue-400 dark:ring-blue-700",       text: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/30" };
  if (score >= 30) return { ring: "ring-amber-400 dark:ring-amber-700",     text: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/30" };
  return             { ring: "ring-gray-300 dark:ring-gray-600",            text: "text-gray-500 dark:text-gray-400",       bg: "bg-gray-50 dark:bg-gray-800" };
}

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

interface JobCardProps {
  job: Job;
  index?: number;
  skillGap?: SkillGap;
  initialApplicationStatus?: string | null;
  initialSaved?: boolean;
}

export default function JobCard({ job, index = 0, skillGap, initialApplicationStatus, initialSaved = false }: JobCardProps) {
  const { user, session } = useAuth();
  const dept = DEPT_STYLES[job.department] || DEPT_DEFAULT;
  const sc = job.match_score != null ? scoreColor(job.match_score) : null;

  const [appStatus, setAppStatus] = useState<string | null>(initialApplicationStatus ?? null);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isApplied = appStatus !== null;

  const handleApply = async () => {
    if (!session?.access_token || applying) return;
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

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !summary) {
      setSummaryLoading(true);
      try {
        const s = await fetchJobSummary(job.id);
        setSummary(s);
      } catch {
        /* silently fail — full description shown as fallback */
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  const handleBookmark = async () => {
    if (!session?.access_token || savingBookmark) return;
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
    } catch {
      /* silently ignore */
    } finally {
      setSavingBookmark(false);
    }
  };

  // Open Adzuna in a new tab, then listen for when the user returns to ask "Did you apply?"
  const handleAdzunaApply = () => {
    if (!job.external_url) return;
    window.open(job.external_url, "_blank", "noopener,noreferrer");
    // Wait briefly so the new tab can steal focus before we start listening
    setTimeout(() => {
      const onFocus = () => {
        setShowTrackModal(true);
        window.removeEventListener("focus", onFocus);
      };
      window.addEventListener("focus", onFocus);
    }, 600);
  };

  const handleConfirmApply = async () => {
    if (!session?.access_token || tracking) return;
    setTracking(true);
    setTrackError(null);
    try {
      await applyToJob(job.id, session.access_token);
      setAppStatus("applied");
      setShowTrackModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setTrackError(msg === "Already applied to this job" ? null : msg);
      // If already applied (409), just mark as applied and close
      if (msg === "Already applied to this job") {
        setAppStatus("applied");
        setShowTrackModal(false);
      }
    } finally {
      setTracking(false);
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300"
      >
        <div className="px-5 pt-5 pb-4">
          {/* ── TOP ROW ──────────────────────────────────── */}
          <div className="flex items-start gap-4">
            {/* Score circle */}
            {sc && job.match_score != null && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.04 + 0.15 }}
                className={`shrink-0 w-14 h-14 rounded-2xl ${sc.bg} ring-2 ${sc.ring} flex flex-col items-center justify-center`}
              >
                <span className={`text-lg font-black leading-none ${sc.text}`}>
                  {Math.round(job.match_score)}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${sc.text} opacity-60`}>
                  match
                </span>
              </motion.div>
            )}

            {/* Title + company + tags */}
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${job.id}`} className="group/title">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover/title:text-orange-500 transition-colors duration-200 line-clamp-2">
                  {job.title}
                </h3>
              </Link>
              {job.company && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                  {job.company}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${dept.bg} ${dept.text} ${dept.border}`}>
                  {formatDept(job.department)}
                </span>
                <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {formatSeniority(job.seniority)}
                </span>
                {job.source === "adzuna" && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-300">
                    <Zap className="w-3 h-3" />
                    Adzuna
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── META ROW ─────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
              <DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              {job.salary_range}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              {timeAgo(job.posted_date)}
            </span>
          </div>

          {/* ── DESCRIPTION PREVIEW ───────────────────────── */}
          <AnimatePresence initial={false}>
            {!expanded && (
              <motion.p
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2"
              >
                {job.description}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── EXPANDED: AI SUMMARY ──────────────────────── */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                {summaryLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    Generating AI summary…
                  </div>
                ) : summary ? (
                  <div className="mt-4 space-y-4">
                    {/* One-liner */}
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium italic border-l-2 border-orange-400 pl-3 leading-relaxed">
                      {summary.one_liner}
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        {summary.role_type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        {summary.experience_level}
                      </span>
                      {summary.highlights.slice(0, 2).map((h) => (
                        <span key={h} className="inline-flex items-center gap-1 rounded-lg border border-orange-100 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
                          ✦ {h}
                        </span>
                      ))}
                    </div>

                    {/* Required skills */}
                    {summary.required_skills.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.required_skills.map((s, i) => (
                            <motion.span
                              key={s}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="rounded-lg bg-gray-900 dark:bg-white/90 text-white dark:text-gray-900 px-2.5 py-0.5 text-xs font-semibold"
                            >
                              {s}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nice to have */}
                    {summary.nice_to_have.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                          Nice to Have
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.nice_to_have.map((s) => (
                            <span key={s} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill gap match */}
                    {skillGap && (skillGap.matching_skills.length > 0 || skillGap.missing_skills.length > 0) && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                          Your Match
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {skillGap.matching_skills.map((s) => (
                            <span key={s} className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold">
                              ✓ {s}
                            </span>
                          ))}
                          {skillGap.missing_skills.map((s) => (
                            <span key={s} className="rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 text-xs font-semibold">
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collapsible full description */}
                    <details className="group/det">
                      <summary className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer select-none transition-colors list-none flex items-center gap-1">
                        <ChevronDown className="w-3.5 h-3.5 group-open/det:rotate-180 transition-transform" />
                        Full description
                      </summary>
                      <div
                        className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                      />
                    </details>
                  </div>
                ) : (
                  /* Fallback if summary failed */
                  <div
                    className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_p]:mb-2 [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── EXPAND TOGGLE ─────────────────────────────── */}
          <motion.button
            onClick={handleExpand}
            whileHover={{ x: 2 }}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {expanded ? "Show less" : "AI Summary & Skills"}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.button>

          {/* ── SALARY INSIGHTS ───────────────────────────── */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <SalaryInsights jobId={job.id} />
          </div>

          {/* ── ACTION BUTTONS ────────────────────────────── */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
            {user ? (
              <>
                {isApplied ? (
                  <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-transparent dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                  </span>
                ) : job.source === "adzuna" && job.external_url ? (
                  <motion.button
                    onClick={handleAdzunaApply}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Apply on Adzuna
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleApply}
                    disabled={applying}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                  >
                    {applying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Quick Apply"
                    )}
                  </motion.button>
                )}
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => setShowCoverLetter(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    title="Generate cover letter"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Cover Letter
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCoach(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    title="AI interview prep"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-all"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Prep
                  </motion.button>
                  {user && (
                    <motion.button
                      onClick={handleBookmark}
                      disabled={savingBookmark}
                      animate={justSaved
                        ? { scale: [1, 1.45, 0.85, 1.15, 1] }
                        : { scale: 1 }
                      }
                      transition={{ duration: 0.5 }}
                      whileTap={{ scale: 0.85 }}
                      title={saved ? "Remove bookmark" : "Save job"}
                      className={`w-7 h-7 flex items-center justify-center rounded-xl border transition-all duration-200 ${
                        saved
                          ? "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500"
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {saved ? (
                          <motion.div
                            key="saved"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 20 }}
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                          >
                            <BookmarkCheck className="w-3.5 h-3.5 text-orange-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="unsaved"
                            initial={{ scale: 0.7, rotate: 20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.7, rotate: -20 }}
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                          >
                            <Bookmark className="w-3.5 h-3.5 text-gray-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
              >
                Sign in to apply &amp; track →
              </Link>
            )}
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showCoach && <InterviewCoach job={job} onClose={() => setShowCoach(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showCoverLetter && (
          <CoverLetter
            job={job}
            onClose={() => setShowCoverLetter(false)}
          />
        )}
      </AnimatePresence>

      {/* ── ADZUNA TRACKING MODAL ─────────────────────────── */}
      <AnimatePresence>
        {showTrackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowTrackModal(false); setTrackError(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                    Did you apply?
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Track your application on PathAI</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-3 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                {job.company && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.company}</p>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                We noticed you visited Adzuna. If you submitted your application, we&apos;ll add it to your dashboard so you can track it through every stage.
              </p>

              {trackError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{trackError}</p>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmApply}
                  disabled={tracking}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  {tracking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Yes, I applied!</>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowTrackModal(false); setTrackError(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  Not yet
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
