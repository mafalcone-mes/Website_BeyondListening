import "server-only";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { renderEmail, type EmailTemplate } from "./templates";

/*
 * Every email goes through the email_outbox table first (so failures can be
 * retried by the maintenance job), then is sent after the response.
 *
 * EMAIL_PROVIDER=local → the local inbox (Mailpit) at 127.0.0.1:54325. Nothing leaves the computer.
 * EMAIL_PROVIDER=smtp  → any SMTP server (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM).
 */

let transporter: Transporter | undefined;

function transport(): Transporter {
  if (!transporter) {
    const env = serverEnv();
    transporter =
      env.EMAIL_PROVIDER === "smtp"
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          })
        : nodemailer.createTransport({ host: "127.0.0.1", port: 54325, secure: false, ignoreTLS: true });
  }
  return transporter;
}

const from = () => process.env.EMAIL_FROM ?? "Beyond Listening <hello@beyond-listening.local>";

async function deliver(id: string, to: string, email: EmailTemplate) {
  const db = supabaseAdmin();
  const { subject, text, html } = renderEmail(email);
  try {
    await transport().sendMail({ from: from(), to, subject, text, html });
    await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
  } catch (error) {
    const { data } = await db.from("email_outbox").select("attempts").eq("id", id).single();
    await db
      .from("email_outbox")
      .update({ status: "failed", attempts: (data?.attempts ?? 0) + 1, last_error: String(error).slice(0, 500) })
      .eq("id", id);
  }
}

/** Queues an email and sends it right after the current response. */
export async function sendEmail(to: string, email: EmailTemplate): Promise<void> {
  const { data, error } = await supabaseAdmin()
    .from("email_outbox")
    .insert({ to_email: to, template: email.template, payload: email.data })
    .select("id")
    .single();
  if (error || !data) throw new Error(`could not queue email: ${error?.message}`);
  after(() => deliver(data.id, to, email));
}

/** Retries queued or failed emails (called by the maintenance job). */
export async function retryEmails(): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("email_outbox")
    .select("id, to_email, template, payload, attempts")
    .in("status", ["queued", "failed"])
    .lt("attempts", 5)
    .lt("created_at", new Date(Date.now() - 60_000).toISOString())
    .limit(50);
  for (const row of data ?? []) {
    await deliver(row.id, row.to_email, { template: row.template, data: row.payload } as EmailTemplate);
  }
  return data?.length ?? 0;
}

/** Notifies all admins who want notifications (throttled to one email per hour per admin). */
export async function notifyAdmins(email: EmailTemplate, { throttle = true } = {}) {
  const db = supabaseAdmin();
  const { data: settings } = await db.from("site_settings").select("admin_notifications").single();
  if (settings?.admin_notifications === "off") return;
  if (settings?.admin_notifications === "digest" && email.template === "admin-new-stories") return;

  const { data: admins } = await db.from("admin_profiles").select("user_id, notify_new_stories, last_notified_at");
  for (const admin of admins ?? []) {
    if (!admin.notify_new_stories) continue;
    if (throttle && admin.last_notified_at && Date.now() - new Date(admin.last_notified_at).getTime() < 3600_000) continue;
    const { data: user } = await db.auth.admin.getUserById(admin.user_id);
    if (!user?.user?.email) continue;
    await sendEmail(user.user.email, email);
    await db.from("admin_profiles").update({ last_notified_at: new Date().toISOString() }).eq("user_id", admin.user_id);
  }
}

export function siteUrl(path = "/") {
  return new URL(path, serverEnv().SITE_URL).toString();
}
