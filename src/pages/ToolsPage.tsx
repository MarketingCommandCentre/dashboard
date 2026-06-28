import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Download,
  FlaskConical,
  Info,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Sun,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { API_URL, ApiError, getAuditEvents, getRequests } from '@/lib/api';
import { exportToCsv } from '@/lib/csv';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { APP_VERSION, BUILD_MODE, BUILD_TIME, IS_PRODUCTION } from '@/features/tools/buildInfo';

const intro = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

type TestStatus = 'ok' | 'error';

interface TestResult {
  title: string;
  status: TestStatus;
  httpStatus?: number;
  durationMs: number;
  summary: string;
  sample?: string;
}

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

export function ToolsPage() {
  const { theme, setTheme, resolved } = useTheme();
  const { user, currentUserId, isAuthenticated, logout } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState<'health' | 'requests' | null>(null);
  const [exporting, setExporting] = useState<'requests' | 'audit' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function runTest(kind: 'health' | 'requests') {
    setRunning(kind);
    setResult(null);
    const started = performance.now();
    try {
      const data = await getRequests();
      const durationMs = Math.round(performance.now() - started);
      if (kind === 'health') {
        setResult({
          title: 'API Health',
          status: 'ok',
          httpStatus: 200,
          durationMs,
          summary: `Connected to ${API_URL} — requests endpoint reachable.`,
        });
      } else {
        setResult({
          title: 'Requests Endpoint',
          status: 'ok',
          httpStatus: 200,
          durationMs,
          summary: `Received ${data.length} request${data.length === 1 ? '' : 's'}.`,
          sample: JSON.stringify(data.slice(0, 1), null, 2),
        });
      }
    } catch (err) {
      const durationMs = Math.round(performance.now() - started);
      const httpStatus = err instanceof ApiError ? err.status : undefined;
      const message = err instanceof Error ? err.message : String(err);
      setResult({
        title: kind === 'health' ? 'API Health' : 'Requests Endpoint',
        status: 'error',
        httpStatus,
        durationMs,
        summary: message,
      });
    } finally {
      setRunning(null);
    }
  }

  async function exportRequests() {
    setExporting('requests');
    setExportError(null);
    try {
      const rows = await getRequests();
      exportToCsv(
        `requests-${new Date().toISOString().slice(0, 10)}.csv`,
        rows as unknown as Record<string, unknown>[],
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(null);
    }
  }

  async function exportAudit() {
    setExporting('audit');
    setExportError(null);
    try {
      const rows = await getAuditEvents();
      exportToCsv(
        `audit-${new Date().toISOString().slice(0, 10)}.csv`,
        rows as unknown as Record<string, unknown>[],
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(null);
    }
  }

  return (
    <motion.div {...intro} className="space-y-6">
      <PageHeader title="Tools & Settings" description="Utilities, diagnostics, and preferences." icon={Wrench} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- API Testing ---------- */}
        <Card className="surface-card border">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" />
              API Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            <p className="text-sm text-muted-foreground">Verify the backend connection and inspect a live response.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runTest('health')} disabled={running !== null}>
                <Activity />
                {running === 'health' ? 'Testing…' : 'Test API Health'}
              </Button>
              <Button variant="outline" onClick={() => runTest('requests')} disabled={running !== null}>
                <Activity />
                {running === 'requests' ? 'Testing…' : 'Test Requests Endpoint'}
              </Button>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-4">
              {result === null ? (
                <p className="text-xs text-muted-foreground">No tests run yet. Results appear here.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={result.status === 'ok' ? 'default' : 'destructive'}>
                      {result.status === 'ok' ? 'OK' : 'ERROR'}
                    </Badge>
                    <span className="text-sm font-medium">{result.title}</span>
                    {result.httpStatus !== undefined && (
                      <span className="text-xs text-muted-foreground">HTTP {result.httpStatus}</span>
                    )}
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">{result.durationMs} ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{result.summary}</p>
                  {result.sample && (
                    <pre className="max-h-56 overflow-auto rounded-xl bg-background p-3 text-[11px] leading-relaxed">
                      {result.sample}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ---------- Export Data ---------- */}
        <Card className="surface-card border">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="flex items-center gap-2">
              <Download className="size-4 text-primary" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            <p className="text-sm text-muted-foreground">Download current data as CSV files.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportRequests} disabled={exporting !== null}>
                <Download />
                {exporting === 'requests' ? 'Exporting…' : 'Export Requests CSV'}
              </Button>
              <Button variant="outline" onClick={exportAudit} disabled={exporting !== null}>
                <Download />
                {exporting === 'audit' ? 'Exporting…' : 'Export Audit CSV'}
              </Button>
            </div>
            {exportError && <p className="text-xs text-destructive">{exportError}</p>}
          </CardContent>
        </Card>

        {/* ---------- Settings ---------- */}
        <Card className="surface-card border">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-4 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            <div>
              <Label className="text-sm font-semibold">Appearance</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Currently using <span className="font-semibold text-foreground">{resolved}</span> mode.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center transition-all',
                        active ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/60 hover:bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 items-center justify-center rounded-xl',
                          active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground',
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold">API URL</Label>
              <p className="mt-1 break-all rounded-xl bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                {API_URL}
              </p>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold">Signed-in User</Label>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {isAuthenticated && user ? (
                    <>
                      <p className="truncate text-sm font-medium">{user.username}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">ID: {currentUserId ?? '—'}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not signed in.</p>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={logout} disabled={!isAuthenticated}>
                  <LogOut />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- App Info ---------- */}
        <Card className="surface-card border">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              App Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="secondary">v{APP_VERSION}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Build mode</span>
              <span className="font-mono text-xs">{IS_PRODUCTION ? 'production' : BUILD_MODE}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Loaded at</span>
              <span className="font-mono text-xs">{BUILD_TIME}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">App</span>
              <span className="text-xs">UTM MSA Marketing Command Centre</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
