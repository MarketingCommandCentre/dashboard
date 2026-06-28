import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  LogIn,
} from 'lucide-react';

import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import { ApiStatusPill } from '@/components/ApiStatusPill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

const APP_VERSION = 'v2027';

interface NavItem {
  to: string;
  label: string;
  emoji: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/requests', label: 'Events & Requests', emoji: '📋' },
  { to: '/spreadsheet', label: 'Spreadsheet View', emoji: '🧾' },
  { to: '/kanban', label: 'Kanban Board', emoji: '🗂️' },
  { to: '/calendar', label: 'Calendar', emoji: '📅' },
  { to: '/analytics', label: 'Analytics', emoji: '📈' },
  { to: '/audit', label: 'Audit Log', emoji: '📜' },
  { to: '/workload', label: 'Workload', emoji: '👥' },
  { to: '/tools', label: 'Tools', emoji: '🛠️' },
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
          'app-gradient sticky top-0 z-30 hidden h-screen shrink-0 flex-col text-sidebar-foreground transition-[width] duration-300 md:flex',
          collapsed ? 'w-[80px]' : 'w-[280px]',
        )}
      >
        <div
          className={cn(
            'flex flex-col items-center gap-2 border-b border-white/10 px-6 py-7 text-center',
            collapsed && 'px-2 py-5',
          )}
        >
          <img
            src="/msa_logo_white.png"
            alt="UTM MSA"
            className={cn('shrink-0 rounded-full object-contain shadow-md', collapsed ? 'size-12' : 'size-[60px]')}
          />
          {!collapsed && (
            <>
              <h2 className="font-display text-lg font-semibold text-[var(--color-gold)]">UTM MSA Marketing</h2>
              <p className="font-arabic text-sm text-white/80" dir="rtl" lang="ar">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {NAV_ITEMS.map(({ to, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 border-l-[3px] px-6 py-3.5 text-sm font-medium transition-all duration-300',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'border-[var(--color-gold)] bg-[rgba(255,215,0,0.15)] text-[var(--color-gold)]'
                    : 'border-transparent text-white/80 hover:translate-x-1 hover:border-[var(--color-gold)] hover:bg-white/10 hover:text-white',
                )
              }
            >
              <span className="w-7 shrink-0 text-center text-xl">{emoji}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          {!collapsed && (
            <div className="mb-3 px-2 text-center">
              <p className="font-arabic text-base leading-relaxed text-white" dir="rtl" lang="ar">
                وَقُلِ ٱعْمَلُوا۟ فَسَيَرَى ٱللَّهُ عَمَلَكُمْ
              </p>
              <p className="mt-1 text-xs text-white/85">— At-Tawbah 9:105</p>
              <div className="version-badge mt-3 inline-block px-4 py-1.5 text-sm">{APP_VERSION}</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between gap-3 border-b border-border bg-card px-4 shadow-[var(--shadow-card)] lg:px-6">
          {/* Mobile nav (horizontal scroll) */}
          <nav className="flex items-center gap-1 overflow-x-auto md:hidden no-scrollbar">
            {NAV_ITEMS.map(({ to, emoji, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors',
                    isActive ? 'bg-[rgba(255,215,0,0.18)]' : 'hover:bg-muted',
                  )
                }
              >
                <span>{emoji}</span>
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
