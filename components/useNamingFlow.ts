"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { NameRequestError, requestNames, type ClientErrorCode } from "@/lib/client/api";
import { prepareImageForUpload } from "@/lib/client/image";
import type { ImageAnalysis, NameSuggestion } from "@/lib/types";
import { ERROR_COPY, validateImageFile } from "@/lib/validation";

export type Step = "pick" | "preview" | "spec" | "loading" | "results" | "error";

export interface ChosenImage {
  file: File;
  url: string;
}

function errorCodeOf(err: unknown): ClientErrorCode {
  return err instanceof NameRequestError ? err.code : "AI_FAILED";
}

/**
 * All of NameIt's client state lives here, in memory only. Refreshing or
 * leaving the page drops everything — by design, there is no history.
 */
export function useNamingFlow() {
  const [step, setStep] = useState<Step>("pick");
  const [image, setImage] = useState<ChosenImage | null>(null);
  const [specification, setSpecification] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);
  const [batches, setBatches] = useState<NameSuggestion[][]>([]);
  const [analysis, setAnalysis] = useState<ImageAnalysis | undefined>();
  const [mode, setMode] = useState<"live" | "demo">("live");
  const [errorCode, setErrorCode] = useState<ClientErrorCode | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  /** Downscaled upload copy of the image, reused for "Give me more". */
  const preparedRef = useRef<Blob | null>(null);
  /** Guards against a stale response landing after "start over". */
  const requestIdRef = useRef(0);

  // Release the preview's blob: URL whenever the image changes or unmounts.
  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image.url);
  }, [image]);

  const selectFile = useCallback((file: File) => {
    const problem = validateImageFile(file);
    if (problem) {
      setPickError(ERROR_COPY[problem]);
      return;
    }
    setPickError(null);
    preparedRef.current = null;
    setAnalysis(undefined);
    setImage({ file, url: URL.createObjectURL(file) });
    setStep("preview");
  }, []);

  const changeImage = useCallback(() => {
    setImage(null);
    preparedRef.current = null;
    setAnalysis(undefined);
    setStep("pick");
  }, []);

  const confirmImage = useCallback(() => setStep("spec"), []);

  const fetchBatch = useCallback(
    async (exclude: string[], reuseAnalysis?: ImageAnalysis) => {
      if (!image) throw new NameRequestError("NO_IMAGE");
      preparedRef.current ??= await prepareImageForUpload(image.file);
      return requestNames({
        image: preparedRef.current,
        specification: specification.trim(),
        exclude,
        analysis: reuseAnalysis,
      });
    },
    [image, specification],
  );

  const findNames = useCallback(async () => {
    if (!image) {
      setPickError(ERROR_COPY.NO_IMAGE);
      setStep("pick");
      return;
    }
    const id = ++requestIdRef.current;
    setErrorCode(null);
    setMoreError(null);
    setStep("loading");
    try {
      const res = await fetchBatch([]);
      if (id !== requestIdRef.current) return;
      setBatches([res.suggestions]);
      setAnalysis(res.analysis);
      setMode(res.mode);
      setStep("results");
    } catch (err) {
      if (id !== requestIdRef.current) return;
      setErrorCode(errorCodeOf(err));
      setStep("error");
    }
  }, [image, fetchBatch]);

  const findMore = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const shown = batches.flat().map((s) => s.name);
      const res = await fetchBatch(shown, analysis);
      if (id !== requestIdRef.current) return;
      setBatches((prev) => [...prev, res.suggestions]);
    } catch (err) {
      if (id !== requestIdRef.current) return;
      setMoreError(ERROR_COPY[errorCodeOf(err)]);
    } finally {
      if (id === requestIdRef.current) setLoadingMore(false);
    }
  }, [batches, analysis, fetchBatch]);

  const startOver = useCallback(() => {
    requestIdRef.current++;
    preparedRef.current = null;
    setImage(null);
    setSpecification("");
    setBatches([]);
    setAnalysis(undefined);
    setErrorCode(null);
    setMoreError(null);
    setLoadingMore(false);
    setPickError(null);
    setStep("pick");
  }, []);

  const editRequest = useCallback(() => setStep(image ? "spec" : "pick"), [image]);

  return {
    step,
    image,
    specification,
    setSpecification,
    pickError,
    batches,
    analysis,
    mode,
    errorCode,
    loadingMore,
    moreError,
    selectFile,
    changeImage,
    confirmImage,
    findNames,
    findMore,
    startOver,
    editRequest,
  };
}
