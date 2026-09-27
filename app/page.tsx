import { connection } from "next/server";

import { Hero } from "@/components/Hero";
import { NameItApp } from "@/components/NameItApp";
import { getPrivacyDisclosure } from "@/lib/ai/vision-model";

export default async function Home() {
  // Read AI config at request time so the privacy notice always matches
  // the provider actually in use.
  await connection();
  const disclosure = getPrivacyDisclosure();

  return (
    <div className="relative z-10">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span aria-hidden className="flex h-8 w-8 rotate-[-8deg] items-center justify-center rounded-xl bg-coral text-base text-white shadow-coral">
            ✦
          </span>
          NameIt
        </a>
        <span className="hidden text-sm text-ink-soft sm:block">No accounts. No history. Just names.</span>
      </header>

      <main>
        <Hero />
        <NameItApp disclosure={disclosure} />
      </main>

      <footer className="px-4 pb-10 text-center text-sm text-muted">
        Made for naming the things you love. Nothing you upload is stored.
      </footer>
    </div>
  );
}
