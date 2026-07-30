"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  Briefcase, Clock, CheckCircle2, XCircle, ChevronRight,
  Trash2, Building2, MapPin, StickyNote, Loader2, Bookmark,
  DollarSign, ArrowRight, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import CompanyLogo from "@/components/CompanyLogo";
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

// Stage colors are functional (status semantics), kept restrained. The single
// brand accent (#0051d5, and #6690ff on dark) drives everything decorative.
const STAGE_COLORS: Record<string, string> = {
  applied:      "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
  phone_screen: "bg-[#0051d5]/10 text-[#0051d5] border-[#0051d5]/20 dark:bg-[#0051d5]/15 dark:text-[#6690ff] dark:border-[#0051d5]/30",
  interview:    "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/25",
  offer:        "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  hired:        "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/35",
  rejected:     "bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* ------------------------------------------------------------------
   CountUp: animates a number into view. Reduced-motion safe (snaps
   to final value). Re-animates when `to` changes, so counters sweep
   up once the applications/saved data resolves.
   ------------------------------------------------------------------ */
function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion || to === 0) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduceMotion]);

  return <span ref={ref}>{Math.round(value)}</span>;
}

/* Content-shaped skeleton so the loading state mirrors the real card. */
function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-premium">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3.5 w-2/3 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse shrink-0" />
      </div>
      <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="h-8 w-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-4 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/* Composed empty state, accent-tinted tile instead of a flat black square. */
function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative overflow-hidden text-center py-20 px-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-premium"
    >
      <div className="spotlight pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-70" />
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[#0051d5]/10 dark:bg-[#0051d5]/15 border border-[#0051d5]/15 dark:border-[#0051d5]/25 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-7 h-7 text-[#0051d5] dark:text-[#6690ff]" strokeWidth={1.75} />
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-7 max-w-sm mx-auto leading-relaxed">
          {children}
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors uppercase tracking-widest"
        >
          Browse Jobs <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const stage = STAGES.find((s) => s.key === status) ?? STAGES[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${STAGE_COLORS[status] ?? STAGE_COLORS.applied}`}>
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
  const reduceMotion = useReducedMotion();

  const handleNotesSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      await updateApplication(app.id, { notes }, session.access_token);
      setShowNotes(false);
    } catch {
      // silently fail, notes remain in the textarea for retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="group relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-premium hover:shadow-premium-lg transition-shadow duration-300 cursor-default"
    >
      <div className="spotlight pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <CompanyLogo
            company={app.job?.company ?? app.job?.title ?? null}
            className="w-11 h-11 rounded-xl shadow-premium text-sm"
          />
          <div className="min-w-0">
            <Link href={`/jobs/${app.job?.id}`}>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-[15px] tracking-tight leading-tight truncate hover:text-[#0051d5] dark:hover:text-[#6690ff] transition-colors">
                {app.job?.title ?? "Untitled Role"}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" strokeWidth={1.75} />
                {app.job?.company ?? app.job?.department ?? "Not listed"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                {app.job?.location ?? "Not listed"}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="relative flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 gap-2 flex-wrap">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-[#0051d5] bg-white dark:bg-neutral-800 font-medium transition-colors"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGES.find((st) => st.key === s)?.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors font-medium"
          >
            <StickyNote className="w-3.5 h-3.5" strokeWidth={1.75} />
            Notes
          </button>
          <button
            onClick={() => onDelete(app.id)}
            className="text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mt-4 overflow-hidden"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={3}
              className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 resize-none focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-colors bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleNotesSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="relative text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-3 uppercase tracking-wide">
        Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </motion.div>
  );
}

function SavedJobCard({ saved, onRemove }: { saved: SavedJob; onRemove: (jobId: string) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="group relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-premium hover:shadow-premium-lg hover:border-[#0051d5]/30 dark:hover:border-[#0051d5]/40 transition-[box-shadow,border-color] duration-300 cursor-default"
    >
      <div className="spotlight pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <CompanyLogo
            company={saved.job?.company ?? saved.job?.title ?? null}
            className="w-11 h-11 rounded-xl shadow-premium text-sm"
          />
          <div className="min-w-0">
            <Link href={`/jobs/${saved.job?.id}`}>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-[15px] tracking-tight leading-tight truncate hover:text-[#0051d5] dark:hover:text-[#6690ff] transition-colors">
                {saved.job?.title ?? "Untitled Role"}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" strokeWidth={1.75} />
                {saved.job?.company || saved.job?.department || "Not listed"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                {saved.job?.location ?? "Not listed"}
              </span>
              {saved.job?.salary_range && (
                <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-200">
                  <DollarSign className="w-3 h-3 text-neutral-400 dark:text-neutral-500" strokeWidth={1.75} />
                  {saved.job.salary_range}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(saved.job?.id)}
          title="Remove bookmark"
          className="text-[#0051d5] dark:text-[#6690ff] hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
        >
          <Bookmark className="w-4 h-4 fill-current" strokeWidth={1.75} />
        </button>
      </div>

      <div className="relative mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wide">
          Saved {new Date(saved.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <Link
          href={`/jobs/${saved.job.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 dark:text-neutral-500 hover:text-[#0051d5] dark:hover:text-[#6690ff] transition-colors uppercase tracking-wide"
        >
          View Job <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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
      // API unreachable, show empty state
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-300 dark:text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Header />

      {/* Hero header */}
      <section className="relative pt-32 pb-16 px-8 border-b border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.04] dark:opacity-[0.05] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500 mb-3">
              Career Tracker
            </p>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              My Dashboard
            </h1>
            <p className="text-neutral-400 dark:text-neutral-500 font-medium text-sm">
              {user.email}
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: EASE }}
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
                transition={{ delay: 0.15 + i * 0.05, duration: 0.45, ease: EASE }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className={`group relative overflow-hidden rounded-2xl p-5 border shadow-premium transition-shadow duration-300 hover:shadow-premium-lg ${
                  stat.accent
                    ? "bg-[#0051d5] border-[#0051d5]"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {!stat.accent && (
                  <div className="spotlight pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                <div className={`relative text-4xl font-semibold font-mono tabular-nums tracking-tight mb-1 ${
                  stat.accent ? "text-white" : "text-neutral-900 dark:text-white"
                }`}>
                  <CountUp to={stat.value} />
                </div>
                <div className={`relative text-[10px] font-semibold uppercase tracking-widest ${
                  stat.accent ? "text-white/70" : "text-neutral-400 dark:text-neutral-500"
                }`}>
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
              <TrendingUp className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" strokeWidth={1.75} />
              {["applied", "phone_screen", "interview", "offer", "hired"].map((stage, i, arr) => {
                const count = applications.filter((a) => a.status === stage).length;
                return (
                  <div key={stage} className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className={`text-xs font-semibold font-mono tabular-nums ${count > 0 ? "text-neutral-900 dark:text-white" : "text-neutral-300 dark:text-neutral-600"}`}>
                        {count}
                      </div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {STAGES.find((s) => s.key === stage)?.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-neutral-200 dark:text-neutral-700 shrink-0" strokeWidth={1.75} />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-8 pt-10 pb-20">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl mb-8 max-w-xs">
          {([
            { key: "applications", label: "Applications", count: applications.length },
            { key: "saved",        label: "Saved Jobs",   count: savedJobs.length    },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all uppercase tracking-wide ${
                activeTab === t.key
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold font-mono tabular-nums ${
                  activeTab === t.key
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300"
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
                  className={`px-4 py-2 rounded-full text-[10px] font-semibold transition-all uppercase tracking-wide ${
                    activeFilter === s.key
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {fetching ? (
              <LoadingGrid />
            ) : filtered.length === 0 ? (
              <EmptyState icon={Briefcase} title="No applications yet">
                Browse jobs and hit{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">Quick Apply</span>{" "}
                to get started.
              </EmptyState>
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
              <LoadingGrid />
            ) : savedJobs.length === 0 ? (
              <EmptyState icon={Bookmark} title="No saved jobs yet">
                Click the{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">bookmark icon</span>{" "}
                on any job to save it here.
              </EmptyState>
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
