import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Table,
  Columns3,
  Calendar,
  BarChart3,
  ScrollText,
  Users,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  LogIn,
  type LucideIcon,
} from 'lucide-react';

import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { ApiStatusPill } from '@/components/ApiStatusPill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

const APP_VERSION = '1.0.0';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/requests', label: 'Requests', icon: ClipboardList },
  { to: '/spreadsheet', label: 'Spreadsheet', icon: Table },
  { to: '/kanban', label: 'Kanban', icon: Columns3 },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit', label: 'Audit Log', icon: ScrollText },
  { to: '/workload', label: 'Workload', icon: Users },
  { to: '/tools', label: 'Tools', icon: Wrench },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { resolved, setTheme } = useTheme();
  const { user, isAuthenticated, login } = useAuth();

  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex min-h-screen w-full flex-1">
      {/* Sidebar */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col bg-sidebar-bg text-sidebar-foreground transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <img src="/msa_logo_white.png" alt="UTM MSA" className="size-9 shrink-0 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">UTM MSA Marketing</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60" dir="rtl" lang="ar">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 no-scrollbar">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          {!collapsed && (
            <div className="mb-2 px-2 text-[11px] leading-relaxed text-sidebar-foreground/55">
              <p dir="rtl" lang="ar" className="text-sm text-sidebar-foreground/70">
                وَقُلِ ٱعْمَلُوا۟ فَسَيَرَى ٱللَّهُ عَمَلَكُمْ
              </p>
              <p className="mt-0.5">— At-Tawbah 9:105</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>Collapse · v{APP_VERSION}</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:px-6">
          {/* Mobile nav (horizontal scroll) */}
          <nav className="flex items-center gap-1 overflow-x-auto md:hidden no-scrollbar">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )
                }
              >
                <Icon className="size-4.5" />
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <ApiStatusPill className="hidden sm:inline-flex" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {resolved === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            {isAuthenticated ? (
              <span className="hidden text-sm font-medium sm:inline" dir="rtl" lang="ar">
                السلام عليكم{user?.username ? `، ${user.username}` : ''}
              </span>
            ) : (
              <Button size="sm" onClick={login}>
                <LogIn className="size-4" />
                Login
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="section-shell">
            <AnimatedOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
