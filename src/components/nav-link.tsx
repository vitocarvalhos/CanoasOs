"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, LayoutDashboard, UsersRound } from "@/components/icons";

const icons = {
  today: CalendarClock,
  pipeline: LayoutDashboard,
  leads: UsersRound,
};

export function NavLink({ href, label, icon }: { href: string; label: string; icon: keyof typeof icons }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/today" && pathname.startsWith(href));
  const Icon = icons[icon];
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white text-black" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}>
      <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
      {label}
    </Link>
  );
}
