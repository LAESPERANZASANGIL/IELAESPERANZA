import { type ReactNode } from "react";
import { requireProfile } from "@/lib/auth/session";

export default async function MenuLayout({ children }: { children: ReactNode }) {
  await requireProfile();
  return <>{children}</>;
}
