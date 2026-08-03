"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  UploadCloud,
  CheckCircle2,
  X,
  Waypoints,
  FileSearch,
  Target,
  ListChecks,
  FileText,
  ScanText,
  BadgeCheck,
} from "lucide-react";
import { uploadResume, ResumeProfile, Job, SkillGap } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";

function formatDomain(domain: string) {
  return domain.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/* Geist Mono spec-label - the shared editorial vocabulary from the landing.
   Every section / step / status label on this page is rendered with it so the
   surface reads as one system. */
const SPEC =
  "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-500 dark:text-neutral-400";

/* ------------------------------------------------------------------
   Parse timeline - a trustworthy multi-step indicator (Reading ->
   Extracting -> Matching) that reflects the real upload progress
   instead of a bare spinner. Mono step labels, one blue rail for the
   active moment, reduced-motion safe.
   ------------------------------------------------------------------ */

const PARSE_STEPS = [
  { icon: FileText, code: "01", label: "Reading", desc: "Parsing your document" },
  { icon: ScanText, code: "02", label: "Extracting", desc: "Skills, seniority, and domain" },
  { icon: Target, code: "03", label: "Matching", desc: "Ranking against open roles" },
];

function ParseTimeline({
  progress,
  active,
  done,
  reduceMotion,
}: {
  progress: number;
  active: boolean;
  done: boolean;
  reduceMotion: boolean | null;
}) {
  // Which step is currently running, derived from the progress thresholds.
  const activeStep = done ? PARSE_STEPS.length : progress < 34 ? 0 : progress < 68 ? 1 : 2;
  const status = done ? "COMPLETE" : active ? "ANALYZING" : "AWAITING";

  return (
    <section className="relative bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-premium-lg edge-highlight border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06]">
      {/* spec-label header */}
      <div className="flex items-center justify-between mb-4">
        <span className={SPEC}>RESUME · PARSE · 3 STEPS</span>
        <span className={SPEC}>{status}</span>
      </div>

      {/* Progress rail - blue is the single active/decisive moment */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0051d5] rounded-full"
            animate={{ width: done ? "100%" : active ? `${progress}%` : "0%" }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-[#0051d5] dark:text-[#6690ff]">
          {done ? "100" : Math.round(active ? progress : 0)}%
        </span>
      </div>

      {/* Steps - mono labels, blue only on the running step */}
      <ol className="space-y-2.5">
        {PARSE_STEPS.map((step, i) => {
          const st =
            done || i < activeStep ? "done" : i === activeStep && active ? "active" : "pending";
          const Icon = step.icon;
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  st === "done"
                    ? "bg-[#0051d5] text-white"
                    : st === "active"
                    ? "bg-[#0051d5]/10 text-[#0051d5] dark:text-[#6690ff] ring-1 ring-[#0051d5]/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {st === "done" ? (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                ) : st === "active" ? (
                  <motion.span
                    className="flex"
                    animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </motion.span>
                ) : (
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                )}
              </span>
              <span
                className={`w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] tabular-nums transition-colors duration-300 ${
                  st === "done"
                    ? "text-neutral-700 dark:text-neutral-200"
                    : st === "active"
                    ? "text-[#0051d5] dark:text-[#6690ff]"
                    : "text-neutral-400 dark:text-neutral-600"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`text-[13px] truncate transition-colors duration-300 ${
                  st === "pending"
                    ? "text-neutral-400 dark:text-neutral-600"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {step.desc}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function ResumePage() {
  const { session } = useAuth();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [skillGaps, setSkillGaps] = useState<Record<string, SkillGap>>({});
  const [showToast, setShowToast] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (
        !file.name.toLowerCase().endsWith(".pdf") &&
        !file.name.toLowerCase().endsWith(".docx")
      ) {
        setError("Please upload a PDF or DOCX file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 89) return 89;
          return Math.min(89, p + Math.random() * 15);
        });
      }, 300);

      try {
        const result = await uploadResume(file, session?.access_token);
        clearInterval(interval);
        setUploadProgress(100);
        setProfile(result.profile);
        setMatchedJobs(result.matched_jobs ?? []);
        setSkillGaps(result.skill_gaps ?? {});
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } catch (e: unknown) {
        clearInterval(interval);
        setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [session]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const openPicker = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const topMatchScore =
    matchedJobs.length > 0 && matchedJobs[0].match_score != null
      ? `${Math.round(matchedJobs[0].match_score)}%`
      : "-";

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header />

      <main className="pt-32 pb-24 px-6 max-w-[1440px] mx-auto min-h-screen">

        {/* Editorial header - centered when no profile, left-aligned after */}
        <header className={`mb-16 transition-all duration-500 ${profile ? "md:w-2/3 lg:w-1/2" : "text-center"}`}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 dark:bg-white mb-6 shadow-lg"
          >
            <Waypoints className="w-3 h-3 text-white/90 dark:text-neutral-900/80" strokeWidth={1.75} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums text-white/90 dark:text-neutral-900/80">
              Intelligent Curator
            </span>
          </motion.div>
          {/* Page title - the one serif moment on this app surface */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-serif font-medium text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight text-neutral-900 dark:text-white mb-6"
          >
            Map your path
            <br />
            <span className="font-serif italic text-neutral-500 dark:text-neutral-400">with precision.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className={`text-neutral-500 dark:text-neutral-400 leading-relaxed ${profile ? "" : "max-w-lg mx-auto"}`}
          >
            Upload your resume and let PathAI decode your expertise. We use deep-learning models
            to match your unique trajectory with elite opportunities.
          </motion.p>
        </header>

        {/* Main workspace */}
        <AnimatePresence mode="wait">
          {!profile ? (
            /* PRE-UPLOAD: centered */
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Upload zone card - flagship depth + hairline ring + edge highlight */}
              <section className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl shadow-premium-lg edge-highlight border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06]">
                {/* Refined 4-state dropzone: default / drag / uploading / error,
                    with an accent focus ring and blue reserved for drag-active. */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={openPicker}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload your resume"
                  aria-busy={isUploading}
                  className={`rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#0051d5] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 ${
                    error
                      ? "border-red-400/70 dark:border-red-500/60 bg-red-50/60 dark:bg-red-900/10"
                      : isDragging
                      ? "border-[#0051d5] bg-[#0051d5]/5 dark:bg-[#0051d5]/10 ring-2 ring-[#0051d5]/20"
                      : isUploading
                      ? "border-[#0051d5]/40 bg-[#0051d5]/[0.03]"
                      : "border-neutral-300 dark:border-neutral-700 ring-1 ring-inset ring-neutral-200/50 dark:ring-white/[0.04] hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="mb-6 flex justify-center">
                    <motion.div
                      animate={!isUploading && !isDragging && !reduceMotion ? { y: [0, -6, 0] } : { y: 0 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 ${
                        isDragging ? "bg-[#0051d5] scale-105" : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      <UploadCloud
                        className={`w-7 h-7 transition-colors ${isDragging ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}
                        strokeWidth={1.75}
                      />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Drop your resume here</h3>
                  <p className={`${SPEC} mb-8`}>PDF or DOCX · up to 10MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); openPicker(); }}
                    disabled={isUploading}
                    className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-premium"
                  >
                    {isUploading ? "Uploading..." : "Browse Files"}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 px-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                      <X className="w-4 h-4 shrink-0" strokeWidth={1.75} />{error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </section>

              {/* Parse timeline */}
              <ParseTimeline
                progress={uploadProgress}
                active={isUploading}
                done={false}
                reduceMotion={reduceMotion}
              />

              {/* Feature row - neutral icons keep the accent reserved */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                {[
                  { icon: FileSearch, title: "AI Profile", desc: "Extracts your skills, seniority, and domain instantly" },
                  { icon: Target, title: "Smart Matching", desc: "Ranked job matches based on your actual experience" },
                  { icon: ListChecks, title: "Gap Analysis", desc: "See exactly what skills to add for each role" },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                    className="text-center"
                  >
                    <motion.div
                      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-11 h-11 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    >
                      <Icon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
                    </motion.div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">{title}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* POST-UPLOAD: results below upload */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-8"
            >
              {/* Compact upload + status row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-7 bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-premium border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06]">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={openPicker}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload a new resume"
                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#0051d5] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 ${
                      isDragging
                        ? "border-[#0051d5] bg-[#0051d5]/5 dark:bg-[#0051d5]/10 ring-2 ring-[#0051d5]/20"
                        : "border-neutral-300 dark:border-neutral-700 ring-1 ring-inset ring-neutral-200/50 dark:ring-white/[0.04] hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isDragging ? "bg-[#0051d5]" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                        <UploadCloud className={`w-5 h-5 ${isDragging ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`} strokeWidth={1.75} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Upload a new resume</p>
                        <p className={SPEC}>PDF or DOCX · up to 10MB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openPicker(); }}
                        className="ml-auto px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shrink-0 shadow-premium"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </section>

                <section className="lg:col-span-5 bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-premium border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-5 h-5 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className={SPEC}>Analysis complete</span>
                        <span className="font-mono text-xs tabular-nums text-[#0051d5] dark:text-[#6690ff]">100%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0051d5] rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Results section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Identity card - full width top, elevated */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  className="lg:col-span-12 bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-premium-lg edge-highlight border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] transition-shadow"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className={`${SPEC} mb-3`}>Initial findings</div>
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-neutral-400 dark:text-neutral-500 shrink-0" strokeWidth={1.75} />
                        <span className="text-xl font-bold text-neutral-900 dark:text-white">
                          {profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1)}{" "}
                          {formatDomain(profile.domain)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">{profile.summary}</p>
                    </div>
                    {/* Single blue verification mark - the one accent on this card */}
                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                      <BadgeCheck className="w-5 h-5 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
                      <span className={SPEC}>Analyzed by PathAI</span>
                    </div>
                  </div>
                </motion.div>

                {/* Market Match - the match, so it carries the accent + signature motion */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4 }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="lg:col-span-3 bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] shadow-premium hover:shadow-premium-lg transition-shadow"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 18 }}
                    className="text-4xl font-semibold font-mono tabular-nums tracking-tight text-[#0051d5] dark:text-[#6690ff] mb-1"
                  >
                    {topMatchScore}
                  </motion.div>
                  {/* Signature motion: a thin blue baseline draws under the match */}
                  <motion.span
                    aria-hidden
                    className="mb-3 block h-px w-8 origin-left bg-[#0051d5] dark:bg-[#6690ff]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 1.1, delay: reduceMotion ? 0 : 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                  <div className={SPEC}>Market Match</div>
                </motion.div>

                {/* Experience - neutral number */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="lg:col-span-3 bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] shadow-premium hover:shadow-premium-lg transition-shadow"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.48, type: "spring", stiffness: 200, damping: 18 }}
                    className="text-4xl font-semibold font-mono tabular-nums tracking-tight text-neutral-900 dark:text-white mb-1"
                  >
                    {profile.years_experience}
                    <span className="text-2xl text-neutral-400 dark:text-neutral-500">yr</span>
                  </motion.div>
                  <div className={SPEC}>Experience</div>
                </motion.div>

                {/* Top Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.4 }}
                  className="lg:col-span-6 bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] shadow-premium"
                >
                  <div className={`${SPEC} mb-4`}>Top skills detected</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 8).map((skill, i) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.055, duration: 0.28 }}
                        whileHover={reduceMotion ? undefined : { y: -2 }}
                        className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-xl transition-colors hover:border-[#0051d5]/40 hover:text-[#0051d5] dark:hover:text-[#6690ff]"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Top matches: ranked roles scored against this profile, rendered
                    with the real JobCard so the full apply/save/summary UI is live. */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="lg:col-span-12"
                >
                  <div className="flex items-end justify-between mb-5 gap-4">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Top matches for your profile</h2>
                      <p className={`${SPEC} mt-1.5`}>Ranked against your skills and trajectory</p>
                    </div>
                    {matchedJobs.length > 0 && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#0051d5]/10 border border-[#0051d5]/15 px-3 py-1.5 text-[0.7rem] font-semibold text-[#0051d5] dark:text-[#6690ff]">
                        <span className="font-mono tabular-nums">{matchedJobs.length}</span>
                        role{matchedJobs.length === 1 ? "" : "s"} ranked
                      </span>
                    )}
                  </div>
                  {matchedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {matchedJobs.map((job, i) => (
                        <JobCard key={job.id} job={job} index={i} skillGap={skillGaps[job.id]} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/70 dark:border-neutral-800 ring-1 ring-neutral-200/60 dark:ring-white/[0.06] shadow-premium flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.75} />
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Ranked matches appear here as roles are scored against your profile.
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-4 rounded-full shadow-premium-lg z-[60] whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#6690ff] dark:text-[#0051d5]" strokeWidth={1.75} />
            <span className="font-semibold text-sm">
              Resume curated successfully. Your profile is live.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-neutral-50 dark:bg-neutral-950 w-full border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-tighter">PathAI</div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-neutral-400 dark:text-neutral-500">
            © 2026 PathAI. The Intelligent Curator.
          </div>
        </div>
      </footer>
    </div>
  );
}
