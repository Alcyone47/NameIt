"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

import type { PrivacyDisclosure } from "@/lib/types";
import { CameraCapture } from "./CameraCapture";
import { ErrorBanner } from "./ErrorBanner";
import { PrivacyNote } from "./PrivacyNote";
import { StepHeading } from "./StepHeading";

interface Props {
  onSelect: (file: File) => void;
  error: string | null;
  disclosure: PrivacyDisclosure;
}

function prefersNativeCamera(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches || !navigator.mediaDevices?.getUserMedia
  );
}

export function ImagePicker({ onSelect, error, disclosure }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    e.target.value = "";
    if (file) onSelect(file);
  };

  const takePhoto = () => {
    setCameraNotice(null);
    // Phones & tablets: the native camera app is the best experience.
    if (prefersNativeCamera()) cameraInputRef.current?.click();
    else setCameraOpen(true);
  };

  const onCameraUnavailable = useCallback((message: string) => {
    setCameraOpen(false);
    setCameraNotice(message);
  }, []);
  const closeCamera = useCallback(() => setCameraOpen(false), []);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <div className="animate-rise">
      <StepHeading step={1} title="First, show us what you're naming." subtitle="A clear photo helps us get the vibe right." />

      <div
        className="mx-auto mt-10 grid max-w-3xl items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <OptionCard
          onClick={takePhoto}
          tone="bg-coral-wash"
          iconBg="bg-coral text-white"
          title="Take a Photo"
          hint="Use your camera"
          icon={
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3l1.4-2h5.6l1.4 2h1.3A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.6" />
            </svg>
          }
        />

        <div className="flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted">
          <span className="h-px w-12 bg-line sm:hidden" />
          or
          <span className="h-px w-12 bg-line sm:hidden" />
        </div>

        <OptionCard
          onClick={() => galleryInputRef.current?.click()}
          tone={dragging ? "bg-sky/60 ring-2 ring-sky" : "bg-sky/30"}
          iconBg="bg-ink text-white"
          title="Upload an Image"
          hint={dragging ? "Drop it here!" : "From your gallery or files"}
          icon={
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="m20.5 16-4.8-4.8a1.5 1.5 0 0 0-2.1 0L5 19.5" />
            </svg>
          }
        />
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInput} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />

      <div className="mx-auto mt-6 max-w-lg space-y-3">
        {error && <ErrorBanner message={error} />}
        {cameraNotice && <ErrorBanner message={cameraNotice} tone="info" />}
      </div>

      <p className="mt-6 text-center text-sm text-muted">JPG, PNG or WEBP · up to 10 MB</p>

      <div className="mt-8">
        <PrivacyNote disclosure={disclosure} />
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            onSelect(file);
          }}
          onClose={closeCamera}
          onUnavailable={onCameraUnavailable}
        />
      )}
    </div>
  );
}

function OptionCard({
  onClick,
  tone,
  iconBg,
  title,
  hint,
  icon,
}: {
  onClick: () => void;
  tone: string;
  iconBg: string;
  title: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-row items-center gap-5 rounded-[1.75rem] p-5 text-left ring-1 ring-ink/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30 active:scale-[0.98] sm:aspect-[4/3.4] sm:flex-col sm:justify-center sm:p-8 sm:text-center ${tone}`}
    >
      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:h-20 sm:w-20 sm:rounded-3xl ${iconBg}`}>
        {icon}
      </span>
      <span>
        <span className="block font-display text-2xl font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm text-ink-soft">{hint}</span>
      </span>
    </button>
  );
}
