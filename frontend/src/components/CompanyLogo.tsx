"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Company logo with 100% visual coverage:
 *   real logo  ->  DuckDuckGo favicon of the resolved/guessed domain
 *   otherwise  ->  deterministic gradient monogram (color derived from name)
 *
 * The job API only gives a company *name*, and Clearbit's logo-by-name endpoint
 * was shut down. So we resolve name -> domain via Clearbit's still-live (and
 * CORS-enabled) autocomplete API, then render the logo from DuckDuckGo's icon
 * service. DuckDuckGo returns 404 when a domain has no icon, so the <img>
 * onError lets us fall through candidates and ultimately to the monogram —
 * we never render a broken image or a generic globe.
 */

// Words that aren't part of the brand and hurt name -> domain resolution.
const NOISE = new Set([
  "inc", "llc", "ltd", "co", "corp", "corporation", "company", "holdings",
  "group", "plc", "gmbh", "the", "technologies", "technology", "solutions",
  "systems", "services", "international", "global", "labs", "studio", "and",
  "of", "consulting", "partners", "associates", "enterprises", "industries",
]);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s,./\-&]+/)
    .filter((t) => t && !NOISE.has(t));
}
const clean = (name: string) => tokens(name).join("");

// Session-wide cache so each company name is resolved at most once.
const domainCache = new Map<string, string | null>();

async function suggest(query: string): Promise<{ name: string; domain: string }[]> {
  try {
    const r = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

async function resolveDomain(company: string): Promise<string | null> {
  if (domainCache.has(company)) return domainCache.get(company)!;

  const cleaned = clean(company);
  const tks = tokens(company);
  // Query the full name first (most precise), then progressively shorter forms
  // so legal/suffixed names still resolve ("L3Harris Technologies" -> "L3Harris").
  const queries = [company];
  if (tks.length > 2) queries.push(tks.slice(0, 2).join(" "));
  if (tks.length > 1) queries.push(tks[0]);

  let domain: string | null = null;
  for (const q of queries) {
    const results = await suggest(q);
    for (const r of results) {
      const root = (r.domain || "").split(".")[0];
      const rn = clean(r.name || "");
      // Accept only confident matches to avoid showing the wrong company.
      if (
        root === cleaned ||
        rn === cleaned ||
        (rn.length >= 4 && cleaned.startsWith(rn)) ||
        (root.length >= 4 && root === tks[0])
      ) {
        domain = r.domain;
        break;
      }
    }
    if (domain) break;
  }

  domainCache.set(company, domain);
  return domain;
}

// Deterministic hue from the name so each company gets a stable monogram color.
function hueFromName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export default function CompanyLogo({
  company,
  className = "",
}: {
  company: string | null;
  className?: string;
}) {
  const initial = company?.[0]?.toUpperCase() ?? "?";
  const cleaned = useMemo(() => (company ? clean(company) : ""), [company]);
  const hue = useMemo(() => hueFromName(company || "?"), [company]);

  // Ordered domain candidates to try as a favicon. Empty => monogram.
  const [candidates, setCandidates] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    if (!company) {
      setCandidates([]);
      return;
    }
    const guess = cleaned ? [`${cleaned}.com`] : [];

    if (domainCache.has(company)) {
      const d = domainCache.get(company);
      setCandidates(d ? [d, ...guess.filter((g) => g !== d)] : guess);
      return;
    }

    let active = true;
    resolveDomain(company).then((d) => {
      if (!active) return;
      // Resolved domain first (accurate); guessed domain as a last-ditch try.
      setCandidates(d ? [d, ...guess.filter((g) => g !== d)] : guess);
      setIdx(0);
    });
    return () => {
      active = false;
    };
  }, [company, cleaned]);

  const domain = candidates[idx];

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${className}`}
      style={
        domain
          ? { background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }
          : {
              background: `linear-gradient(135deg, hsl(${hue} 62% 52%), hsl(${(hue + 38) % 360} 62% 42%))`,
            }
      }
    >
      {domain ? (
        <img
          key={domain}
          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
          alt={company ?? ""}
          className="w-full h-full object-contain p-[15%]"
          onError={() => setIdx((i) => i + 1)}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-white drop-shadow-sm">{initial}</span>
      )}
    </div>
  );
}
