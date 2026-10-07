import type { Metadata } from "next";
import { fontVariables } from "@/styles/fonts";
import { copy } from "@/content/copy";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: copy.site.name,
    template: `%s · ${copy.site.name}`,
  },
  description: copy.site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
