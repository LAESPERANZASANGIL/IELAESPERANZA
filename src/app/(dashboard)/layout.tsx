import { type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex">
      <Sidebar role={profile.role} fullName={profile.full_name} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
