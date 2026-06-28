import { LogoutButton } from "@/components/auth/LogoutButton";

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <LogoutButton />
    </header>
  );
}
