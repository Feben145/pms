/**
 * Signature dashboard visualization: a single horizontal stacked bar
 * showing the portfolio's unit statuses (leased / vacant / reserved /
 * under maintenance / blocked) as proportional segments.
 *
 * Chosen over a generic pie/donut chart because a stacked bar reads
 * left-to-right the same way a "percentage of whole" sentence does --
 * it's the one chart type that maps directly onto how a property
 * manager already thinks about occupancy ("70% leased, rest vacant").
 */

interface Segment {
  label: string;
  value: number;
  className: string;
}

export function OccupancyBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="h-3 w-full rounded-full bg-muted" />
    );
  }

  return (
    <div>
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${s.className}`} />
            {s.label} <span className="font-tabular text-foreground font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
