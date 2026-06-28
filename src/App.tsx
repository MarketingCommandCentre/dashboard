import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/AppShell';
import { LoginScreen } from '@/components/LoginScreen';

import { DashboardPage } from '@/pages/DashboardPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { SpreadsheetPage } from '@/pages/SpreadsheetPage';
import { KanbanPage } from '@/pages/KanbanPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AuditPage } from '@/pages/AuditPage';
import { WorkloadPage } from '@/pages/WorkloadPage';
import { ToolsPage } from '@/pages/ToolsPage';

const DEV_NO_AUTH = import.meta.env.VITE_DEV_NO_AUTH === 'true';

function AppInit() {
  useEffect(() => {
    const stored = localStorage.getItem('msa_theme') || 'system';
    const dark =
      stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);

    const splash = document.getElementById('splash');
    if (splash) {
      requestAnimationFrame(() => {
        splash.classList.add('done');
        setTimeout(() => splash.remove(), 600);
      });
    }
  }, []);
  return null;
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated && !DEV_NO_AUTH) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/spreadsheet" element={<SpreadsheetPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/workload" element={<WorkloadPage />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInit />
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
