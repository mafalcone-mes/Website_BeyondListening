import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { license } from "@/content/legal";

export const metadata: Metadata = { title: license.title };

export default function Page() {
  return <LegalPage {...license} />;
}
