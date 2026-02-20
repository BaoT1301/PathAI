"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, Clock, CheckCircle2,
  XCircle, ChevronRight, Trash2, Building2, MapPin,
  StickyNote, Loader2, Bookmark, DollarSign,
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
  { key: "applied",      label: "Applied",       icon: Briefcase,    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
  { key: "phone_screen", label: "Phone Screen",  icon: Clock,        color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" },
  { key: "interview",    label: "Interview",     icon: ChevronRight, color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700" },
  { key: "offer",        label: "Offer",         icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
  { key: "hired",        label: "Hired",         icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700" },
  { key: "rejected",     label: "Rejected",      icon: XCircle,      color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" },
] as const;

type StageKey = typeof STAGES[number]["key"];
const STAGE_ORDER: StageKey[] = ["applied", "phone_screen", "interview", "offer", "hired", "rejected"];

function StatusBadge({ status }: { status: string }) {
  const stage = STAGES.find((s) => s.key === status) ?? STAGES[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${stage.color}`}>
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
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{app.job.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {app.job.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {app.job.location}
            </span>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 gap-2 flex-wrap">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-400 bg-white dark:bg-gray-800"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGES.find((st) => st.key === s)?.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Notes
          </button>
          <button onClick={() => onDelete(app.id)} className="text-red-400 hover:text-red-600 transition-colors">
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
            className="mt-3 overflow-hidden"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={3}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl p-3 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleNotesSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
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
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${saved.job.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-orange-500 transition-colors">
              {saved.job.title}
            </h3>
          </Link>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {saved.job.company || saved.job.department || "Company"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {saved.job.location}
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
              <DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              {saved.job.salary_range}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(saved.job.id)}
          title="Remove bookmark"
          className="text-orange-400 hover:text-red-500 transition-colors shrink-0"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Saved {new Date(saved.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <Link
          href={`/jobs/${saved.job.id}`}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
        >
          View job →
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
      // API unreachable — show empty state rather than crashing
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-orange-500" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Dashboard</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track applications and saved jobs.</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Applied", value: applications.length, color: "text-gray-900 dark:text-white" },
            { label: "In Progress", value: applications.filter((a) => ["phone_screen", "interview"].includes(a.status)).length, color: "text-violet-600 dark:text-violet-400" },
            { label: "Offers", value: applications.filter((a) => ["offer", "hired"].includes(a.status)).length, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Saved Jobs", value: savedJobs.length, color: "text-orange-500 dark:text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "applications" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Applications
            {applications.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "applications" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"}`}>
                {applications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "saved" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved Jobs
            {savedJobs.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "saved" ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"}`}>
                {savedJobs.length}
              </span>
            )}
          </button>
        </div>

        {/* Applications tab */}
        {activeTab === "applications" && (
          <>
            <div className="flex gap-2 flex-wrap mb-6">
              {[{ key: "all", label: "All" }, ...STAGES].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveFilter(s.key as StageKey | "all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeFilter === s.key
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {fetching ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No applications yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Browse jobs and hit <span className="font-semibold text-gray-600 dark:text-gray-300">Quick Apply</span> to get started.
                </p>
                <Link href="/jobs" className="inline-block mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                  Browse Jobs
                </Link>
              </motion.div>
            ) : (
              <motion.div layout className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filtered.map((app) => (
                    <ApplicationCard key={app.id} app={app} onStatusChange={handleStatusChange} onDelete={handleDelete} />
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
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : savedJobs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No saved jobs yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Click the <span className="font-semibold text-gray-600 dark:text-gray-300">bookmark icon</span> on any job card to save it here.
                </p>
                <Link href="/jobs" className="inline-block mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                  Browse Jobs
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
