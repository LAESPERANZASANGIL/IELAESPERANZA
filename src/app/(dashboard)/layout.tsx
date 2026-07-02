import { type ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <DashboardShell role={profile.role} fullName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
