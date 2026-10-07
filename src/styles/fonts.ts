/**
 * FONTS — the only place where font families are chosen.
 *
 * To swap a font, change the import and the call below (any Google font with an
 * open licence works, or use `next/font/local` for self-provided files).
 * Fonts are downloaded at build time and served by this site: visitors'
 * browsers never contact Google.
 *
 * `display` is used for headings and story text, `ui` for interface text.
 * The CSS variables are consumed in src/styles/tokens.css.
 */
import { Inter, Newsreader } from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display-family",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui-family",
  display: "swap",
});

export const fontVariables = `${display.variable} ${ui.variable}`;
