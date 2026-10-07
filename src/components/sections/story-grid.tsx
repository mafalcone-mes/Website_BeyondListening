import type { ReactNode } from "react";
import { StoryCard, type StoryCardProps } from "@/components/patterns/story-card";
import { cx } from "@/components/ui/utils";

export function SectionHeading({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h2 id={id} className="text-3xl">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Responsive grid of story cards. */
export function StoryGrid({
  stories,
  variant = "default",
  className,
}: {
  stories: (StoryCardProps & { id: string })[];
  variant?: "default" | "feature";
  className?: string;
}) {
  return (
    <ul
      className={cx(
        "grid grid-cols-1 gap-5",
        variant === "feature" ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {stories.map((s) => (
        <li key={s.id}>
          <StoryCard {...s} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
