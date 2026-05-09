"use client";

import { useState } from "react";

export default function CompanyLogo({
  company,
  className = "",
}: {
  company: string | null;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const initial = company?.[0]?.toUpperCase() ?? "?";
  const slug = (company ?? "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

  return (
    <div className={`bg-white border border-neutral-200/60 overflow-hidden flex items-center justify-center shrink-0 ${className}`}>
      {!error && slug ? (
        <img
          src={`https://logo.clearbit.com/${slug}.com`}
          alt={company ?? ""}
          className="w-full h-full object-contain p-[15%]"
          onError={() => setError(true)}
        />
      ) : (
        <span className="font-bold text-neutral-600">{initial}</span>
      )}
    </div>
  );
}
