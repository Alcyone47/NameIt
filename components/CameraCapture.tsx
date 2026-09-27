"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buttonClass } from "./ui/button";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
  /** Called when the camera can't be opened, so the caller can fall back. */
  onUnavailable: (message: string) => void;
}

/**
 * Live camera viewfinder for desktops/laptops, where `capture` on a file
 * input does nothing. Phones use the native camera via the file input
 * instead (see ImagePicker). Frames stay in memory; the stream is stopped
 * as soon as the dialog closes.
 */
export function CameraCapture({ onCapture, onClose, onUnavailable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [ready, setReady] = useState(false);
  const [canFlip, setCanFlip] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stop();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
          setReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException)?.name;
        onUnavailable(
          name === "NotAllowedError"
            ? "We couldn't get permission to use your camera. You can allow it in your browser settings, or upload a photo instead."
            : "We couldn't find a camera on this device. Try uploading a photo instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [facing, onUnavailable, stop]);

  // Stop the stream when the dialog unmounts.
  useEffect(() => stop, [stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      // Match the mirrored preview.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        onCapture(new File([blob], "camera.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl animate-pop overflow-hidden rounded-[2rem] bg-paper shadow-lift">
        <div className="relative aspect-[4/3] bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"} ${facing === "user" ? "-scale-x-100" : ""}`}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              Opening camera…
            </div>
          )}
          {/* Viewfinder corners */}
          <div aria-hidden className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/25" />
        </div>

        <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            Cancel
          </button>

          <button
            type="button"
            onClick={snap}
            disabled={!ready}
            aria-label="Take photo"
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-coral shadow-coral transition active:scale-95 disabled:opacity-50"
          >
            <span className="h-12 w-12 rounded-full border-4 border-white transition group-hover:scale-90" />
          </button>

          <button
            type="button"
            onClick={() => {
              setReady(false);
              setFacing((f) => (f === "user" ? "environment" : "user"));
            }}
            disabled={!canFlip}
            className={buttonClass("ghost", "md", canFlip ? "" : "invisible")}
          >
            Flip ⟲
          </button>
        </div>
      </div>
    </div>
  );
}
