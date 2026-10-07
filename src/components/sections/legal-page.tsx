export function LegalPage({
  title,
  updated,
  version,
  intro,
  sections,
  attribution,
}: {
  title: string;
  updated: string;
  version: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  attribution?: string;
}) {
  return (
    <article className="mx-auto w-full max-w-reading px-4 py-12">
      <h1 className="text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        Last updated {updated} · version {version}
      </p>
      <p className="mt-6 font-body text-lg leading-relaxed">{intro}</p>
      {sections.map((s) => (
        <section key={s.heading} className="mt-10">
          <h2 className="text-2xl">{s.heading}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="mt-3 leading-relaxed text-fg-muted">
              {p}
            </p>
          ))}
        </section>
      ))}
      {attribution ? <p className="mt-12 text-xs text-fg-subtle">{attribution}</p> : null}
    </article>
  );
}
