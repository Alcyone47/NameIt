import type { CSSProperties } from "react";

import { buttonClass } from "./ui/button";

const FLOATING_TAGS = [
  { label: "Mochi", emoji: "🧸", className: "left-[2%] top-[14%] bg-coral-wash", r: "-8deg", delay: "0s" },
  { label: "Turbo", emoji: "🏍️", className: "right-[3%] top-[10%] bg-sky/60", r: "6deg", delay: "1.2s" },
  { label: "Sir Fluffington", emoji: "🐈", className: "left-[6%] bottom-[16%] bg-lilac/60", r: "5deg", delay: "0.6s" },
  { label: "Fern", emoji: "🪴", className: "right-[7%] bottom-[20%] bg-mint/70", r: "-6deg", delay: "1.8s" },
  { label: "Nova", emoji: "🚗", className: "right-[20%] top-[2%] bg-sun/50", r: "-3deg", delay: "2.4s" },
];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-x-clip px-4 pb-16 pt-8 sm:px-6">
      {/* Soft colour blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sun/30 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-lilac/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-coral/15 blur-3xl" />
      </div>

      {FLOATING_TAGS.map((t) => (
        <div
          key={t.label}
          aria-hidden
          className={`absolute hidden animate-float items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-lg font-semibold text-ink shadow-soft ring-1 ring-ink/5 md:flex ${t.className}`}
          style={{ "--r": t.r, animationDelay: t.delay } as CSSProperties}
        >
          <span className="text-xl">{t.emoji}</span>
          {t.label}
        </div>
      ))}

      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-6 inline-flex animate-rise items-center gap-2 rounded-full bg-paper/80 px-4 py-1.5 text-sm font-medium text-ink-soft ring-1 ring-line backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-mint ring-4 ring-mint/30" />
          No sign-up. Nothing saved.
        </p>

        <h1
          className="font-display animate-rise text-[clamp(2.75rem,9vw,6.25rem)] font-semibold leading-[0.95] tracking-tight text-ink [animation-delay:80ms]"
        >
          What should I{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10 italic text-coral">name</span>
            <svg
              aria-hidden
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
              className="absolute -bottom-1 left-0 z-0 h-[0.3em] w-full text-sun"
            >
              <path
                d="M3 14 C 50 4, 120 4, 197 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </span>{" "}
          it?
        </h1>

        <p className="mx-auto mt-7 max-w-xl animate-rise text-xl font-medium text-ink sm:text-2xl [animation-delay:160ms]">
          Give us a picture. Tell us the vibe. We&apos;ll find the name.
        </p>
        <p className="mx-auto mt-3 max-w-md animate-rise text-base text-ink-soft sm:text-lg [animation-delay:220ms]">
          From teddy bears to bikes, pets to plants — find a name that actually fits.
        </p>

        <div className="mt-10 flex animate-rise flex-col items-center gap-4 [animation-delay:300ms]">
          <a href="#name-it" className={buttonClass("primary", "lg", "group")}>
            Name Something
            <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </a>
        </div>

        {/* Mobile-only examples, since the floating tags are hidden there */}
        <div aria-hidden className="mt-12 flex flex-wrap justify-center gap-2 md:hidden">
          {FLOATING_TAGS.slice(0, 4).map((t) => (
            <span
              key={t.label}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-sm font-semibold ring-1 ring-ink/5 ${t.className.split(" ").filter((c) => c.startsWith("bg-")).join(" ")}`}
            >
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
