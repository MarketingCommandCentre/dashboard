import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventClickArg } from '@fullcalendar/core';
import { CalendarDays, Layers } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useRequests } from '@/hooks/useRequests';
import { useWorkload } from '@/hooks/useWorkload';
import { computeCycleWindows } from '@/lib/cycle';
import type { CycleInfo, Request } from '@/types';

import { CalendarLegend } from '@/features/calendar/CalendarLegend';
import { buildCycleBackgroundEvents, buildRequestEvents } from '@/features/calendar/events';
import '@/features/calendar/calendar.css';

export function CalendarPage() {
  const { data: requests = [], isLoading } = useRequests();
  const { data: cycleInfo } = useWorkload('cycle-info');

  const [cycleView, setCycleView] = useState(false);
  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestEvents = useMemo(() => buildRequestEvents(requests), [requests]);

  const cycleEvents = useMemo(() => {
    if (!cycleView) return [];
    const windows = computeCycleWindows((cycleInfo as CycleInfo | undefined) ?? null);
    return buildCycleBackgroundEvents(windows);
  }, [cycleView, cycleInfo]);

  const events = useMemo(() => [...requestEvents, ...cycleEvents], [requestEvents, cycleEvents]);

  const handleEventClick = (arg: EventClickArg) => {
    const channelID = arg.event.extendedProps.channelID as number | string | undefined;
    if (channelID === undefined) return; // background (cycle) events carry none
    const request = requests.find((req) => req.channelID === channelID);
    if (request) {
      setSelected(request);
      setDialogOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Calendar"
        description="Posting schedule across the month, colored by request status."
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <Label htmlFor="cycle-view-toggle" className="cursor-pointer text-sm">
              Cycle View
            </Label>
            <Switch id="cycle-view-toggle" checked={cycleView} onCheckedChange={setCycleView} />
          </div>
        }
      />

      <Card className="surface-card space-y-4 p-4 lg:p-6">
        <CalendarLegend showCycle={cycleView} />

        <div className="msa-calendar">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={events}
            eventClick={handleEventClick}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            dayMaxEvents={3}
            firstDay={0}
            eventDisplay="block"
          />
        </div>

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading requests…</p>
        )}
      </Card>

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
