"use client";

import { useEffect, useRef } from "react";

import type { NameSuggestion } from "@/lib/types";
import { ErrorBanner } from "./ErrorBanner";
import { NameCard, NameCardSkeleton } from "./NameCard";
import { buttonClass } from "./ui/button";

interface Props {
  imageUrl: string;
  subject?: string;
  mode: "live" | "demo";
  batches: NameSuggestion[][];
  loadingMore: boolean;
  moreError: string | null;
  onMore: () => void;
  onRestart: () => void;
}

export function Results({
  imageUrl,
  subject,
  mode,
  batches,
  loadingMore,
  moreError,
  onMore,
  onRestart,
}: Props) {
  const latestBatchRef = useRef<HTMLDivElement>(null);
  const batchCount = batches.length;

  // When a new batch lands, bring it into view.
  useEffect(() => {
    if (batchCount > 1) {
      latestBatchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [batchCount]);

  return (
    <div className="animate-rise">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-20 w-20 rotate-[-5deg] animate-pop rounded-3xl object-cover shadow-lift ring-4 ring-paper"
        />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-coral">Step 3 of 3</p>
        <h2 className="font-display mt-3 text-[clamp(2rem,5.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight">
          We found some names for it.
        </h2>
        {subject && mode === "live" && (
          <p className="mt-3 text-base text-ink-soft sm:text-lg">
            Hand-picked for your <span className="font-semibold text-ink">{subject}</span>.
          </p>
        )}
      </div>

      {mode === "demo" && (
        <div className="mx-auto mt-6 max-w-xl">
          <ErrorBanner
            tone="info"
            message="Demo mode: no vision model is connected, so these come straight from our name list without looking at your photo. Add an AI model in .env.local to get image-aware names."
          />
        </div>
      )}

      <div className="mt-10 space-y-12">
        {batches.map((batch, b) => (
          <div key={b} ref={b === batches.length - 1 ? latestBatchRef : undefined} className="scroll-mt-8">
            {b > 0 && (
              <div className="mb-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-line" />
                <span className="font-display text-lg font-semibold text-ink-soft">A fresh batch ✨</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {batch.map((s, i) => (
                <NameCard key={`${b}-${s.name}`} suggestion={s} index={i} />
              ))}
            </div>
          </div>
        ))}

        {loadingMore && (
          <div aria-busy className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <NameCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>

      {moreError && (
        <div className="mx-auto mt-8 max-w-lg">
          <ErrorBanner message={moreError} />
        </div>
      )}

      <div className="sticky bottom-3 z-30 mx-auto mt-12 flex max-w-md gap-2 rounded-full bg-paper/85 p-1.5 shadow-lift ring-1 ring-line backdrop-blur-md sm:static sm:gap-3 sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0 sm:backdrop-blur-none">
        <button type="button" onClick={onMore} disabled={loadingMore} className={buttonClass("primary", "bar")}>
          {loadingMore ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Finding more…
            </>
          ) : moreError ? (
            "Try Again"
          ) : (
            "✨ Give Me More"
          )}
        </button>
        <button type="button" onClick={onRestart} className={buttonClass("secondary", "bar")}>
          Name Something Else
        </button>
      </div>
    </div>
  );
}
