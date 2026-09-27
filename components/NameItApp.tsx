"use client";

import { useEffect, useRef } from "react";

import type { PrivacyDisclosure } from "@/lib/types";
import { ERROR_COPY } from "@/lib/validation";
import { ErrorState } from "./ErrorState";
import { ImagePicker } from "./ImagePicker";
import { ImagePreview } from "./ImagePreview";
import { LoadingState } from "./LoadingState";
import { Results } from "./Results";
import { SpecificationInput } from "./SpecificationInput";
import { useNamingFlow } from "./useNamingFlow";

export function NameItApp({ disclosure }: { disclosure: PrivacyDisclosure }) {
  const flow = useNamingFlow();
  const sectionRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // Keep the active step in view as the user moves through the flow.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (flow.step !== "loading") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [flow.step]);

  return (
    <section
      id="name-it"
      ref={sectionRef}
      aria-label="Name something"
      className="relative scroll-mt-4 px-4 pb-24 pt-8 sm:px-6"
    >
      <div className="mx-auto min-h-[80dvh] max-w-5xl rounded-[2.5rem] bg-paper/60 px-4 py-12 ring-1 ring-line backdrop-blur-sm sm:px-10 sm:py-16">
        {flow.step === "pick" && (
          <ImagePicker onSelect={flow.selectFile} error={flow.pickError} disclosure={disclosure} />
        )}

        {flow.step === "preview" && flow.image && (
          <ImagePreview imageUrl={flow.image.url} onChange={flow.changeImage} onContinue={flow.confirmImage} />
        )}

        {(flow.step === "spec" || flow.step === "loading") && flow.image && (
          <SpecificationInput
            imageUrl={flow.image.url}
            value={flow.specification}
            onChange={flow.setSpecification}
            onSubmit={flow.findNames}
            onBack={flow.changeImage}
          />
        )}

        {flow.step === "results" && flow.image && (
          <Results
            imageUrl={flow.image.url}
            subject={flow.analysis?.subject}
            mode={flow.mode}
            batches={flow.batches}
            loadingMore={flow.loadingMore}
            moreError={flow.moreError}
            onMore={flow.findMore}
            onRestart={flow.startOver}
          />
        )}

        {flow.step === "error" && flow.errorCode && (
          <ErrorState
            message={ERROR_COPY[flow.errorCode]}
            isNetwork={flow.errorCode === "NETWORK"}
            onRetry={flow.findNames}
            onEdit={flow.editRequest}
          />
        )}
      </div>

      {flow.step === "loading" && flow.image && <LoadingState imageUrl={flow.image.url} />}
    </section>
  );
}
