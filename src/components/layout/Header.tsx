import { LogoutButton } from "@/components/auth/LogoutButton";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <LogoutButton />
    </header>
  );
}
