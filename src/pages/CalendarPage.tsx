import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Layers, Scale } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { RequestDetailDialog } from '@/components/RequestDetailDialog';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';

import { useRequests, useUpdateRequest } from '@/hooks/useRequests';
import type { Request } from '@/types';

import { CalendarLegend } from '@/features/calendar/CalendarLegend';
import { buildRequestEvents } from '@/features/calendar/events';
import { clearCycleHighlights, highlightCycles } from '@/features/calendar/cycleHighlight';
import { buildLoadBalanceReport, dayLoadLevel } from '@/features/calendar/loadBalance';
import { LoadBalancePanel } from '@/features/calendar/LoadBalancePanel';
import '@/features/calendar/calendar.css';

interface MonthWindow {
  start: Date;
  end: Date;
  label: string;
}

export function CalendarPage() {
  const { data: requests = [], isLoading } = useRequests();
  const updateRequest = useUpdateRequest();

  const [cycleView, setCycleView] = useState(false);
  const [loadBalance, setLoadBalance] = useState(false);
  const [monthWindow, setMonthWindow] = useState<MonthWindow | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);

  const events = useMemo(() => buildRequestEvents(requests), [requests]);

  // LoadBalance™ report for the visible month (recomputed as posts move).
  const report = useMemo(() => {
    if (!loadBalance || !monthWindow) return null;
    return buildLoadBalanceReport(requests, monthWindow.start, monthWindow.end);
  }, [loadBalance, monthWindow, requests]);

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

  // Persist a drag-reschedule. Sends the full request with the new posting
  // date (the PUT endpoint replaces the record) through the authed API client;
  // on failure the event snaps back to its original day.
  const handleEventDrop = (info: EventDropArg) => {
    const channelID = info.event.extendedProps.channelID as number | string | undefined;
    const newDate = info.event.startStr; // all-day events: "yyyy-MM-dd"
    const request = requests.find((req) => req.channelID === channelID);

    if (!request || !newDate) {
      info.revert();
      return;
    }

    setSaveError(null);
    updateRequest.mutate(
      { channelId: request.channelID, data: { ...request, postingDate: newDate } },
      {
        onError: (error) => {
          info.revert();
          setSaveError(
            error instanceof ApiError
              ? `Could not reschedule "${request.title || 'request'}" (${error.status}).`
              : `Could not reschedule "${request.title || 'request'}".`,
          );
        },
      },
    );
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setMonthWindow({
      start: arg.view.currentStart,
      end: arg.view.currentEnd,
      label: arg.view.title,
    });
  };

  // Cycle View and LoadBalance are mutually exclusive modes.
  const toggleCycleView = (on: boolean) => {
    setCycleView(on);
    if (on) setLoadBalance(false);
  };
  const toggleLoadBalance = (on: boolean) => {
    setLoadBalance(on);
    setSaveError(null);
    if (on) setCycleView(false);
  };

  const dayCellClassNames = (arg: { date: Date }) => {
    if (!loadBalance || !report) return [];
    const key = localDateKey(arg.date);
    const level = dayLoadLevel(report.dayCounts[key] ?? 0);
    return level ? [`lb-heat-${level}`] : [];
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
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-muted-foreground" />
              <Label htmlFor="load-balance-toggle" className="cursor-pointer text-sm">
                LoadBalance™
              </Label>
              <Switch
                id="load-balance-toggle"
                checked={loadBalance}
                onCheckedChange={toggleLoadBalance}
              />
            </div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <Label htmlFor="cycle-view-toggle" className="cursor-pointer text-sm">
                Cycle View
              </Label>
              <Switch id="cycle-view-toggle" checked={cycleView} onCheckedChange={toggleCycleView} />
            </div>
          </div>
        }
      />

      <div className={cn(loadBalance && 'flex flex-col gap-6 lg:flex-row lg:items-start')}>
        <Card className="surface-card min-w-0 flex-1 space-y-4 p-4 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CalendarLegend showCycle={cycleView} />
            {cycleView && (
              <span className="text-xs text-muted-foreground">
                Hover a day to highlight its cycle · hold <kbd className="rounded border border-border px-1">Shift</kbd> to reverse · scroll for more months
              </span>
            )}
            {loadBalance && (
              <span className="text-xs text-muted-foreground">
                Drag a post to another day to reschedule it · darker days are busier
              </span>
            )}
          </div>

          <div
            ref={calRef}
            className={cn('msa-calendar', cycleView && 'cycle-active', loadBalance && 'lb-active')}
          >
            {/* In cycle view render a continuous multi-month grid at natural
                (compact) row height, clipped to a scrollable viewport so 6-7 weeks
                are visible at once for following cycles across months. */}
            <div className={cn(cycleView && 'max-h-[620px] overflow-y-auto rounded-lg border border-border')}>
              <FullCalendar
                // Remount when switching modes so the view swaps cleanly.
                key={cycleView ? 'cycle' : loadBalance ? 'load-balance' : 'single'}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView={cycleView ? 'cycleGrid' : 'dayGridMonth'}
                views={{
                  cycleGrid: { type: 'dayGrid', duration: { months: 4 }, buttonText: '4 months' },
                }}
                height="auto"
                events={events}
                eventClick={handleEventClick}
                editable={loadBalance}
                eventDurationEditable={false}
                eventDrop={handleEventDrop}
                datesSet={handleDatesSet}
                dayCellClassNames={dayCellClassNames}
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

        {loadBalance && report && monthWindow && (
          <LoadBalancePanel
            report={report}
            monthLabel={monthWindow.label}
            saving={updateRequest.isPending}
            error={saveError}
          />
        )}
      </div>

      <RequestDetailDialog request={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}

/** yyyy-MM-dd in local time (matches how posting dates are parsed). */
function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
