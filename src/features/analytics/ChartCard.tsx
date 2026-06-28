import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('surface-card flex flex-col rounded-xl border p-5', className)}>
      <header className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-primary" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
