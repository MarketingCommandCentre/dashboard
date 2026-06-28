import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export function RequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Requests" description="Browse, filter and manage all marketing requests." icon={ClipboardList} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <ClipboardList className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Requests — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
