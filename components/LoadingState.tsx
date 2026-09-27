"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Looking at your picture...",
  "Understanding the vibe...",
  "Finding names that fit...",
  "Putting together your shortlist...",
];

/** Rough pacing that mirrors the real pipeline (analyse → retrieve → choose). */
const STEP_DELAYS_MS = [2600, 2400, 4200];

export function LoadingState({ imageUrl }: { imageUrl: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_DELAYS_MS[step]);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-cream/95 px-6 backdrop-blur-md"
    >
      <div className="relative h-44 w-44 animate-pop sm:h-52 sm:w-52">
        <div
          aria-hidden
          className="absolute -inset-3 animate-spin-slow rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, var(--coral), var(--sun), var(--mint), var(--sky), var(--lilac), var(--coral))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full rounded-full object-cover shadow-lift ring-4 ring-paper" />
        <span aria-hidden className="absolute -right-1 top-2 animate-float text-3xl [--r:12deg]">
          ✨
        </span>
      </div>

      <p key={step} className="font-display mt-12 animate-rise text-center text-2xl font-semibold sm:text-3xl">
        {STEPS[step]}
      </p>

      <ol className="mt-8 w-full max-w-xs space-y-2.5">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i < step ? "text-ink-soft" : i === step ? "font-semibold text-ink" : "text-muted/70"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-all duration-500 ${
                i < step ? "bg-mint text-ink" : i === step ? "bg-coral text-white" : "bg-line"
              }`}
            >
              {i < step ? "✓" : i === step ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" /> : ""}
            </span>
            {label.replace("...", "")}
          </li>
        ))}
      </ol>
    </div>
  );
}
