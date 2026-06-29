import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventClickArg } from '@fullcalendar/core';
import { Layers } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { useRequests } from '@/hooks/useRequests';
import type { Request } from '@/types';

import { CalendarLegend } from '@/features/calendar/CalendarLegend';
import { buildRequestEvents } from '@/features/calendar/events';
import { clearCycleHighlights, highlightCycles } from '@/features/calendar/cycleHighlight';
import '@/features/calendar/calendar.css';

export function CalendarPage() {
  const { data: requests = [], isLoading } = useRequests();

  const [cycleView, setCycleView] = useState(false);
  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);

  const events = useMemo(() => buildRequestEvents(requests), [requests]);

  // Hover-driven cycle highlighting (only while Cycle View is on).
  useEffect(() => {
    const root = calRef.current;
    if (!root || !cycleView) return;

    const onPointer = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const cell = target?.closest<HTMLElement>('.fc-daygrid-day[data-date]');
      const date = cell?.getAttribute('data-date');
      if (date && date !== hoveredRef.current) {
        hoveredRef.current = date;
        highlightCycles(root, date, shiftRef.current);
      }
    };
    const onLeave = () => {
      hoveredRef.current = null;
      clearCycleHighlights(root);
    };
    const onShift = (e: KeyboardEvent) => {
      if (e.key !== 'Shift') return;
      shiftRef.current = e.type === 'keydown';
      if (hoveredRef.current) highlightCycles(root, hoveredRef.current, shiftRef.current);
    };

    root.addEventListener('mouseover', onPointer);
    root.addEventListener('mouseleave', onLeave);
    window.addEventListener('keydown', onShift);
    window.addEventListener('keyup', onShift);

    return () => {
      root.removeEventListener('mouseover', onPointer);
      root.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('keydown', onShift);
      window.removeEventListener('keyup', onShift);
      hoveredRef.current = null;
      shiftRef.current = false;
      clearCycleHighlights(root);
    };
  }, [cycleView]);

  const handleEventClick = (arg: EventClickArg) => {
    const channelID = arg.event.extendedProps.channelID as number | string | undefined;
    if (channelID === undefined) return;
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
        emoji="📅"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CalendarLegend showCycle={cycleView} />
          {cycleView && (
            <span className="text-xs text-muted-foreground">
              Hover a day to highlight its cycle · hold <kbd className="rounded border border-border px-1">Shift</kbd> to reverse · scroll for more months
            </span>
          )}
        </div>

        <div ref={calRef} className={cn('msa-calendar', cycleView && 'cycle-active')}>
          {/* In cycle view render a continuous multi-month grid at natural
              (compact) row height, clipped to a scrollable viewport so 6-7 weeks
              are visible at once for following cycles across months. */}
          <div className={cn(cycleView && 'max-h-[620px] overflow-y-auto rounded-lg border border-border')}>
            <FullCalendar
              // Remount when toggling so the view switches cleanly.
              key={cycleView ? 'cycle' : 'single'}
              plugins={[dayGridPlugin]}
              initialView={cycleView ? 'cycleGrid' : 'dayGridMonth'}
              views={{
                cycleGrid: { type: 'dayGrid', duration: { months: 4 }, buttonText: '4 months' },
              }}
              height="auto"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
              dayMaxEvents={cycleView ? 1 : 3}
              firstDay={0}
              eventDisplay="block"
            />
          </div>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading requests…</p>
        )}
      </Card>

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
