import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";

type Workspace = "client" | "creator" | "admin";

type WorkspaceNavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const workspaceMeta: Record<Workspace, {
  label: string;
  subtitle: string;
  accent: string;
  icon: typeof LayoutDashboard;
  nav: WorkspaceNavItem[];
}> = {
  client: {
    label: "Client Interface",
    subtitle: "Manage your creative work",
    accent: "from-[#0d56a7] to-[#1b75d0]",
    icon: Users,
    nav: [
      { label: "Overview", to: "/client", icon: LayoutDashboard, end: true },
      { label: "Find creators", to: "/search", icon: Search },
      { label: "Shortlist", to: "/client#shortlist", icon: Star },
      { label: "Bookings", to: "/client#bookings", icon: CalendarDays },
      { label: "Messages", to: "/messages", icon: MessageCircle },
      { label: "Payments", to: "/client#payments", icon: DollarSign },
      { label: "Help & settings", to: "/help", icon: Settings },
    ],
  },
  creator: {
    label: "Creator Interface",
    subtitle: "Grow your creative business",
    accent: "from-[#423068] to-[#7a57ba]",
    icon: Sparkles,
    nav: [
      { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
      { label: "Portfolio", to: "/portfolio/editor", icon: Package },
      { label: "Requests", to: "/dashboard#requests", icon: ClipboardList },
      { label: "Bookings", to: "/dashboard#bookings", icon: CalendarDays },
      { label: "Earnings", to: "/dashboard#earnings", icon: DollarSign },
      { label: "Verification", to: "/verification-terms", icon: ShieldCheck },
      { label: "Analytics", to: "/dashboard#analytics", icon: BarChart3 },
      { label: "Messages", to: "/messages", icon: MessageCircle },
      { label: "Profile settings", to: "/dashboard#profile", icon: Settings },
    ],
  },
  admin: {
    label: "Admin / Operations",
    subtitle: "Trust, safety and marketplace health",
    accent: "from-[#1d3c79] to-[#344c91]",
    icon: ShieldCheck,
    nav: [
      { label: "Operations overview", to: "/admin", icon: LayoutDashboard, end: true },
      { label: "User operations", to: "/admin/users", icon: Users },
      { label: "Verification queue", to: "/admin/verification", icon: CheckCircle2 },
      { label: "Content & reports", to: "/admin/content", icon: FileText },
      { label: "Payments & disputes", to: "/admin/payments", icon: DollarSign },
      { label: "Rankings & featured", to: "/admin/rankings", icon: Star },
      { label: "Help center", to: "/admin/messages", icon: CircleHelp },
      { label: "Settings & audit", to: "/admin/settings", icon: Settings },
    ],
  },
};

function initials(name?: string | null) {
  return (name || "CANECSU")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isNavItemActive(pathname: string, item: WorkspaceNavItem) {
  const itemPath = item.to.split("#")[0];
  if (item.end) return pathname === itemPath;
  return pathname === itemPath || (itemPath !== "/" && pathname.startsWith(itemPath + "/"));
}

export function WorkspaceShell({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: ReactNode;
}) {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = workspaceMeta[workspace];
  const WorkspaceIcon = meta.icon;

  const sidebar = (
    <aside className="flex h-full min-h-screen w-[270px] shrink-0 flex-col bg-gradient-to-b from-[#0c2b5e] via-[#102052] to-[#18143b] px-4 py-6 text-white">
      <div className="flex items-center gap-3 px-3 pb-7">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-base font-black shadow-lg", meta.accent)}>
          C
        </div>
        <div>
          <p className="font-heading text-base font-extrabold tracking-wide">CANECSU</p>
          <p className="text-[10px] text-blue-100/70">Creative marketplace</p>
        </div>
      </div>

      <div className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-100/60">Workspace</div>
      <div className="mb-7 rounded-xl border border-white/10 bg-white/[0.07] p-3">
        <div className="flex items-center gap-3">
          <div className={cn("grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br", meta.accent)}>
            <WorkspaceIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{meta.label}</p>
            <p className="truncate text-[10px] text-blue-100/65">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-100/60">Pages</div>
      <nav className="flex-1 space-y-1">
        {meta.nav.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-blue-100/75 transition-colors hover:bg-white/[0.08] hover:text-white"
              activeClassName="bg-gradient-to-r from-blue-400/30 to-purple-400/25 text-white shadow-[inset_3px_0_#63aeff]"
            >
              <ItemIcon className="h-[17px] w-[17px] shrink-0 opacity-90" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
            </NavLink>
          );
        })}
      </nav>

      <div className="my-5 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-[11px] leading-relaxed text-blue-100/70">
        <p className="mb-1 font-bold text-white">CANECSU workspace</p>
        {workspace === "admin"
          ? "Review trust, payments, content and support from one protected panel."
          : workspace === "creator"
            ? "Keep your work, requests, bookings and earnings connected."
            : "Find the right talent and keep every project on track."}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-pink-600 text-xs font-black">{initials(profile?.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{profile?.name || user?.email || "CANECSU user"}</p>
          <p className="truncate text-[10px] text-blue-100/60">{workspace === "admin" ? "Operations team" : profile?.type || "Member"}</p>
        </div>
        <button type="button" title="Sign out" onClick={() => void signOut()} className="rounded-lg p-2 text-blue-100/60 transition-colors hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );

  const activePage = meta.nav.find((item) => isNavItemActive(location.pathname, item));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:flex">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button type="button" aria-label="Close workspace menu" className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full shadow-2xl">{sidebar}</div>
        </div>
      )}
      <div className="flex min-h-screen flex-col lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-card/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open workspace menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">CANECSU <span className="px-1">/</span> <span className="font-semibold text-foreground">{meta.label}</span></p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{activePage?.label || "Overview"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/help" className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted sm:flex"><CircleHelp className="h-4 w-4 text-primary" /> Help</Link>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-sm hover:bg-muted" aria-label="Notifications">
              <span className="relative">♢<span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-primary" /></span>
            </button>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold">{profile?.name || "CANECSU user"}</p>
              <p className="text-[10px] text-muted-foreground">{workspace === "admin" ? "Operations" : profile?.type || "Member"}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-pink-600 text-xs font-black text-white md:hidden">{initials(profile?.name)}</div>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

