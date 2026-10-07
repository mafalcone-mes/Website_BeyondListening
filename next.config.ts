import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isDev = process.env.NODE_ENV !== "production";
// Only force HTTPS once the site is actually served over HTTPS (not for the local http://localhost prototype).
const isHttps = (process.env.SITE_URL ?? "").startsWith("https://");

/*
 * Content Security Policy: the browser may only load what's listed here.
 * - Storage (recordings, uploads, covers) goes through this site's /sb proxy → 'self'.
 * - Song previews and artwork come from Deezer and Apple.
 * - The speech-to-text model downloads once from Hugging Face.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.dzcdn.net https://*.mzstatic.com",
  "media-src 'self' blob: https://*.dzcdn.net https://*.itunes.apple.com https://*.apple.com",
  "connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co",
  "worker-src 'self' blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps && !isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Cover images are resized in the admin's browser before upload.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async rewrites() {
    // Browser → this site → Supabase (Storage). One origin works on phones and keeps the CSP tight.
    return supabaseUrl ? [{ source: "/sb/:path*", destination: `${supabaseUrl}/:path*` }] : [];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
          ...(isHttps && !isDev ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
