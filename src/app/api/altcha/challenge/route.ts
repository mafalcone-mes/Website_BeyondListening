import { connection } from "next/server";
import { limitVisitor } from "@/lib/api";
import { altchaChallengeHandler } from "@/lib/captcha";

/** A fresh proof-of-work challenge for the ALTCHA widget (forms: submit, report, links). */
export async function GET(request: Request) {
  await connection();
  const limited = await limitVisitor("altcha", 60, 30);
  if (limited) return limited;
  return altchaChallengeHandler(request);
}
