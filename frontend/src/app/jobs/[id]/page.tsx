"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  MapPin, DollarSign, Building2, ChevronLeft,
  Loader2, CheckCircle2, Zap, Clock,
  Bookmark, BookmarkCheck, Share2, ExternalLink,
} from "lucide-react";
import { Job, fetchJob, applyToJob, getApplicationStatus, saveJob, unsaveJob, getSavedJobStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import InterviewCoach from "@/components/InterviewCoach";
import CoverLetter from "@/components/CoverLetter";
import Header from "@/components/Header";
import Link from "next/link";

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

const SIMILAR_JOBS = [
  { initial: "V", title: "Product Designer", company: "Vercel", salary: "$160k+" },
  { initial: "R", title: "Staff Designer", company: "Ramp", salary: "$200k+" },
];

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
    getSavedJobStatus(id, session.access_token).then((s) => {
      setSaved(s.saved);
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
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#0051d5]" />
            <p className="text-sm text-[#45474b]">Loading job…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isApplied = appStatus !== null;
  const companyInitial = job.company?.[0]?.toUpperCase() ?? "?";
  const matchScore = job.match_score != null ? Math.round(job.match_score) : null;
  const matchLabel =
    matchScore == null ? "Upload Resume"
    : matchScore >= 80 ? "Strong Match"
    : matchScore >= 60 ? "Good Match"
    : "Partial Match";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      <Header />

      <main className="pt-24 pb-32 px-6 md:px-12 max-w-[1440px] mx-auto">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#45474b] hover:text-black transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Search
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Main Content (8 cols) ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* Job Header Card */}
            <section className="bg-white p-8 md:p-10 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-xl bg-[#edeeef] flex items-center justify-center shrink-0 text-xl font-bold text-[#45474b]">
                    {companyInitial}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-black mb-2">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[#45474b] font-medium">
                      {job.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-5 h-5" />
                          {job.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-5 h-5" />
                        {job.location}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-5 h-5" />
                          {job.salary_range}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bookmark + Share */}
                <div className="flex items-center gap-3 shrink-0">
                  <motion.button
                    onClick={handleBookmark}
                    disabled={savingBookmark}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={justSaved ? { scale: [1, 1.15, 0.95, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="p-3 rounded-full hover:bg-[#edeeef] transition-colors"
                  >
                    {saved
                      ? <BookmarkCheck className="w-5 h-5 text-[#0051d5]" />
                      : <Bookmark className="w-5 h-5 text-[#45474b]" />
                    }
                  </motion.button>
                  <button className="p-3 rounded-full hover:bg-[#edeeef] transition-colors">
                    <Share2 className="w-5 h-5 text-[#45474b]" />
                  </button>
                </div>
              </div>

              {/* Tag pills */}
              <div className="mt-8 pt-8 border-t border-[#c6c6cb]/20 flex flex-wrap gap-3">
                <span className="px-4 py-1.5 bg-[#f3f4f5] text-[#45474b] text-xs font-bold uppercase tracking-wider rounded-full">
                  Full-time
                </span>
                <span className="px-4 py-1.5 bg-[#f3f4f5] text-[#45474b] text-xs font-bold uppercase tracking-wider rounded-full">
                  {formatDept(job.department)}
                </span>
                <span className="px-4 py-1.5 bg-[#f3f4f5] text-[#45474b] text-xs font-bold uppercase tracking-wider rounded-full">
                  {formatSeniority(job.seniority)}
                </span>
                {matchScore != null && (
                  <span className="px-4 py-1.5 bg-[#0051d5]/10 text-[#0051d5] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {matchScore}% Match
                  </span>
                )}
              </div>
            </section>

            {/* Job Description */}
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-black mb-6">About the Role</h2>
                <div
                  className="text-[#45474b] leading-relaxed space-y-6 text-lg
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
                    [&_li]:text-[#45474b]
                    [&_p]:mb-4 [&_p]:leading-relaxed
                    [&_strong]:font-semibold [&_strong]:text-black
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-8 [&_h2]:mb-4
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-black [&_h3]:mt-6 [&_h3]:mb-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                />
                {job.external_url && (
                  <a
                    href={job.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#c6c6cb] text-sm font-semibold text-[#45474b] hover:border-[#0051d5] hover:text-[#0051d5] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read full description
                  </a>
                )}
              </div>
            </section>
          </div>

          {/* ── Right Sidebar (4 cols, sticky) ── */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">

            {/* AI Match Analysis Widget */}
            <div
              className="p-8 rounded-xl text-white shadow-lg overflow-hidden relative"
              style={{ background: "linear-gradient(15deg, #0051d5 0%, #316bf3 100%)" }}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">AI Match Analysis</h3>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase">
                    Verified
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tighter">
                    {matchScore != null ? `${matchScore}%` : "—"}
                  </span>
                  <span className="text-white/80 font-medium">{matchLabel}</span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-white/10 rounded-xl">
                    <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Skill Alignment
                    </p>
                    <p className="text-xs text-white/70">
                      Your expertise matches the required skills for this role.
                    </p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl">
                    <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Career Path
                    </p>
                    <p className="text-xs text-white/70">
                      Your background aligns with this company's vertical.
                    </p>
                  </div>
                </div>
                <Link
                  href="/resume"
                  className="block w-full bg-white text-[#0051d5] py-3 rounded-xl font-bold text-sm text-center hover:bg-[#dbe1ff] transition-colors"
                >
                  Improve Match Rate
                </Link>
              </div>
            </div>

            {/* Company Overview Card */}
            <div className="bg-[#f3f4f5] p-8 rounded-xl border border-[#c6c6cb]/10">
              <h3 className="font-bold text-lg mb-6">
                About {job.company || "this company"}
              </h3>
              <p className="text-[#45474b] text-sm leading-relaxed mb-6">
                {job.company} is hiring for {formatDept(job.department)} talent.
                This role was posted {timeAgo(job.posted_date)}.
                {job.applicant_count > 0 && ` ${job.applicant_count} candidates have applied.`}
              </p>
              <div className="space-y-4">
                {job.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#45474b] font-medium">Location</span>
                    <span className="font-semibold text-[#191c1d]">{job.location}</span>
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#45474b] font-medium">Salary</span>
                    <span className="font-semibold text-[#191c1d]">{job.salary_range}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#45474b] font-medium">Department</span>
                  <span className="font-semibold text-[#191c1d]">{formatDept(job.department)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#45474b] font-medium">Level</span>
                  <span className="font-semibold text-[#191c1d]">{formatSeniority(job.seniority)}</span>
                </div>
              </div>
              {job.external_url && (
                <a
                  href={job.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-8 py-3 rounded-xl border border-[#c6c6cb] text-sm font-bold text-[#45474b] hover:bg-[#edeeef] transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original Posting
                </a>
              )}
            </div>

            {/* Similar Opportunities */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg px-2">Similar Opportunities</h3>
              <div className="space-y-3">
                {SIMILAR_JOBS.map((sj) => (
                  <div
                    key={sj.title + sj.company}
                    className="p-4 bg-white hover:bg-[#f3f4f5] rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-600 shrink-0">
                        {sj.initial}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold group-hover:text-[#0051d5] transition-colors">
                          {sj.title}
                        </h4>
                        <p className="text-[10px] text-[#45474b] uppercase tracking-widest font-bold">
                          {sj.company} • {sj.salary}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Quick Apply Sticky Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#c6c6cb]/10 z-40">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="hidden md:block">
            <p className="font-bold text-black">{job.title}</p>
            <p className="text-xs text-[#45474b] font-medium uppercase tracking-widest">
              Applying with AI-Optimized Resume
            </p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <motion.button
              onClick={handleBookmark}
              disabled={savingBookmark}
              whileTap={{ scale: 0.96 }}
              className="flex-1 md:flex-none px-8 py-3 rounded-xl border border-[#76777b] font-bold text-sm hover:bg-[#edeeef] transition-colors"
            >
              {saved ? "Saved ✓" : "Save Job"}
            </motion.button>

            {user ? (
              job.source === "adzuna" && job.external_url ? (
                <a
                  href={job.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-10 py-3 rounded-xl bg-black text-white font-bold text-sm text-center hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  Apply Now
                </a>
              ) : isApplied ? (
                <div className="flex-1 md:flex-none px-10 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Applied
                </div>
              ) : (
                <motion.button
                  onClick={handleApply}
                  disabled={applying}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 md:flex-none px-10 py-3 rounded-xl bg-black text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-60"
                >
                  {applying
                    ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : "Quick Apply"
                  }
                </motion.button>
              )
            ) : (
              <Link
                href="/auth"
                className="flex-1 md:flex-none px-10 py-3 rounded-xl bg-black text-white font-bold text-sm text-center hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                Sign in to Apply
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-50 border-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="text-lg font-black text-neutral-950">PathAI</div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400 hover:text-neutral-950 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-400">
            © 2024 PathAI. The Intelligent Curator.
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showCoach && <InterviewCoach job={job} onClose={() => setShowCoach(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCoverLetter && <CoverLetter job={job} onClose={() => setShowCoverLetter(false)} />}
      </AnimatePresence>
    </div>
  );
}
