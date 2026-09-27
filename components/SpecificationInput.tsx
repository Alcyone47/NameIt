"use client";

import { useId, useRef } from "react";

import { MAX_SPEC_LENGTH } from "@/lib/validation";
import { StepHeading } from "./StepHeading";
import { buttonClass } from "./ui/button";

const CHIPS = [
  { label: "Cute", emoji: "🥹" },
  { label: "Funny", emoji: "😂" },
  { label: "Unique", emoji: "🦄" },
  { label: "Elegant", emoji: "🥂" },
  { label: "Badass", emoji: "🔥" },
  { label: "Short", emoji: "✂️" },
  { label: "Japanese", emoji: "🗾" },
  { label: "Indian", emoji: "🪔" },
  { label: "Classic", emoji: "🎩" },
  { label: "Futuristic", emoji: "🚀" },
];

const EXAMPLES = [
  "Something cute and short.",
  "A badass name for my motorcycle.",
  "A funny name based on how it looks.",
  "Something elegant with a Sanskrit origin.",
  "Give me a name that sounds like a video game character.",
];

const PLACEHOLDER = `e.g. "Something cute and Japanese for my teddy bear. Keep it short and easy to pronounce."`;

function chipPattern(word: string) {
  return new RegExp(`\\b${word}\\b`, "i");
}

function toggleChip(text: string, word: string): string {
  if (chipPattern(word).test(text)) {
    return text
      .replace(new RegExp(`(,\\s*)?\\b${word}\\b(\\s*,)?`, "i"), (_m, before, after) =>
        before && after ? ", " : "",
      )
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s,]+|[\s,]+$/g, "");
  }
  const trimmed = text.trimEnd().replace(/[.,]+$/, "");
  return trimmed ? `${trimmed}, ${word.toLowerCase()}` : word;
}

interface Props {
  imageUrl: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function SpecificationInput({ imageUrl, value, onChange, onSubmit, onBack }: Props) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const update = (next: string) => onChange(next.slice(0, MAX_SPEC_LENGTH));

  return (
    <div className="animate-rise">
      <StepHeading step={2} title="Now tell us what you're looking for." subtitle="Write it however you like — we'll figure it out." />

      <form
        className="mx-auto mt-10 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="rounded-[2rem] bg-paper p-4 shadow-soft ring-1 ring-line transition focus-within:shadow-lift focus-within:ring-2 focus-within:ring-coral/40 sm:p-6">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
              className="group relative shrink-0"
              aria-label="Change photo"
              title="Change photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-14 w-14 rotate-[-4deg] rounded-2xl object-cover shadow-soft ring-2 ring-paper transition group-hover:rotate-0 sm:h-16 sm:w-16" />
            </button>
            <label htmlFor={id} className="pt-1 font-display text-lg font-semibold leading-snug sm:text-xl">
              What kind of name are you looking for?
            </label>
          </div>

          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(e) => update(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
            placeholder={PLACEHOLDER}
            rows={4}
            maxLength={MAX_SPEC_LENGTH}
            className="mt-4 w-full resize-none bg-transparent text-lg leading-relaxed text-ink placeholder:text-muted focus:outline-none"
          />

          <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
            <span>Optional — leave it blank and we&apos;ll go with what fits.</span>
            <span aria-live="polite">
              {value.length}/{MAX_SPEC_LENGTH}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Quick styles">
          {CHIPS.map((chip) => {
            const active = chipPattern(chip.label).test(value);
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  update(toggleChip(value, chip.label));
                  textareaRef.current?.focus({ preventScroll: true });
                }}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  active
                    ? "bg-ink text-white shadow-soft"
                    : "bg-paper text-ink-soft ring-1 ring-line hover:-translate-y-0.5 hover:text-ink hover:ring-ink/20"
                }`}
              >
                <span aria-hidden>{chip.emoji}</span>
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">Need ideas? Try</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => update(ex)}
                className="rounded-2xl bg-cream px-3.5 py-2 text-left text-sm italic text-ink-soft border border-dashed border-line transition hover:bg-paper hover:text-ink"
              >
                “{ex}”
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className={buttonClass("ghost", "lg")}>
            ← Change photo
          </button>
          <button type="submit" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
            ✨ Find Names
          </button>
        </div>
      </form>
    </div>
  );
}
