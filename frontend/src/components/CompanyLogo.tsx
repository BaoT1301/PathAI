"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Company logo with 100% visual coverage:
 *   real logo  ->  logo.dev image of the resolved/guessed domain (high-res)
 *   otherwise  ->  deterministic gradient monogram (color derived from name)
 *
 * The job API only gives a company *name*, and Clearbit's logo-by-name endpoint
 * was shut down. So we resolve name -> domain via Clearbit's still-live (and
 * CORS-enabled) autocomplete API, then render the logo from logo.dev with
 * fallback=404 (so a domain with no logo returns 404 instead of a placeholder).
 * The <img> onError then falls through candidates and finally to the monogram —
 * we never render a broken image or a stand-in graphic.
 */

// logo.dev publishable token (safe to expose client-side by design). Override
// via NEXT_PUBLIC_LOGODEV_TOKEN. Restrict it to your domain in the logo.dev
// dashboard since it ships in the client bundle.
const LOGO_TOKEN =
  process.env.NEXT_PUBLIC_LOGODEV_TOKEN || "pk_dZ1Yl8GhQVC_5uzCS5ET9Q";

// Words that aren't part of the brand and hurt name -> domain resolution.
const NOISE = new Set([
  "inc", "llc", "ltd", "co", "corp", "corporation", "company", "holdings",
  "group", "plc", "gmbh", "the", "technologies", "technology", "solutions",
  "systems", "services", "international", "global", "labs", "studio", "and",
  "of", "consulting", "partners", "associates", "enterprises", "industries",
]);

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s,./\-&]+/)
    .filter((t) => t && !NOISE.has(t));
}

// True when token array `a` is a leading prefix of `b` (same brand, e.g.
// ["booz","allen"] is a prefix of ["booz","allen","hamilton"]).
function isPrefix(a: string[], b: string[]): boolean {
  return a.length > 0 && a.length <= b.length && a.every((t, i) => b[i] === t);
}

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

  const cTokens = tokenize(company);
  const cleaned = cTokens.join("");

  // Try the full name first, then progressively stripped/shortened forms so
  // legal names resolve even when the full string returns nothing
  // ("L3Harris Technologies" -> "l3harris", "Booz Allen Hamilton" -> "booz allen").
  const queries = Array.from(
    new Set(
      [
        company,
        cTokens.join(" "),
        cTokens.slice(0, 2).join(" "),
        cTokens[0],
      ].filter(Boolean)
    )
  );

  let domain: string | null = null;
  for (const q of queries) {
    const results = await suggest(q);
    for (const r of results) {
      const rTokens = tokenize(r.name || "");
      const root = (r.domain || "").split(".")[0];
      // Accept only a confident brand match (token prefix either direction, or
      // an exact domain-root match) so we never show the wrong company.
      if (
        isPrefix(rTokens, cTokens) ||
        isPrefix(cTokens, rTokens) ||
        root === cleaned
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
  const cleaned = useMemo(() => (company ? tokenize(company).join("") : ""), [company]);
  const hue = useMemo(() => hueFromName(company || "?"), [company]);

  // Ordered domain candidates to try as a logo. Empty => monogram.
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
          src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=128&format=png&retina=true&fallback=404`}
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
