"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  House,
  LogOut,
  MessageSquare,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const userNavGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Home", icon: House },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/numbers", label: "Channels", icon: Phone },
      { href: "/crm/pipeline", label: "Pipeline", icon: BarChart3 },
      { href: "/reminders", label: "Activities", icon: CalendarDays },
      { href: "/templates", label: "Templates", icon: FileText },
    ],
  },
  {
    title: "Tools",
    items: [{ href: "/api-docs", label: "API Docs", icon: BookOpen }],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    title: "Admin",
    items: [
      { href: "/", label: "Overview", icon: BarChart3 },
      { href: "/admin/users", label: "Users", icon: ShieldCheck },
      { href: "/numbers", label: "Channels", icon: Phone },
      { href: "/contacts", label: "Contacts", icon: Users },
    ],
  },
  {
    title: "Developer",
    items: [{ href: "/api-docs", label: "API Docs", icon: BookOpen }],
  },
];

function flattenGroups(groups: NavGroup[]) {
  return groups.flatMap((group) => group.items);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const navGroups = user?.role === "ADMIN" ? adminNavGroups : userNavGroups;
  const navItems = flattenGroups(navGroups);
  const currentPage =
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )?.label ?? "Workspace";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] overflow-y-auto border-r border-[#32456f] bg-[var(--app-sidebar)] text-white lg:block">
        <div className="flex min-h-full flex-col">
          <div className="flex h-[70px] items-center border-b border-white/10 px-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#6078ff,#4d63e7)] shadow-[0_10px_20px_-16px_rgba(96,120,255,0.85)]">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold tracking-[-0.02em]">WA Pro CRM</p>
                <p className="text-xs text-slate-300">Operations workspace</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-5">
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition",
                          isActive
                            ? "bg-[#3b507e] text-white"
                            : "text-slate-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 px-4 py-4">
            {user && (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/12 bg-white/4 px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-sm font-bold uppercase">
                  {user.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-300">{user.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-[#d8deef] bg-white/95 backdrop-blur lg:ml-[272px]">
        <div className="flex h-[70px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-slate-900">
              {currentPage}
            </h1>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce4ff] text-xs font-bold uppercase text-[#4358d8]">
                {user.name[0]}
              </div>
            </div>
          )}
        </div>
      </header>

    </>
  );
}
