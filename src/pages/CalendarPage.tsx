import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Posting schedule across the month." icon={Calendar} />
      <Card className="flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
        <Calendar className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Calendar — coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          This page is a stub. It will be implemented as part of the React rebuild.
        </p>
      </Card>
    </div>
  );
}
