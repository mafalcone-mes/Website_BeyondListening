"use client";
import { Loader2, Pause, Play } from "lucide-react";
import { cx } from "@/components/ui/utils";

const sizes = {
  sm: "size-9 [&_svg]:size-4",
  md: "size-12 [&_svg]:size-5",
  lg: "size-16 [&_svg]:size-7",
};

/** Round play/pause button. Presentational: state comes from props. */
export function PlayToggle({
  label,
  state,
  onClick,
  disabled,
  size = "md",
  variant = "solid",
}: {
  label: string;
  state: "idle" | "loading" | "playing";
  onClick: () => void;
  disabled?: boolean;
  size?: keyof typeof sizes;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={state === "playing" ? `Pause ${label}` : `Play ${label}`}
      aria-pressed={state === "playing"}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-(--duration-fast)",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid"
          ? "bg-accent text-accent-fg hover:bg-accent-hover"
          : "border border-border-strong bg-surface-raised text-fg hover:bg-surface",
        sizes[size],
      )}
    >
      {state === "loading" ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : state === "playing" ? (
        <Pause aria-hidden />
      ) : (
        <Play className="translate-x-px" aria-hidden />
      )}
    </button>
  );
}
