export function ErrorBanner({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "info";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex animate-pop items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${
        tone === "error" ? "bg-coral-wash text-coral-deep ring-coral/30" : "bg-sun/25 text-ink ring-sun/60"
      }`}
    >
      <span aria-hidden className="text-base leading-5">
        {tone === "error" ? "🙈" : "💡"}
      </span>
      <p>{message}</p>
    </div>
  );
}
