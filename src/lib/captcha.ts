import "server-only";
import { createHmac } from "node:crypto";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { create, randomInt } from "altcha-lib/frameworks/nextjs";
import { serverEnv } from "@/lib/env";
import { rateLimit } from "@/lib/security";

/*
 * ALTCHA: open-source, cookie-free proof-of-work captcha (self-hosted).
 * The visitor's browser solves a small puzzle; nothing is sent to third parties.
 * Each solved challenge can be used once (replay protection via rate_limits).
 */

function secrets() {
  const secret = serverEnv().APP_SECRET;
  const sub = (label: string) => createHmac("sha256", secret).update(`altcha:${label}`).digest("hex");
  return { signature: sub("signature"), key: sub("key") };
}

const store = {
  get: () => false,
  set: () => true,
  // Atomic "first use wins": a payload can only ever be accepted once.
  setIfAbsent: (key: string) => rateLimit(`altcha:${key}`, 24 * 3600, 1),
};

let altcha: ReturnType<typeof create> | undefined;

function instance() {
  if (!altcha) {
    const s = secrets();
    altcha = create({
      deriveKey,
      hmacSignatureSecret: s.signature,
      hmacKeySignatureSecret: s.key,
      createChallengeParameters: () => ({
        algorithm: "PBKDF2/SHA-256",
        // Light enough for an old phone (~1 s), still costly for bulk spam.
        cost: 1_000,
        counter: randomInt(1_000, 3_000),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }),
      store,
    });
  }
  return altcha;
}

export function altchaChallengeHandler(request: Request) {
  return instance().challengeHandler(request);
}

/** True when the ALTCHA payload from a form is valid, not expired and not used before. */
export async function verifyAltcha(payload: unknown): Promise<boolean> {
  if (typeof payload !== "string" || !payload || payload.length > 20_000) return false;
  const s = secrets();
  const result = await instance().verify(payload, deriveKey, s.signature, s.key, store);
  return !result.error && Boolean(result.verification?.verified);
}
