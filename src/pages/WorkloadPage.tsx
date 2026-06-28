import { Megaphone, Palette, Users, Video } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { WorkloadSection } from '@/features/workload/WorkloadSection';
import { CyclePanel } from '@/features/workload/CyclePanel';

export function WorkloadPage() {
  return (
    <div className="section-shell space-y-6">
      <PageHeader
        title="Workload"
        description="Team capacity across managers, designers, and creators."
        icon={Users}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkloadSection
          kind="social-media-managers"
          title="Social Media Managers"
          icon={Megaphone}
          delay={0.05}
        />
        <WorkloadSection
          kind="graphic-designers"
          title="Graphic Designers"
          icon={Palette}
          delay={0.1}
        />
        <WorkloadSection
          kind="content-creators"
          title="Content Creators"
          icon={Video}
          delay={0.15}
        />
      </div>

      <CyclePanel delay={0.2} />
    </div>
  );
}
