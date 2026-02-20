"use client";

import { motion } from "framer-motion";

type FeedStatus = "connecting" | "connected" | "disconnected";

export default function LiveIndicator({ status }: { status: FeedStatus }) {
  const config = {
    connected:    { color: "bg-green-500",  text: "Live",         pulse: true  },
    connecting:   { color: "bg-yellow-400", text: "Connecting…",  pulse: false },
    disconnected: { color: "bg-gray-400",   text: "Reconnecting", pulse: false },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      {config.text}
    </motion.div>
  );
}
