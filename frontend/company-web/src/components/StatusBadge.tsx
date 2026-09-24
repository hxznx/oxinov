import { statusLabel, type Status } from '@/content/site';

const tone: Record<Status, string> = {
  'in-development': 'text-success',
  'coming-soon': 'text-highlight',
  future: 'text-muted',
  'long-horizon': 'text-muted',
};

export function StatusBadge({ status, regulated = false }: { status: Status; regulated?: boolean }) {
  return (
    <span className={`hud-label inline-flex flex-wrap gap-2 ${tone[status]}`}>
      <span>// {statusLabel[status]}</span>
      {regulated ? <span className="text-warning">· Subject to regulatory approval</span> : null}
    </span>
  );
}
