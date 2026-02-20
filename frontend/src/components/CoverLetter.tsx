"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileText, Copy, Check, Upload, RefreshCw, CircleCheck } from "lucide-react";
import { Job, generateCoverLetter, fetchSavedResume, uploadResume, SavedResume } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface CoverLetterProps {
  job: Job;
  onClose: () => void;
}

type Phase = "checking" | "upload" | "generating" | "done" | "error";

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function CoverLetter({ job, onClose }: CoverLetterProps) {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("checking");
  const [savedResume, setSavedResume] = useState<SavedResume | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const token = session?.access_token;

  // On mount: check for saved resume
  useEffect(() => {
    if (!token) { setPhase("upload"); return; }
    fetchSavedResume(token).then((profile) => {
      if (profile) {
        setSavedResume(profile);
        generateLetter(profile.resume_summary);
      } else {
        setPhase("upload");
      }
    });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateLetter = async (resumeSummary: string) => {
    if (!token) return;
    setPhase("generating");
    setError(null);
    try {
      const r = await generateCoverLetter(job.id, resumeSummary, token);
      setLetter(r.cover_letter);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate cover letter");
      setPhase("error");
    }
  };

  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadResume(file, token);
      const summary = result.profile.summary;
      const newResume: SavedResume = { resume_summary: summary, updated_at: new Date().toISOString() };
      setSavedResume(newResume);
      generateLetter(summary);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadFile(file); handleUpload(file); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setUploadFile(file); handleUpload(file); }
  };

  const handleCopy = async () => {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (savedResume) generateLetter(savedResume.resume_summary);
  };

  const handleUpdateResume = () => {
    setPhase("upload");
    setUploadFile(null);
    setUploadError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <FileText className="text-orange-500" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Cover Letter</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[220px]">
                {job.title} · {job.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === "done" && letter && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegenerate}
                  title="Regenerate"
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </motion.button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">

            {/* Checking saved resume */}
            {phase === "checking" && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Checking for saved resume…</p>
              </motion.div>
            )}

            {/* No saved resume — upload prompt */}
            {phase === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {savedResume ? "Update your resume" : "Upload your resume"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {savedResume
                      ? "Your new resume will be saved for all future cover letters."
                      : "Upload once — we\u2019ll save it and use it for all your cover letters."}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <motion.div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  animate={{ borderColor: dragOver ? "#f97316" : "#e5e7eb" }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl px-6 py-10 flex flex-col items-center gap-3 cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uploading {uploadFile?.name}…
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                        <Upload className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Drop your resume here
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          or click to browse · PDF or DOCX
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>

                {uploadError && (
                  <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5">
                    {uploadError}
                  </p>
                )}

                {savedResume && (
                  <button
                    onClick={() => generateLetter(savedResume.resume_summary)}
                    className="w-full text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
                  >
                    ← Keep existing resume
                  </button>
                )}
              </motion.div>
            )}

            {/* Generating */}
            {phase === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Writing your cover letter…</p>
              </motion.div>
            )}

            {/* Done */}
            {phase === "done" && letter && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {savedResume && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700 rounded-lg px-2.5 py-1">
                      <CircleCheck className="w-3 h-3" />
                      Resume used · updated {timeAgo(savedResume.updated_at)}
                    </div>
                    <button
                      onClick={handleUpdateResume}
                      className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
                    >
                      Update resume
                    </button>
                  </div>
                )}
                <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700">
                  {letter}
                </div>
              </motion.div>
            )}

            {/* Error */}
            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {phase === "done" && (
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              AI-generated — review and personalise before sending.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
