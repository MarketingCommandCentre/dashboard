import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  emoji,
  actions,
  className,
}: {
  title: string;
  description?: string;
  emoji?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {emoji && <span className="text-[1.75rem] leading-none">{emoji}</span>}
        <div>
          <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-primary dark:text-foreground">
            {title}
          </h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
