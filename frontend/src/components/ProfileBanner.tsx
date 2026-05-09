"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { ResumeProfile } from "@/lib/api";

interface ProfileBannerProps {
  profile: ResumeProfile;
  onClear: () => void;
}

function formatDomain(domain: string): string {
  return domain
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProfileBanner({ profile, onClear }: ProfileBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="rounded-xl border border-[#0051d5]/20 dark:border-blue-800 bg-gradient-to-r from-[#0051d5]/5 dark:from-blue-950/40 to-blue-50 dark:to-blue-950/30 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0051d5]" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              AI-matched to your profile
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {profile.summary}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-full bg-[#0051d5]/10 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-[#0051d5] dark:text-blue-300"
            >
              {formatDomain(profile.domain)}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-full bg-[#0051d5]/10 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-[#0051d5] dark:text-blue-300"
            >
              {profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1)} Level
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-full bg-[#0051d5]/10 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-[#0051d5] dark:text-blue-300"
            >
              {profile.years_experience}+ yrs exp
            </motion.span>
            {profile.skills.slice(0, 5).map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="rounded-full border border-[#0051d5]/20 dark:border-blue-700 bg-white/70 dark:bg-gray-700/70 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-blue-300"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-[#0051d5]/8 dark:hover:bg-blue-900/30 hover:text-[#0051d5] dark:hover:text-blue-300 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </motion.button>
      </div>
    </motion.div>
  );
}
