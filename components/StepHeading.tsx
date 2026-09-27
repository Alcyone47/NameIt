export function StepHeading({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Step {step} of 3</p>
      <h2 className="font-display mx-auto mt-3 max-w-2xl text-[clamp(2rem,5.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-base text-ink-soft sm:text-lg">{subtitle}</p>}
    </div>
  );
}
