type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "bar";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30 " +
  "disabled:opacity-60 disabled:pointer-events-none active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-coral hover:bg-coral-deep hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-8px_rgb(255_107_74/0.6)]",
  secondary:
    "bg-paper text-ink ring-1 ring-line shadow-soft hover:ring-ink/20 hover:-translate-y-0.5",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-8 text-base sm:text-lg",
  /** Compact on phones (side-by-side in a sticky bar), full size from sm up. */
  bar: "h-12 flex-1 px-3 text-[15px] sm:h-14 sm:flex-none sm:px-8 sm:text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}
