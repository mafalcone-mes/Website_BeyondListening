import { ImageResponse } from "next/og";

/*
 * Share-preview images (Open Graph). Satori can't read CSS variables, so these
 * colours mirror src/styles/tokens.css (paper / ink / vinyl). Update both together.
 */
const PAPER = "#f8f3ea";
const INK = "#2a2420";
const MUTED = "#6b5f57";
const ACCENT = "#a8432a";

export const ogSize = { width: 1200, height: 630 };

export function ogImage({ eyebrow, title, subtitle, artworkUrl }: { eyebrow: string; title: string; subtitle?: string; artworkUrl?: string | null }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, padding: 64, gap: 56, alignItems: "center" }}>
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkUrl} width={420} height={420} style={{ borderRadius: 24, objectFit: "cover" }} alt="" />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
          <div style={{ fontSize: 28, color: ACCENT, letterSpacing: 2, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 52 : 68, color: INK, lineHeight: 1.1, fontWeight: 700 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 32, color: MUTED }}>{subtitle}</div> : null}
          <div style={{ marginTop: 24, fontSize: 28, color: INK }}>Beyond Listening</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
