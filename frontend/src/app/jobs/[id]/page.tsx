"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  MapPin, DollarSign, Building2, ChevronLeft,
  Loader2, CheckCircle2, Clock,
  Bookmark, BookmarkCheck, Share2, ExternalLink, Lightbulb,
  Target, ArrowRight, FileText, BadgeCheck,
} from "lucide-react";
import { Job, fetchJob, applyToJob, getApplicationStatus, saveJob, unsaveJob, getSavedJobStatus, getJobMatchScore, recordEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import InterviewCoach from "@/components/InterviewCoach";
import CoverLetter from "@/components/CoverLetter";
import SalaryInsights from "@/components/SalaryInsights";
import CompanyLogo from "@/components/CompanyLogo";
import Header from "@/components/Header";
import Link from "next/link";

/* Editorial spec-label: Geist Mono, tracked, tabular. The eyebrow vocabulary
   shared with the landing page. Functional UI stays Geist + mono; only the job
   title reaches for the serif. */
const SPEC = "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-500";

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
  const reduceMotion = useReducedMotion();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [personalScore, setPersonalScore] = useState<number | null | "loading">("loading");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob(id)
      .then(setJob)
      .catch(() => router.push("/jobs"))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!id || !session?.access_token) {
      setPersonalScore(null);
      return;
    }
    getApplicationStatus(id, session.access_token).then((s) => {
      if (s.status) setAppStatus(s.status);
    });
    getSavedJobStatus(id, session.access_token).then((s) => {
      setSaved(s.saved);
    });
    getJobMatchScore(id, session.access_token).then((data) => {
      setPersonalScore(data?.match_score ?? null);
    });
    recordEvent(id, "viewed", session.access_token);
  }, [id, session]);

  const handleApply = async () => {
    if (!session?.access_token || applying || !job) return;
    setApplying(true);
    try {
      await applyToJob(job.id, session.access_token);
      setAppStatus("applied");
      recordEvent(job.id, "applied", session.access_token);
    } catch {
      setAppStatus("applied");
    } finally {
      setApplying(false);
    }
  };

  const handleExternalApply = () => {
    if (!job?.external_url) return;
    window.open(job.external_url, "_blank", "noopener,noreferrer");
    setShowAppliedModal(true);
  };

  const handleConfirmApplied = async () => {
    setShowAppliedModal(false);
    if (!session?.access_token || !job) return;
    setApplying(true);
    try {
      await applyToJob(job.id, session.access_token);
      setAppStatus("applied");
      recordEvent(job.id, "applied", session.access_token);
    } catch {
      setAppStatus("applied");
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: job.title,
      text: `${job.title}${job.company ? ` at ${job.company}` : ""} on PathAI`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* user cancelled share or clipboard blocked, ignore */
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
        recordEvent(job.id, "saved", session.access_token);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 700);
      }
    } catch { /* ignore */ } finally {
      setSavingBookmark(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
            <p className={SPEC}>Loading role</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isApplied = appStatus !== null;
  const companyInitial = job.company?.[0]?.toUpperCase() ?? "?";
  const resolvedScore = personalScore !== "loading" ? personalScore : job.match_score;
  const matchScore = resolvedScore != null ? Math.round(resolvedScore) : null;
  const matchLabel =
    personalScore === "loading" ? "Analyzing…"
    : matchScore == null ? "Upload Resume"
    : matchScore >= 80 ? "Strong Match"
    : matchScore >= 60 ? "Good Match"
    : "Partial Match";

  // The "why": a single verdict sentence that closes the analysis.
  const whyText =
    personalScore === "loading" ? "PathAI is weighing your background against this role."
    : matchScore == null ? "Upload your resume so PathAI can weigh your background against this role."
    : matchScore >= 80 ? "Your trajectory maps strongly onto this role's core requirements."
    : matchScore >= 60 ? "A solid overlap, with a few areas worth strengthening before you apply."
    : "Partial overlap. Weigh the gaps carefully before you apply.";

  /* Single source of truth for the Apply action, rendered both above the fold
     (in the match card) and in the sticky bar. Preserves every branch:
     unauthenticated -> sign in; source==="adzuna" -> external apply + confirm
     modal; internal -> quick apply; applied -> success state. The primary
     Apply is the page's one blue moment alongside the match score. */
  const renderApply = (variant: "primary" | "bar") => {
    const shape =
      "inline-flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all " +
      (variant === "primary" ? "w-full py-3.5" : "flex-1 md:flex-none px-10 py-3");
    const accent =
      "bg-[#0051d5] text-white hover:bg-[#0040a8] active:scale-[0.98] shadow-premium";
    const done = "bg-emerald-600 text-white cursor-default";

    if (!user) {
      return (
        <Link href="/auth" className={`${shape} ${accent} text-center`}>
          Sign in to Apply
        </Link>
      );
    }
    if (job.source === "adzuna" && job.external_url) {
      if (isApplied) {
        return (
          <div className={`${shape} ${done}`}>
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Applied
          </div>
        );
      }
      return (
        <motion.button onClick={handleExternalApply} whileTap={{ scale: 0.96 }} className={`${shape} ${accent}`}>
          Apply Now
          <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
        </motion.button>
      );
    }
    if (isApplied) {
      return (
        <div className={`${shape} ${done}`}>
          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Applied
        </div>
      );
    }
    return (
      <motion.button
        onClick={handleApply}
        disabled={applying}
        whileTap={{ scale: 0.96 }}
        className={`${shape} ${accent} disabled:opacity-60`}
      >
        {applying
          ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
          : (<>Quick Apply <ArrowRight className="w-4 h-4" strokeWidth={1.75} /></>)
        }
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 antialiased">
      <Header />

      <main className="pt-24 pb-36 px-6 md:px-12 max-w-[1440px] mx-auto">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors font-mono text-[11px] uppercase tracking-[0.18em]"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
            Back to Search
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main Content (8 cols) ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* Job Header Card */}
            <motion.section
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-2xl shadow-premium-lg edge-highlight ring-1 ring-neutral-200/70 dark:ring-white/[0.06] border border-neutral-200/70 dark:border-neutral-800"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex gap-6 items-start min-w-0">
                  <CompanyLogo
                    company={job.company}
                    className="w-16 h-16 rounded-2xl shadow-premium text-xl shrink-0"
                  />
                  <div className="min-w-0">
                    <span className={`${SPEC} block mb-2`}>Open Position · {formatDept(job.department)}</span>
                    {/* The one serif moment on this surface. */}
                    <h1 className="font-serif font-medium text-4xl md:text-5xl tracking-tight text-balance text-neutral-900 dark:text-white mb-3 leading-[1.05]">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                      {job.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" strokeWidth={1.75} />
                          {job.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" strokeWidth={1.75} />
                        {job.location}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" strokeWidth={1.75} />
                          <span className="font-mono tabular-nums">{job.salary_range}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bookmark + Share */}
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    onClick={handleBookmark}
                    disabled={savingBookmark}
                    aria-label={saved ? "Remove bookmark" : "Save job"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={justSaved ? { scale: [1, 1.15, 0.95, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {saved
                      ? <BookmarkCheck className="w-5 h-5 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
                      : <Bookmark className="w-5 h-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
                    }
                  </motion.button>
                  <button
                    onClick={handleShare}
                    aria-label="Share job"
                    className="relative p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
                    {linkCopied && (
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-md">
                        Link copied
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tag pills */}
              <div className="mt-8 pt-8 border-t border-neutral-200/70 dark:border-neutral-800 flex flex-wrap gap-2.5">
                {["Full-time", formatDept(job.department), formatSeniority(job.seniority)].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 rounded-full text-[11px] font-semibold text-neutral-500 dark:text-neutral-300 uppercase tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
                {matchScore != null && (
                  <span className="px-4 py-1.5 bg-[#0051d5]/10 dark:bg-[#0051d5]/15 border border-[#0051d5]/15 text-[#0051d5] dark:text-[#6690ff] text-[11px] font-semibold uppercase tracking-[0.12em] rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] dark:bg-[#6690ff]" />
                    <span className="font-mono tabular-nums">{matchScore}%</span> Match
                  </span>
                )}
              </div>
            </motion.section>

            {/* Job Description */}
            <motion.section
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-8"
            >
              <div>
                <span className={`${SPEC} block mb-3`}>The Role</span>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-6">About the Role</h2>
                <div
                  className="text-neutral-500 dark:text-neutral-400 leading-relaxed space-y-6 text-lg
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
                    [&_li]:text-neutral-500 dark:[&_li]:text-neutral-400
                    [&_p]:mb-4 [&_p]:leading-relaxed
                    [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white
                    [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-900 dark:[&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                />
                {job.external_url && (
                  <a
                    href={job.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:border-[#0051d5] hover:text-[#0051d5] dark:hover:text-[#6690ff] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
                    Read full description
                  </a>
                )}
              </div>
            </motion.section>
          </div>

          {/* ── Right Sidebar (4 cols, sticky) ── */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">

            {/* AI Match Analysis, text-based: verdict, evidence, why.
                Mono score is the single blue moment; the primary Apply below it
                is the page's decisive action, visible above the fold. */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white dark:bg-neutral-900 p-7 rounded-2xl shadow-premium-lg edge-highlight ring-1 ring-neutral-200/70 dark:ring-white/[0.06] border border-neutral-200/70 dark:border-neutral-800"
            >
              {/* header */}
              <div className="flex items-center justify-between mb-6">
                <span className={SPEC}>AI Match Analysis</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
                  Verified
                </span>
              </div>

              {/* verdict: the mono score + label */}
              <div className="flex items-end gap-3">
                {personalScore === "loading" ? (
                  <div className="h-12 w-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                ) : (
                  <span className="font-mono tabular-nums text-5xl font-semibold tracking-tight leading-none text-[#0051d5] dark:text-[#6690ff]">
                    {matchScore != null ? `${matchScore}%` : "N/A"}
                  </span>
                )}
                <span className="pb-1 text-sm font-semibold text-neutral-900 dark:text-white">{matchLabel}</span>
              </div>

              {/* thin proportional baseline (not a gauge) */}
              <div className="mt-4 h-1 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#0051d5] dark:bg-[#6690ff]"
                  initial={{ width: 0 }}
                  animate={{ width: matchScore != null ? `${matchScore}%` : "0%" }}
                  transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>

              {/* evidence */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" strokeWidth={1.75} />
                    <span className={SPEC}>Skill Alignment</span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {matchScore == null
                      ? "Upload your resume to see how your skills align."
                      : matchScore >= 70
                      ? "Your skills closely match what this role requires."
                      : "You meet some requirements, though a few gaps exist."}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" strokeWidth={1.75} />
                    <span className={SPEC}>Career Path</span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {matchScore == null
                      ? "Sign in and upload your resume for a full analysis."
                      : matchScore >= 80
                      ? "Strong trajectory fit: your background maps well."
                      : "Relevant experience detected with room to grow."}
                  </p>
                </div>
              </div>

              {/* why */}
              <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                <span className={`${SPEC} block mb-1.5`}>Why This Score</span>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{whyText}</p>
              </div>

              {/* primary action + secondary link */}
              <div className="mt-6 space-y-3">
                {renderApply("primary")}
                <Link
                  href="/resume"
                  className="block w-full text-center font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 hover:text-[#0051d5] dark:hover:text-[#6690ff] transition-colors"
                >
                  {matchScore == null ? "Upload resume to score this role" : "Improve your match rate"}
                </Link>
              </div>
            </motion.div>

            {/* Interview Prep Card */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="bg-neutral-900 dark:bg-neutral-900 p-6 rounded-2xl text-white cursor-pointer group shadow-premium-lg edge-highlight ring-1 ring-white/[0.06]"
              onClick={() => setShowCoach(true)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <span className={`${SPEC} text-neutral-500`}>AI</span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-1 tracking-tight">Interview Prep</h3>
              <p className="text-sm text-white/50 font-medium leading-relaxed mb-5">
                Role-specific questions with expert tips tailored to this position.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white group-hover:text-white/80 transition-colors">
                Generate Questions
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </div>
            </motion.div>

            {/* Cover Letter Card: surfaces the drafting tool (state already wired) */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.13, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl cursor-pointer group shadow-premium ring-1 ring-neutral-200/70 dark:ring-white/[0.06] border border-neutral-200/70 dark:border-neutral-800"
              onClick={() => setShowCoverLetter(true)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
                </div>
                <span className={SPEC}>AI</span>
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-lg mb-1 tracking-tight">Cover Letter</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed mb-5">
                Draft a tailored cover letter from your resume in seconds.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-900 dark:text-white group-hover:text-[#0051d5] dark:group-hover:text-[#6690ff] transition-colors">
                Draft Letter
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </div>
            </motion.div>

            {/* Company Overview Card */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white dark:bg-neutral-900 p-7 rounded-2xl ring-1 ring-neutral-200/70 dark:ring-white/[0.06] border border-neutral-200/70 dark:border-neutral-800 shadow-premium"
            >
              <span className={`${SPEC} block mb-4`}>Company · Overview</span>
              <h3 className="font-semibold text-lg mb-4 tracking-tight text-neutral-900 dark:text-white">
                About {job.company || "this company"}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                {job.company} is hiring for {formatDept(job.department)} talent.
                This role was posted {timeAgo(job.posted_date)}.
                {job.applicant_count > 0 && (
                  <>
                    {" "}
                    <span className="font-mono tabular-nums text-neutral-900 dark:text-white">{job.applicant_count}</span> candidates have applied.
                  </>
                )}
              </p>
              <div className="space-y-3">
                {job.location && (
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="shrink-0 text-neutral-500 dark:text-neutral-400 font-medium">Location</span>
                    <span className="flex-1 translate-y-[-3px] border-b border-dotted border-neutral-200 dark:border-neutral-700" />
                    <span className="shrink-0 font-semibold text-neutral-900 dark:text-white">{job.location}</span>
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="shrink-0 text-neutral-500 dark:text-neutral-400 font-medium">Salary</span>
                    <span className="flex-1 translate-y-[-3px] border-b border-dotted border-neutral-200 dark:border-neutral-700" />
                    <span className="shrink-0 font-semibold font-mono tabular-nums text-neutral-900 dark:text-white">{job.salary_range}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="shrink-0 text-neutral-500 dark:text-neutral-400 font-medium">Department</span>
                  <span className="flex-1 translate-y-[-3px] border-b border-dotted border-neutral-200 dark:border-neutral-700" />
                  <span className="shrink-0 font-semibold text-neutral-900 dark:text-white">{formatDept(job.department)}</span>
                </div>
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="shrink-0 text-neutral-500 dark:text-neutral-400 font-medium">Level</span>
                  <span className="flex-1 translate-y-[-3px] border-b border-dotted border-neutral-200 dark:border-neutral-700" />
                  <span className="shrink-0 font-semibold text-neutral-900 dark:text-white">{formatSeniority(job.seniority)}</span>
                </div>
              </div>

              {/* Salary percentile detail (collapsible, self-fetching) */}
              {job.salary_range && (
                <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <SalaryInsights jobId={job.id} />
                </div>
              )}

              {job.external_url && (
                <a
                  href={job.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
                  View Original Posting
                </a>
              )}
            </motion.div>

          </aside>
        </div>
      </main>

      {/* ── Quick Apply Sticky Bar (backup) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-200/70 dark:border-neutral-800 z-40">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between gap-4">
          <div className="hidden md:block min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-white truncate">{job.title}</p>
            <p className={`${SPEC} mt-0.5`}>Applying with AI-optimized resume</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <motion.button
              onClick={() => setShowCoach(true)}
              whileTap={{ scale: 0.96 }}
              className="hidden md:flex items-center gap-2 px-5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 font-semibold text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
              Interview Prep
            </motion.button>
            <motion.button
              onClick={handleBookmark}
              disabled={savingBookmark}
              whileTap={{ scale: 0.96 }}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 font-semibold text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {saved ? "Saved" : "Save Job"}
            </motion.button>

            {renderApply("bar")}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">PathAI</div>
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
                className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-neutral-400 dark:text-neutral-500">
            © 2026 PathAI. The Intelligent Curator.
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showCoach && <InterviewCoach job={job} onClose={() => setShowCoach(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCoverLetter && <CoverLetter job={job} onClose={() => setShowCoverLetter(false)} />}
      </AnimatePresence>

      {/* "Did you apply?" confirmation modal */}
      <AnimatePresence>
        {showAppliedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAppliedModal(false)}
            />
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="relative bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-sm w-full shadow-premium-lg edge-highlight ring-1 ring-neutral-200/70 dark:ring-white/[0.06] border border-neutral-200/70 dark:border-neutral-800"
            >
              <div className="w-14 h-14 bg-[#0051d5] rounded-2xl flex items-center justify-center mb-5 mx-auto glow-accent">
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={1.75} />
              </div>
              <span className={`${SPEC} block text-center mb-2`}>Confirm Application</span>
              <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white text-center mb-2">
                Did you apply?
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium text-center leading-relaxed mb-8">
                You were redirected to apply at{" "}
                <span className="text-neutral-900 dark:text-white font-semibold">{job.company}</span>.{" "}
                Did you complete the application?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAppliedModal(false)}
                  className="flex-1 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Not yet
                </button>
                <motion.button
                  onClick={handleConfirmApplied}
                  disabled={applying}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 bg-[#0051d5] text-white rounded-xl text-sm font-semibold hover:bg-[#0040a8] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : "Yes, I applied!"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
