"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Mail, Lock, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Tab = "signin" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ── Left panel: dark brand side ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0051d5]/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10 inline-flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Navigation className="text-black" size={18} />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            Path<span className="text-[#0051d5]">AI</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="relative z-10">
          <motion.h1
            className="text-6xl font-black text-white leading-[0.9] tracking-tight mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            YOUR CAREER,
            <br />
            <span className="text-[#0051d5]">REDEFINED.</span>
          </motion.h1>
          <motion.p
            className="text-lg text-neutral-400 font-medium leading-relaxed max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            AI-powered job matching that decodes your career DNA and connects
            you with roles that fit your trajectory — not just your keywords.
          </motion.p>

          {/* Stat pills */}
          <motion.div
            className="flex gap-3 mt-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {[
              { value: "95%", label: "Match Accuracy" },
              { value: "10K+", label: "Placed" },
              { value: "3.2×", label: "Faster" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center"
              >
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 text-xs font-bold text-neutral-700 uppercase tracking-widest">
          © 2026 PathAI. All rights reserved.
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Navigation className="text-white" size={16} />
            </div>
            <span className="text-xl font-black tracking-tight">
              Path<span className="text-[#0051d5]">AI</span>
            </span>
          </Link>

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10"
          >
            <h2 className="text-4xl font-black tracking-tight text-black mb-2">
              {tab === "signin" ? "Welcome back." : "Get started."}
            </h2>
            <p className="text-neutral-400 font-medium text-sm">
              {tab === "signin"
                ? "Sign in to continue your career journey."
                : "Create your account and let AI do the rest."}
            </p>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-2xl mb-10">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${
                  tab === t
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form / success state */}
          <AnimatePresence mode="wait">
            {signupSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  className="w-16 h-16 bg-[#0051d5] rounded-2xl flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-black text-black mb-3">Check your email</h3>
                <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                  We sent a confirmation link to{" "}
                  <strong className="text-black">{email}</strong>.{" "}
                  Click it to activate your account, then sign in.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === "signin" ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black text-black mb-2 uppercase tracking-[0.2em]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3.5 border border-neutral-200 rounded-xl text-sm bg-white text-black placeholder:text-neutral-300 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black text-black mb-2 uppercase tracking-[0.2em]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 border border-neutral-200 rounded-xl text-sm bg-white text-black placeholder:text-neutral-300 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                    >
                      <p className="text-sm text-red-600 font-semibold">{error}</p>
                      {isEmailNotConfirmed && (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendLoading || resendSent}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#0051d5] hover:underline disabled:opacity-60 mt-2"
                        >
                          {resendLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          {resendSent ? "Confirmation email sent!" : "Resend confirmation email"}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-black text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {tab === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-neutral-300 font-medium mt-8">
            By continuing, you agree to our{" "}
            <a href="#" className="text-neutral-400 hover:text-black transition-colors">
              terms of service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
