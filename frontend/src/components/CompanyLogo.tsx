"use client";

import { useEffect, useState } from "react";

/**
 * Renders a real company logo, falling back to a letter monogram.
 *
 * The job API only gives us a company *name*, and Clearbit's old logo-by-name
 * endpoint was shut down. So we resolve name -> domain via Clearbit's still-live
 * autocomplete API, then render the logo from a favicon service (which returns
 * an <img> with no CORS/key requirements). Results are cached per company name
 * for the session so we only resolve each company once.
 *
 * To avoid ever showing the WRONG company's logo, we only accept an autocomplete
 * hit whose name/domain strictly matches the cleaned company name.
 */

// Words that are not part of the brand and hurt name -> domain resolution.
const NOISE = new Set([
  "inc", "llc", "ltd", "co", "corp", "corporation", "company", "holdings",
  "group", "plc", "gmbh", "the", "technologies", "technology", "solutions",
  "systems", "services", "international", "global", "labs", "studio",
]);

function clean(name: string): string {
  return name
    .toLowerCase()
    .split(/[\s,.\-&]+/)
    .filter((t) => t && !NOISE.has(t))
    .join("");
}

// Module-level cache shared across all instances for the session.
const domainCache = new Map<string, string | null>();

async function resolveDomain(company: string): Promise<string | null> {
  if (domainCache.has(company)) return domainCache.get(company)!;

  const cleaned = clean(company);
  let domain: string | null = null;
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`
    );
    if (res.ok) {
      const results: { name: string; domain: string }[] = await res.json();
      for (const r of results) {
        const root = (r.domain || "").split(".")[0];
        // Strict: domain root or result name must equal the cleaned company.
        if (root === cleaned || clean(r.name) === cleaned) {
          domain = r.domain;
          break;
        }
      }
    }
  } catch {
    /* network/CORS issue — fall back to monogram */
  }

  domainCache.set(company, domain);
  return domain;
}

export default function CompanyLogo({
  company,
  className = "",
}: {
  company: string | null;
  className?: string;
}) {
  const [domain, setDomain] = useState<string | null>(
    company ? domainCache.get(company) ?? null : null
  );
  const [imgError, setImgError] = useState(false);
  const initial = company?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    setImgError(false);
    if (!company) return;
    if (domainCache.has(company)) {
      setDomain(domainCache.get(company)!);
      return;
    }
    let active = true;
    resolveDomain(company).then((d) => {
      if (active) setDomain(d);
    });
    return () => {
      active = false;
    };
  }, [company]);

  const showLogo = domain && !imgError;

  return (
    <div
      className={`bg-white border border-neutral-200/60 overflow-hidden flex items-center justify-center shrink-0 ${className}`}
    >
      {showLogo ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt={company ?? ""}
          className="w-full h-full object-contain p-[15%]"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-neutral-600">{initial}</span>
      )}
    </div>
  );
}
