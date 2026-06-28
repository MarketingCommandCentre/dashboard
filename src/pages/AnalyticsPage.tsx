import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Charts and metrics for marketing output." icon={BarChart3} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <BarChart3 className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Analytics — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
