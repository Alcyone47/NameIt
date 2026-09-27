"use client";

import { StepHeading } from "./StepHeading";
import { buttonClass } from "./ui/button";

interface Props {
  imageUrl: string;
  onChange: () => void;
  onContinue: () => void;
}

export function ImagePreview({ imageUrl, onChange, onContinue }: Props) {
  return (
    <div className="animate-rise">
      <StepHeading step={1} title="Ooh, look at that." subtitle="Happy with this one?" />

      <div className="relative mx-auto mt-10 w-full max-w-md">
        <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-[2rem] bg-sun/60" />
        <div className="relative -rotate-1 animate-pop overflow-hidden rounded-[2rem] bg-paper p-3 shadow-lift ring-1 ring-ink/5">
          {/* A blob: URL for a local file — next/image can't optimise it and doesn't need to. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="The photo you chose"
            className="max-h-[55dvh] w-full rounded-[1.5rem] object-contain bg-cream"
          />
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-md flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={onChange} className={buttonClass("secondary", "lg")}>
          Change Image
        </button>
        <button type="button" onClick={onContinue} className={buttonClass("primary", "lg")}>
          Continue →
        </button>
      </div>
    </div>
  );
}
