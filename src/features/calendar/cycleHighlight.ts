import { cycleDateRange, cycleNumberForDate } from '@/lib/cycle';
import { parseLocalDate } from '@/lib/dates';

// Interactive cycle highlighting, ported from legacy/js/main-calendar.js.
// Hovering a day highlights three rolling 14-day windows relative to it:
//   normal:  hovered = Request, +1 = Production, +2 = Posting
//   shift:   hovered = Posting, -1 = Production, -2 = Request

const CYCLE_CLASSES = ['cycle-request', 'cycle-production', 'cycle-posting'] as const;

interface Segment {
  cycle: number;
  className: (typeof CYCLE_CLASSES)[number];
  label: string;
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function clearCycleHighlights(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.fc-daygrid-day').forEach((cell) => {
    cell.classList.remove(...CYCLE_CLASSES);
  });
  root.querySelectorAll('.cycle-label').forEach((el) => el.remove());
}

export function highlightCycles(root: HTMLElement, hoveredDate: string, shift: boolean): void {
  clearCycleHighlights(root);

  const date = parseLocalDate(hoveredDate);
  if (!date) return;
  const hovered = cycleNumberForDate(date);

  const segments: Segment[] = shift
    ? [
        { cycle: hovered, className: 'cycle-posting', label: 'Posting Window' },
        { cycle: hovered - 1, className: 'cycle-production', label: 'Production Window' },
        { cycle: hovered - 2, className: 'cycle-request', label: 'Request Window' },
      ]
    : [
        { cycle: hovered, className: 'cycle-request', label: 'Request Window' },
        { cycle: hovered + 1, className: 'cycle-production', label: 'Production Window' },
        { cycle: hovered + 2, className: 'cycle-posting', label: 'Posting Window' },
      ];

  for (const { cycle, className, label } of segments) {
    if (cycle < 0) continue; // nothing before the very first cycle
    const { start, end } = cycleDateRange(cycle);
    let labelPlaced = false;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cell = root.querySelector<HTMLElement>(`.fc-daygrid-day[data-date="${ymd(d)}"]`);
      if (!cell) continue; // day not in the visible month
      cell.classList.add(className);

      // Label the first visible day of each window.
      if (!labelPlaced) {
        const frame = cell.querySelector<HTMLElement>('.fc-daygrid-day-frame') ?? cell;
        const tag = document.createElement('div');
        tag.className = 'cycle-label';
        tag.textContent = label;
        frame.appendChild(tag);
        labelPlaced = true;
      }
    }
  }
}
