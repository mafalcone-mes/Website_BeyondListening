import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

/*
 * Designer workbench: every token and every component in every state.
 * Phase 0 skeleton. Each new component adds a section here.
 */

const colorTokens = [
  "bg",
  "surface",
  "surface-raised",
  "surface-sunken",
  "fg",
  "fg-muted",
  "fg-subtle",
  "border",
  "border-strong",
  "accent",
  "accent-hover",
  "accent-fg",
  "accent-soft",
  "focus-ring",
  "success",
  "warning",
  "danger",
  "player-bg",
  "player-fg",
] as const;

const typeScale = ["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"] as const;
const radii = ["sm", "md", "lg", "xl", "full"] as const;
const shadows = ["1", "2", "3"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-border py-10">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-12">
      <h1 className="text-4xl">Styleguide</h1>
      <p className="mt-3 max-w-reading text-fg-muted">
        Tokens live in <code className="font-mono text-sm">src/styles/tokens.css</code>, fonts in{" "}
        <code className="font-mono text-sm">src/styles/fonts.ts</code>. Switch your system to dark
        mode to preview the dark theme.
      </p>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {colorTokens.map((name) => (
            <li key={name} className="flex flex-col gap-2">
              <span
                className="h-16 rounded-md border border-border shadow-1"
                style={{ backgroundColor: `var(--color-${name})` }}
              />
              <code className="font-mono text-xs text-fg-muted">--color-{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          {typeScale.map((size) => (
            <p key={size} className="font-display" style={{ fontSize: `var(--text-${size})` }}>
              <code className="mr-4 font-mono text-xs text-fg-subtle">text-{size}</code>
              The song that holds a story
            </p>
          ))}
        </div>
        <p className="max-w-reading font-body text-lg leading-relaxed">
          Body / reading text: It was the summer my grandmother taught me to drive, and the radio
          only had one station that worked in the hills. Every time this song came on she turned
          it up and told me to keep my eyes on the road.
        </p>
        <p className="font-ui">UI text: Inter, used for buttons, labels and navigation.</p>
      </Section>

      <Section title="Radius & shadow">
        <div className="flex flex-wrap gap-6">
          {radii.map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <span
                className="size-20 border border-border-strong bg-surface"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="font-mono text-xs text-fg-muted">radius-{r}</code>
            </div>
          ))}
          {shadows.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <span
                className="size-20 rounded-md bg-surface-raised"
                style={{ boxShadow: `var(--shadow-${s})` }}
              />
              <code className="font-mono text-xs text-fg-muted">shadow-{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            <code className="w-24 font-mono text-xs text-fg-subtle">{variant}</code>
            <Button variant={variant} size="sm">Small</Button>
            <Button variant={variant}>Default</Button>
            <Button variant={variant} size="lg">Large</Button>
            <Button variant={variant} loading>Loading</Button>
            <Button variant={variant} disabled>Disabled</Button>
          </div>
        ))}
      </Section>
    </main>
  );
}
