"use client";

import { buttonClass } from "./ui/button";

interface Props {
  message: string;
  isNetwork: boolean;
  onRetry: () => void;
  onEdit: () => void;
}

export function ErrorState({ message, isNetwork, onRetry, onEdit }: Props) {
  return (
    <div role="alert" className="mx-auto flex max-w-lg animate-rise flex-col items-center text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-coral-wash text-5xl shadow-soft">
        {isNetwork ? "📡" : "🤔"}
      </div>
      <h2 className="font-display mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        {isNetwork ? "Lost the connection." : "Well, that's awkward."}
      </h2>
      <p className="mt-3 text-lg text-ink-soft">{message}</p>
      <div className="mt-10 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
        <button type="button" onClick={onEdit} className={buttonClass("secondary", "lg")}>
          Tweak my request
        </button>
        <button type="button" onClick={onRetry} className={buttonClass("primary", "lg")}>
          Try Again
        </button>
      </div>
    </div>
  );
}
