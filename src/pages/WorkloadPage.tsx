import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function WorkloadPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Workload" description="Team capacity across designers and creators." icon={Users} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <Users className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Workload — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
