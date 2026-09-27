"use client";

import { useEffect, useState } from "react";

import type { NameSuggestion } from "@/lib/types";

const ACCENTS = ["bg-coral", "bg-sun", "bg-mint", "bg-sky", "bg-lilac"];

interface Props {
  suggestion: NameSuggestion;
  index: number;
}

export function NameCard({ suggestion, index }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    if (await copyText(suggestion.name)) setCopied(true);
  };

  const meta = [suggestion.origin, suggestion.meaning].filter(Boolean);

  return (
    <article
      className="group relative flex animate-rise flex-col overflow-hidden rounded-[1.75rem] bg-paper p-6 shadow-soft ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7"
      style={{ animationDelay: `${Math.min(index, 9) * 70}ms` }}
    >
      <span aria-hidden className={`absolute left-0 top-7 h-10 w-1.5 rounded-r-full ${ACCENTS[index % ACCENTS.length]}`} />

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display break-words text-[clamp(1.9rem,6vw,2.5rem)] font-semibold leading-none tracking-tight text-ink">
          {suggestion.name}
        </h3>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${suggestion.name}`}
          className={`relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
            copied ? "bg-mint text-ink" : "bg-cream text-ink-soft hover:bg-ink hover:text-white"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {meta.length > 0 && (
        <p className="mt-3 text-sm font-medium text-ink-soft">
          {suggestion.origin && <span className="text-ink">{suggestion.origin}</span>}
          {suggestion.origin && suggestion.meaning && <span className="mx-1.5 text-muted">·</span>}
          {suggestion.meaning && <span>“{suggestion.meaning}”</span>}
        </p>
      )}

      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-soft">{suggestion.reason}</p>

      {suggestion.tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {suggestion.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium capitalize text-ink-soft">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function NameCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] bg-paper p-7 ring-1 ring-line">
      {["h-9 w-2/5", "mt-4 h-4 w-1/2", "mt-5 h-4 w-full", "mt-2 h-4 w-4/5"].map((cls) => (
        <div
          key={cls}
          className={`${cls} animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--line)_0%,var(--cream)_50%,var(--line)_100%)] bg-[length:200%_100%]`}
        />
      ))}
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is unavailable on insecure origins (e.g. a LAN IP while
    // testing on a phone); fall back to the legacy copy command.
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}
