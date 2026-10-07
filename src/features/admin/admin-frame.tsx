"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell, type AdminNavItem } from "@/components/sections/admin-shell";

/** Highlights the current section in the admin navigation. */
export function AdminFrame(props: { siteName: string; nav: AdminNavItem[]; logout: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  return <AdminShell {...props} current={pathname} />;
}
