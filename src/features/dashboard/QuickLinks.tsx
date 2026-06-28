import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, ExternalLink } from 'lucide-react';

interface QuickLink {
  href: string;
  emoji: string;
  label: string;
}

const LINKS: QuickLink[] = [
  { href: 'https://www.lensbridge.tech/', emoji: '🔗', label: 'LensBridge' },
  {
    href: 'https://www.notion.so/utmmsa2023-24/25-26-20793a1f50b3802fa699ea4681c955b5',
    emoji: '🧭',
    label: 'MSA Notion',
  },
  {
    href: 'https://www.notion.so/utmmsa2023-24/Marketing-20793a1f50b38177a868e8bf46ba31ad',
    emoji: '🗂',
    label: 'Marketing',
  },
  { href: 'https://www.utm.utoronto.ca/registrar/dates', emoji: '📅', label: 'UTM Dates' },
  {
    href: 'https://calendar.google.com/calendar/u/0?cid=MWQwNDI2ODYwNzkwZWE5ODk1ZGQ3OWZjZTk5MTg0MmFlOWFhNDkyODM1NDJiNzJmMzg2MzJjM2Y3OWZmYjI5ZkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    emoji: '📆',
    label: 'Shared Cal',
  },
];

export function QuickLinks() {
  return (
    <Card className="surface-card flex h-full flex-col border">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-primary" />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 grid-cols-2 gap-2 p-5">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
          >
            <span className="text-base">{link.emoji}</span>
            <span className="flex-1 truncate">{link.label}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
