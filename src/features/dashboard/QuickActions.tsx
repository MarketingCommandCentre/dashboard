import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, FileText, Calendar, RefreshCw } from 'lucide-react';

export function QuickActions({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Card className="surface-card border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-5">
        <Button variant="outline" className="justify-start" onClick={() => navigate('/requests')}>
          <FileText className="size-4" />
          View All Events
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate('/calendar')}>
          <Calendar className="size-4" />
          Open Calendar
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
