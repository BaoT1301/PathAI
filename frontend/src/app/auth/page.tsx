"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
} from "lucide-react";
import { PathMark } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Tab = "signin" | "signup";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/* Spec-label used on the always-dark brand panel (fixed light-on-dark,
   independent of the site theme toggle since that panel never lightens). */
const SPEC_ON_DARK =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400";

/* Spec-label used on the form side, which does follow the site theme. */
const SPEC =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400";

/* Same figures as the landing page's own stats section, not new claims. */
const PROOF = [
  { v: "95%", k: "Match accuracy" },
  { v: "10K+", k: "Professionals placed" },
  { v: "3.2x", k: "Faster to interview" },
];

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const isEmailNotConfirmed = error === "Email not confirmed";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "signin") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSignupSuccess(true);
      }
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (!resendError) setResendSent(true);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSignupSuccess(false);
    setResendSent(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-10 sm:px-8 sm:py-16 overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-[0.12] dark:opacity-[0.05] pointer-events-none" />

      {/* Single, reduced-motion-safe mount reveal for the whole auth card. */}
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-neutral-900 shadow-premium-lg ring-1 ring-neutral-200/70 dark:ring-white/[0.08] edge-highlight flex flex-col lg:flex-row lg:min-h-[640px]"
      >
        {/* Left: editorial brand panel */}
        <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between overflow-hidden bg-black p-12 xl:p-14 ring-1 ring-white/[0.06] edge-highlight">
          <div className="grain absolute inset-0 pointer-events-none" />

          {/* Origin-to-destination thread, echoing the PathMark route glyph. */}
          <div aria-hidden className="pointer-events-none absolute left-12 xl:left-14 top-28 bottom-28 w-px">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="h-full w-full bg-gradient-to-b from-white/25 via-white/10 to-transparent" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>

          {/* Logo */}
          <Link href="/" className="relative z-10 inline-flex items-center gap-3 w-max">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <PathMark className="w-[18px] h-[18px] text-black" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">PathAI</span>
          </Link>

          {/* Headline */}
          <div className="relative z-10">
            <span className={SPEC_ON_DARK}>Member Access</span>
            <h1 className="font-serif font-medium text-4xl xl:text-5xl leading-[1.1] tracking-tight text-white mt-5 text-balance">
              Your career,
              <br />
              <span className="italic text-neutral-400">redefined.</span>
            </h1>
            <p className="mt-6 text-[15px] text-neutral-400 font-medium leading-relaxed max-w-sm">
              AI-powered job matching that decodes your career DNA and
              connects you with roles that fit your trajectory, not just
              your keywords.
            </p>

            {/* Proof ledger: identical figures to the landing page stats. */}
            <div className="mt-10 flex flex-col gap-3 max-w-sm">
              {PROOF.map((row) => (
                <div key={row.k} className="flex items-baseline gap-3">
                  <span className="font-mono text-sm tabular-nums text-white shrink-0 w-12">
                    {row.v}
                  </span>
                  <span className="flex-1 translate-y-[-3px] border-b border-dotted border-white/15" />
                  <span className="text-xs text-neutral-400 font-medium shrink-0">
                    {row.k}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            © 2026 PathAI. All rights reserved.
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 relative">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                <PathMark className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="text-xl font-black tracking-tight text-black dark:text-white">
                PathAI
              </span>
            </Link>

            {/* Page header */}
            <div className="mb-9">
              <span className={SPEC}>{tab === "signin" ? "Sign In" : "Create Account"}</span>
              <h2 className="font-serif font-medium text-4xl tracking-tight text-black dark:text-white mt-3 mb-2">
                {tab === "signin" ? "Welcome back." : "Get started."}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                {tab === "signin"
                  ? "Sign in to continue your career journey."
                  : "Create your account and let AI do the rest."}
              </p>
            </div>

            {/* Tab switcher: sliding highlight makes the active mode obvious */}
            <div className="relative flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl mb-9">
              {(["signin", "signup"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  aria-pressed={tab === t}
                  className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 ${
                    tab === t
                      ? "text-black dark:text-white"
                      : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                  }`}
                >
                  {tab === t && (
                    <motion.span
                      layoutId="auth-tab-highlight"
                      className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-xl shadow-sm -z-10"
                      transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
                    />
                  )}
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Form / success state */}
            <AnimatePresence mode="wait">
              {signupSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  role="status"
                  aria-live="polite"
                  className="text-center py-10"
                >
                  <motion.div
                    className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6"
                    initial={reduceMotion ? undefined : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Check strokeWidth={1.75} className="w-8 h-8 text-white dark:text-black" />
                  </motion.div>
                  <h3 className="font-serif font-medium text-2xl text-black dark:text-white mb-3">
                    Check your email
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                    We sent a confirmation link to{" "}
                    <strong className="text-black dark:text-white font-semibold">{email}</strong>.
                    Click it to activate your account, then sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchTab("signin")}
                    className="mt-7 text-sm font-bold text-black dark:text-white underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4 hover:decoration-black dark:hover:decoration-white transition-colors"
                  >
                    Back to sign in
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key={tab}
                  initial={{ opacity: 0, x: tab === "signin" ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block font-mono text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-[0.2em]"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        strokeWidth={1.75}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                      />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3.5 border border-neutral-200 dark:border-white/15 rounded-xl text-sm bg-white dark:bg-neutral-800/60 text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-[#0051d5] dark:focus:border-[#6690ff] focus:ring-2 focus:ring-[#0051d5]/25 dark:focus:ring-[#6690ff]/25 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block font-mono text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-[0.2em]"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        strokeWidth={1.75}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                      />
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={tab === "signin" ? "current-password" : "new-password"}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 border border-neutral-200 dark:border-white/15 rounded-xl text-sm bg-white dark:bg-neutral-800/60 text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-[#0051d5] dark:focus:border-[#6690ff] focus:ring-2 focus:ring-[#0051d5]/25 dark:focus:ring-[#6690ff]/25 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff strokeWidth={1.75} className="w-4 h-4" />
                        ) : (
                          <Eye strokeWidth={1.75} className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        role="alert"
                        className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3"
                      >
                        <p className="text-sm text-red-700 dark:text-red-400 font-semibold">{error}</p>
                        {isEmailNotConfirmed && (
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading || resendSent}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 underline underline-offset-2 disabled:no-underline disabled:opacity-60 mt-2"
                          >
                            {resendLoading ? (
                              <Loader2 strokeWidth={1.75} className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw strokeWidth={1.75} className="w-3 h-3" />
                            )}
                            {resendSent ? "Confirmation email sent" : "Resend confirmation email"}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit: the single accent CTA on the page */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    whileHover={reduceMotion || loading ? undefined : { scale: 1.01 }}
                    whileTap={reduceMotion || loading ? undefined : { scale: 0.99 }}
                    className="w-full py-4 bg-[#0051d5] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#0045b8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed tracking-wide mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0051d5] dark:focus-visible:ring-[#6690ff] focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
                  >
                    {loading && <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />}
                    <span>
                      {loading
                        ? tab === "signin"
                          ? "Signing in..."
                          : "Creating account..."
                        : tab === "signin"
                        ? "Sign In"
                        : "Create Account"}
                    </span>
                    {!loading && <ArrowRight strokeWidth={1.75} className="w-4 h-4" />}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 font-medium mt-8">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-neutral-500 dark:text-neutral-400 underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
              >
                terms of service
              </a>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
