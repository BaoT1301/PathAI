"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, LogOut, ChevronDown, Navigation, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";

export default function Header() {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    router.push("/");
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  const navLinks = [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/resume", label: "Upload Resume" },
    { href: "/about", label: "About" },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(25,28,29,0.04)]"
    >
      <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-[1440px] mx-auto">

        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10 lg:gap-14">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-black dark:text-white flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center">
              <Navigation className="text-white dark:text-black" size={14} />
            </div>
            PathAI
          </Link>

          <nav className="hidden md:flex gap-8 lg:gap-10">
            {navLinks.map(({ href, label }) => {
              const isActive =
                (label === "Find Jobs" && pathname?.startsWith("/jobs")) ||
                (label === "Upload Resume" && pathname?.startsWith("/resume")) ||
                (label === "About" && pathname?.startsWith("/about"));
              return (
                <Link
                  key={label}
                  href={href}
                  className={`font-bold text-[11px] tracking-widest uppercase transition-colors duration-200 ${
                    isActive
                      ? "text-[#0051d5] dark:text-blue-400"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <motion.button
                  onClick={() => { setBellOpen((o) => !o); if (!bellOpen) markAllRead(); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0051d5] text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {bellOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                            Job Alerts
                          </p>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-neutral-400">
                            No new jobs yet.
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.slice(0, 10).map((n) => (
                              <Link
                                key={n.id}
                                href="/jobs"
                                onClick={() => setBellOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-50 dark:border-neutral-800"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                    {n.job.title}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {n.job.department} · {n.job.location}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User avatar + dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setMenuOpen((o) => !o)}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[130px] truncate hidden sm:block">
                    {user.email}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </motion.button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                          My Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-t border-neutral-100 dark:border-neutral-800"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Logged-out: Sign In + Get Started */
            <>
              <Link
                href="/auth"
                className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-[11px] font-extrabold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-sm uppercase tracking-widest"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
