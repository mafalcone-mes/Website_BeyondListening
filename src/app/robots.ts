import type { MetadataRoute } from "next";
import { serverEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = serverEnv().SITE_URL;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/manage", "/verify", "/submit", "/api", "/styleguide"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
