import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tools" description="Utilities and bulk actions for marketing ops." icon={Wrench} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <Wrench className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Tools — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
