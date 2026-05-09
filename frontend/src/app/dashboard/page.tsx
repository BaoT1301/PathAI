"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Clock, CheckCircle2, XCircle, ChevronRight,
  Trash2, Building2, MapPin, StickyNote, Loader2, Bookmark,
  DollarSign, ArrowRight, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import {
  fetchApplications, updateApplication, deleteApplication, Application,
  fetchSavedJobs, unsaveJob, SavedJob,
} from "@/lib/api";

const STAGES = [
  { key: "applied",      label: "Applied",       icon: Briefcase    },
  { key: "phone_screen", label: "Phone Screen",  icon: Clock        },
  { key: "interview",    label: "Interview",     icon: ChevronRight },
  { key: "offer",        label: "Offer",         icon: CheckCircle2 },
  { key: "hired",        label: "Hired",         icon: CheckCircle2 },
  { key: "rejected",     label: "Rejected",      icon: XCircle      },
] as const;

type StageKey = typeof STAGES[number]["key"];
const STAGE_ORDER: StageKey[] = ["applied", "phone_screen", "interview", "offer", "hired", "rejected"];

const STAGE_COLORS: Record<string, string> = {
  applied:      "bg-neutral-100 text-neutral-700 border-neutral-200",
  phone_screen: "bg-[#0051d5]/10 text-[#0051d5] border-[#0051d5]/20",
  interview:    "bg-violet-50 text-violet-700 border-violet-200",
  offer:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  hired:        "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected:     "bg-red-50 text-red-600 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const stage = STAGES.find((s) => s.key === status) ?? STAGES[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wide ${STAGE_COLORS[status] ?? STAGE_COLORS.applied}`}>
      {stage.label}
    </span>
  );
}

function ApplicationCard({
  app, onStatusChange, onDelete,
}: {
  app: Application;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { session } = useAuth();

  const handleNotesSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      await updateApplication(app.id, { notes }, session.access_token);
      setShowNotes(false);
    } catch {
      // silently fail — notes remain in textarea for retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
      className="bg-white border border-neutral-200 rounded-2xl p-6 transition-shadow cursor-default"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${app.job?.id}`}>
            <h3 className="font-black text-black text-base leading-tight truncate hover:text-[#0051d5] transition-colors">
              {app.job?.title ?? "Untitled Role"}
            </h3>
          </Link>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {app.job?.department ?? "—"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {app.job?.location ?? "—"}
            </span>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 gap-2 flex-wrap">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          className="text-xs border border-neutral-200 rounded-xl px-3 py-2 text-neutral-700 focus:outline-none focus:border-[#0051d5] bg-white font-semibold transition-colors"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGES.find((st) => st.key === s)?.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-800 transition-colors font-semibold"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Notes
          </button>
          <button onClick={() => onDelete(app.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={3}
              className="w-full text-sm border border-neutral-200 rounded-xl p-3 resize-none focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-colors bg-white text-black placeholder:text-neutral-300"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleNotesSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-neutral-400 font-medium mt-3 uppercase tracking-wide">
        Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </motion.div>
  );
}

function SavedJobCard({ saved, onRemove }: { saved: SavedJob; onRemove: (jobId: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, borderColor: "#0051d5", boxShadow: "0 12px 40px rgba(0,81,213,0.08)" }}
      className="bg-white border border-neutral-200 rounded-2xl p-6 transition-all cursor-default"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${saved.job?.id}`}>
            <h3 className="font-black text-black text-base leading-tight truncate hover:text-[#0051d5] transition-colors">
              {saved.job?.title ?? "Untitled Role"}
            </h3>
          </Link>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {saved.job?.company || saved.job?.department || "—"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {saved.job?.location ?? "—"}
            </span>
            {saved.job?.salary_range && (
              <span className="flex items-center gap-1 font-bold text-neutral-700">
                <DollarSign className="w-3 h-3 text-neutral-400" />
                {saved.job.salary_range}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(saved.job?.id)}
          title="Remove bookmark"
          className="text-[#0051d5] hover:text-red-500 transition-colors shrink-0"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
        <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
          Saved {new Date(saved.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <Link
          href={`/jobs/${saved.job.id}`}
          className="flex items-center gap-1 text-xs font-black text-neutral-400 hover:text-[#0051d5] transition-colors uppercase tracking-wide"
        >
          View Job <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"applications" | "saved">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StageKey | "all">("all");

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!session?.access_token) return;
    Promise.all([
      fetchApplications(session.access_token),
      fetchSavedJobs(session.access_token),
    ]).then(([apps, saved]) => {
      setApplications(apps);
      setSavedJobs(saved);
    }).catch(() => {
      // API unreachable — show empty state
    }).finally(() => setFetching(false));
  }, [session]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!session?.access_token) return;
    try {
      const updated = await updateApplication(id, { status }, session.access_token);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      // revert: keep current state
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await deleteApplication(id, session.access_token);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // keep the item in list on failure
    }
  };

  const handleRemoveSaved = async (jobId: string) => {
    if (!session?.access_token) return;
    try {
      await unsaveJob(jobId, session.access_token);
      setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId));
    } catch {
      // keep the item in list on failure
    }
  };

  const filtered = activeFilter === "all"
    ? applications
    : applications.filter((a) => a.status === activeFilter);

  const inProgress = applications.filter((a) => ["phone_screen", "interview"].includes(a.status)).length;
  const offers = applications.filter((a) => ["offer", "hired"].includes(a.status)).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── Hero header ── */}
      <section className="relative pt-32 pb-16 px-8 border-b border-neutral-100 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-3">
              Career Tracker
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-black leading-[0.9] mb-4">
              MY DASHBOARD
            </h1>
            <p className="text-neutral-400 font-medium text-sm">
              {user.email}
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10"
          >
            {[
              { label: "Total Applied",  value: applications.length, accent: false },
              { label: "In Progress",    value: inProgress,           accent: true  },
              { label: "Offers",         value: offers,               accent: false },
              { label: "Saved Jobs",     value: savedJobs.length,     accent: false },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`rounded-2xl p-5 border ${stat.accent ? "bg-[#0051d5] border-[#0051d5]" : "bg-white border-neutral-200"}`}
              >
                <div className={`text-4xl font-black tracking-tight mb-1 ${stat.accent ? "text-white" : "text-black"}`}>
                  {stat.value}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${stat.accent ? "text-white/70" : "text-neutral-400"}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pipeline bar */}
          {applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center gap-2 overflow-x-auto pb-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              {["applied", "phone_screen", "interview", "offer", "hired"].map((stage, i, arr) => {
                const count = applications.filter((a) => a.status === stage).length;
                return (
                  <div key={stage} className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className={`text-xs font-black ${count > 0 ? "text-black" : "text-neutral-300"}`}>
                        {count}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                        {STAGES.find((s) => s.key === stage)?.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-neutral-200 shrink-0" />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-8 pt-10 pb-20">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-2xl mb-8 max-w-xs">
          {([
            { key: "applications", label: "Applications", count: applications.length },
            { key: "saved",        label: "Saved Jobs",   count: savedJobs.length    },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wide ${
                activeTab === t.key
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === t.key ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications tab */}
        {activeTab === "applications" && (
          <>
            {/* Stage filters */}
            <div className="flex gap-2 flex-wrap mb-8">
              {[{ key: "all", label: "All" }, ...STAGES].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveFilter(s.key as StageKey | "all")}
                  className={`px-4 py-2 rounded-full text-[10px] font-black transition-all uppercase tracking-wide ${
                    activeFilter === s.key
                      ? "bg-black text-white"
                      : "bg-white border border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {fetching ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-black mb-2">No applications yet</h3>
                <p className="text-neutral-400 text-sm font-medium mb-6">
                  Browse jobs and hit <span className="font-black text-black">Quick Apply</span> to get started.
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-colors uppercase tracking-wide"
                >
                  Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ) : (
              <motion.div layout className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filtered.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        {/* Saved Jobs tab */}
        {activeTab === "saved" && (
          <>
            {fetching ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
              </div>
            ) : savedJobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-black mb-2">No saved jobs yet</h3>
                <p className="text-neutral-400 text-sm font-medium mb-6">
                  Click the <span className="font-black text-black">bookmark icon</span> on any job to save it here.
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-colors uppercase tracking-wide"
                >
                  Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ) : (
              <motion.div layout className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {savedJobs.map((s) => (
                    <SavedJobCard key={s.id} saved={s} onRemove={handleRemoveSaved} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
