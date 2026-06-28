import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="History of every change made to requests." icon={ScrollText} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <ScrollText className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Audit Log — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
