import type { PrivacyDisclosure } from "@/lib/types";

export function PrivacyNote({ disclosure }: { disclosure: PrivacyDisclosure }) {
  const detail =
    disclosure.kind === "external"
      ? `To do that, it's sent to our AI provider${disclosure.providerLabel ? ` (${disclosure.providerLabel})` : ""} for analysis, under that provider's own privacy terms. NameIt itself never stores it — our copy is discarded as soon as your names are ready.${disclosure.mayTrain ? " This free AI service may keep submitted images and use them to improve its models." : ""}`
      : disclosure.kind === "local"
        ? "It's analysed by an AI model running on our own server and discarded as soon as your names are ready."
        : "Demo mode: no AI model is connected, so your image is discarded without being analysed.";

  return (
    <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl bg-mint/25 px-4 py-3 text-left text-sm text-ink-soft ring-1 ring-mint/60">
      <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <p>
        <strong className="font-semibold text-ink">Your image isn&apos;t saved.</strong> We only use it to
        generate your name suggestions. {detail}
      </p>
    </div>
  );
}
