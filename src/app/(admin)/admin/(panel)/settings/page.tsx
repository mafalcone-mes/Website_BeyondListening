import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/auth";
import { ExportButton, MaintenanceButton, SettingsForm } from "@/features/admin/settings-panels";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Settings" };

async function Content() {
  await requireAdmin();
  const { data } = await supabaseAdmin().from("site_settings").select("project_story, contact_email, admin_notifications").single();
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Site</h2>
        <SettingsForm
          initial={{
            projectStory: data?.project_story ?? "",
            contactEmail: data?.contact_email ?? "",
            adminNotifications: (data?.admin_notifications ?? "instant") as "instant" | "digest" | "off",
          }}
        />
      </section>
      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h2 className="text-2xl">Your data</h2>
        <p className="text-fg-muted">
          A complete copy of the archive (stories, songs, sessions, themes and every recording) in one ZIP file. It includes
          contributors&apos; emails, so keep it somewhere safe.
        </p>
        <ExportButton />
      </section>
      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h2 className="text-2xl">Housekeeping</h2>
        <p className="text-fg-muted">
          Deletes unconfirmed stories after 3 days and declined ones after 30, clears old anti-spam records, retries emails and
          refreshes song links. Online, this runs by itself every day.
        </p>
        <MaintenanceButton />
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <h1 className="mb-6 text-4xl">Settings</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" />}>
        <Content />
      </Suspense>
    </>
  );
}
