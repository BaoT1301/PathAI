"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, X, Zap, Sparkles } from "lucide-react";
import { uploadResume, ResumeProfile, Job } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";

function formatDomain(domain: string) {
  return domain.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default function ResumePage() {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
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

  const topMatchScore =
    matchedJobs.length > 0 && matchedJobs[0].match_score != null
      ? `${Math.round(matchedJobs[0].match_score)}%`
      : "—";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <Header />

      <main className="pt-32 pb-24 px-6 max-w-[1440px] mx-auto min-h-screen">

        {/* ── Editorial Header — centered when no profile, left-aligned after ── */}
        <header className={`mb-16 transition-all duration-500 ${profile ? "md:w-2/3 lg:w-1/2" : "text-center"}`}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#316bf3] text-white rounded-full mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[0.65rem] uppercase tracking-[0.1em] font-bold">Intelligent Curator</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-[3.5rem] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-6"
          >
            Map your path <br />with precision.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className={`text-[#45474b] leading-relaxed ${profile ? "" : "max-w-lg mx-auto"}`}
          >
            Upload your resume and let PathAI decode your expertise. We use deep-learning models
            to match your unique trajectory with elite opportunities.
          </motion.p>
        </header>

        {/* ── Main Workspace ── */}
        <AnimatePresence mode="wait">
          {!profile ? (
            /* ── PRE-UPLOAD: centered ── */
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Upload Zone Card */}
              <section className="bg-white p-8 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-[#c6c6cb]/10">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer group ${
                    isDragging ? "border-[#0051d5] bg-[#0051d5]/5" : "border-[#c6c6cb] hover:bg-[#f3f4f5]"
                  }`}
                >
                  <div className="mb-6 flex justify-center">
                    <motion.div
                      animate={!isUploading && !isDragging ? { y: [0, -6, 0] } : { y: 0 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${isDragging ? "bg-[#0051d5] scale-110" : "bg-[#edeeef]"}`}
                    >
                      <Upload className={`w-7 h-7 transition-colors ${isDragging ? "text-white" : "text-[#45474b]"}`} />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Drop your resume here</h3>
                  <p className="text-[#45474b] mb-8 text-sm">PDF, DOCX, or TXT formats supported (Max 10MB)</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    disabled={isUploading}
                    className="px-8 py-3 bg-black text-white rounded-full font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Uploading…" : "Browse Files"}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 flex items-center gap-2 text-sm text-red-600 font-medium">
                      <X className="w-4 h-4 shrink-0" />{error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </section>

              {/* Processing State Card */}
              <section className="bg-white p-6 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)] border border-[#c6c6cb]/10">
                <div className="flex items-center gap-6">
                  <Sparkles className={`w-6 h-6 shrink-0 transition-colors ${isUploading ? "text-[#0051d5] animate-pulse" : "text-[#c6c6cb]"}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold tracking-tight uppercase">
                        {isUploading ? "Analyzing expertise..." : "Awaiting upload..."}
                      </span>
                      <span className="text-xs font-mono text-[#0051d5]">
                        {isUploading ? `${Math.round(uploadProgress)}%` : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#0051d5] rounded-full"
                        animate={{ width: isUploading ? `${uploadProgress}%` : "0%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Feature row */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                {[
                  { icon: Zap, title: "AI Profile", desc: "Extracts your skills, seniority, and domain instantly" },
                  { icon: Sparkles, title: "Smart Matching", desc: "Ranked job matches based on your actual experience" },
                  { icon: CheckCircle2, title: "Gap Analysis", desc: "See exactly what skills to add for each role" },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                    className="text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-10 h-10 bg-[#0051d5]/10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    >
                      <Icon className="w-5 h-5 text-[#0051d5]" />
                    </motion.div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">{title}</p>
                    <p className="text-xs text-[#45474b] leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── POST-UPLOAD: results below upload ── */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-8"
            >
              {/* Compact upload + progress bar row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-7 bg-white p-6 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-[#c6c6cb]/10">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                      isDragging ? "border-[#0051d5] bg-[#0051d5]/5" : "border-[#c6c6cb] hover:bg-[#f3f4f5]"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isDragging ? "bg-[#0051d5]" : "bg-[#edeeef]"}`}>
                        <Upload className={`w-5 h-5 ${isDragging ? "text-white" : "text-[#45474b]"}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">Upload a new resume</p>
                        <p className="text-xs text-[#45474b]">PDF, DOCX, or TXT · Max 10MB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="ml-auto px-5 py-2 bg-black text-white rounded-full text-xs font-bold hover:opacity-90 active:scale-95 transition-all shrink-0"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </section>

                <section className="lg:col-span-5 bg-white p-6 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)] border border-[#c6c6cb]/10 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <Sparkles className="w-6 h-6 text-[#0051d5] shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold tracking-tight uppercase">Analysis complete</span>
                        <span className="text-xs font-mono text-[#0051d5]">100%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#edeeef] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0051d5] rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Results Section ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Identity card — full width top */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="lg:col-span-12 bg-white p-8 rounded-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)] border border-[#c6c6cb]/10"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="text-[0.75rem] text-[#45474b] uppercase tracking-[0.05em] font-bold mb-3">
                        Initial Findings
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-[#0051d5] shrink-0" />
                        <span className="text-xl font-bold">
                          {profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1)}{" "}
                          {formatDomain(profile.domain)}
                        </span>
                      </div>
                      <p className="text-sm text-[#45474b] leading-relaxed max-w-2xl">{profile.summary}</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-[#45474b] shrink-0 mt-1" />
                  </div>
                </motion.div>

                {/* Market Match */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4 }}
                  className="lg:col-span-3 bg-[#f3f4f5] p-8 rounded-xl"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 18 }}
                    className="text-4xl font-black mb-1"
                  >
                    {topMatchScore}
                  </motion.div>
                  <div className="text-[0.65rem] uppercase font-bold text-[#45474b]">Market Match</div>
                </motion.div>

                {/* Experience */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="lg:col-span-3 bg-[#f3f4f5] p-8 rounded-xl"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.48, type: "spring", stiffness: 200, damping: 18 }}
                    className="text-4xl font-black mb-1"
                  >
                    {profile.years_experience}yr
                  </motion.div>
                  <div className="text-[0.65rem] uppercase font-bold text-[#45474b]">Experience</div>
                </motion.div>

                {/* Top Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.4 }}
                  className="lg:col-span-6 bg-[#f3f4f5] p-8 rounded-xl"
                >
                  <div className="text-[0.65rem] uppercase font-bold text-[#45474b] mb-4">Top Skills Detected</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 8).map((skill, i) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.055, duration: 0.28 }}
                        className="px-3 py-1.5 bg-[#e1e3e4] text-xs font-semibold rounded-lg"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Abstract Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="lg:col-span-12 relative h-48 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-900 to-neutral-950" />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute inset-0 flex items-center justify-center gap-8"
                  >
                    <span className="text-white font-bold tracking-widest text-sm uppercase">
                      Verification Grade A+
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Success Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black text-white px-8 py-4 rounded-full shadow-2xl z-[60] whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">
              Resume curated successfully. Your profile is live.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="bg-neutral-50 w-full border-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 max-w-[1440px] mx-auto gap-8">
          <div className="text-lg font-black text-neutral-950 uppercase tracking-tighter">PathAI</div>
          <div className="flex flex-wrap justify-center gap-8 text-xs uppercase tracking-[0.1em] font-semibold">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-neutral-400 hover:text-neutral-950 transition-colors opacity-70 hover:opacity-100 duration-300"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-neutral-400 text-xs uppercase tracking-[0.1em] font-semibold">
            © 2026 PathAI. The Intelligent Curator.
          </div>
        </div>
      </footer>
    </div>
  );
}
