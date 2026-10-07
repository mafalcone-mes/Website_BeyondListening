import { Check } from "lucide-react";
import { cx } from "@/components/ui/utils";

/** Progress through a multi-step form. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 flex-col gap-2" aria-current={active ? "step" : undefined}>
              <span className={cx("h-1 rounded-full", done || active ? "bg-accent" : "bg-border")} />
              <span className={cx("hidden items-center gap-1 text-xs sm:flex", active ? "font-semibold text-fg" : "text-fg-subtle")}>
                {done ? <Check className="size-3.5" aria-hidden /> : null}
                {label}
              </span>
              <span className="sr-only">
                {label}: {done ? "completed" : active ? "current step" : "not started"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-fg-subtle sm:hidden">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </nav>
  );
}
