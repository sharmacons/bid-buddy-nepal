import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { WorkScheduleItem } from '@/lib/types';
import { computeCriticalPath } from '@/lib/critical-path';

const GANTT_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 55%)',
  'hsl(200, 65%, 50%)',
  'hsl(170, 55%, 45%)',
  'hsl(140, 50%, 45%)',
  'hsl(30, 70%, 50%)',
  'hsl(350, 60%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(45, 70%, 50%)',
  'hsl(190, 60%, 45%)',
  'hsl(10, 65%, 50%)',
  'hsl(260, 50%, 55%)',
];

const CRITICAL_COLOR = 'hsl(0, 75%, 50%)'; // Red for critical path

interface GanttChartProps {
  items: WorkScheduleItem[];
  totalWeeks: number;
}

export default function GanttChart({ items, totalWeeks }: GanttChartProps) {
  const { data, months, criticalIds } = useMemo(() => {
    const maxWeek = totalWeeks || Math.max(...items.map(i => i.startWeek + i.duration - 1), 24);
    const months = Math.ceil(maxWeek / 4);

    const { criticalIds, totalFloat } = computeCriticalPath(items);

    const data = items.map((item, i) => ({
      id: item.id,
      name: item.activity.length > 28 ? item.activity.slice(0, 26) + '…' : item.activity,
      fullName: item.activity,
      start: item.startWeek - 1,
      duration: item.duration,
      isMajor: item.isMajor,
      isCritical: criticalIds.has(item.id),
      float: totalFloat.get(item.id) ?? 0,
      colorIndex: i % GANTT_COLORS.length,
      endWeek: item.startWeek + item.duration - 1,
      deps: item.dependencies?.length || 0,
    }));

    return { data: data.reverse(), months, criticalIds };
  }, [items, totalWeeks]);

  if (items.length === 0) return null;

  const chartHeight = Math.max(300, data.length * 36 + 80);
  const criticalCount = data.filter(d => d.isCritical).length;

  return (
    <div className="w-full space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: CRITICAL_COLOR, border: '2px solid hsl(0, 75%, 40%)' }} />
          Critical Path ({criticalCount} activities)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary opacity-70" />
          Non-Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
          ★ Major Activity
        </span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(600, months * 80) }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              barSize={20}
            >
              <XAxis
                type="number"
                domain={[0, months * 4]}
                tickFormatter={(v) => {
                  const m = Math.floor(v / 4) + 1;
                  return v % 4 === 0 ? `M${m}` : '';
                }}
                ticks={Array.from({ length: months + 1 }, (_, i) => i * 4)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Months', position: 'bottom', offset: 0, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={({ x, y, payload }: any) => {
                  const entry = data.find(d => d.name === payload.value);
                  const isCritical = entry?.isCritical;
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fontSize={11}
                      fill={isCritical ? 'hsl(0, 75%, 45%)' : 'hsl(var(--foreground))'}
                      fontWeight={isCritical ? 600 : 400}
                    >
                      {isCritical ? '🔴 ' : ''}{payload.value}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-popover-foreground">{d.fullName}</p>
                      <p className="text-muted-foreground">
                        Week {d.start + 1} → Week {d.endWeek} ({d.duration}w)
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Total Float: <span className={d.float <= 0 ? 'text-destructive font-semibold' : 'text-primary font-medium'}>
                          {d.float <= 0 ? '0 (Zero)' : `${d.float}w`}
                        </span>
                      </p>
                      {d.isCritical && (
                        <p className="text-destructive font-semibold mt-0.5">
                          ⚡ Critical Path — Zero Float
                        </p>
                      )}
                      {d.isMajor && !d.isCritical && (
                        <p className="text-primary font-medium mt-0.5">★ Major Activity</p>
                      )}
                      {d.deps > 0 && (
                        <p className="text-muted-foreground mt-0.5">
                          {d.deps} predecessor{d.deps > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {/* Invisible offset bar */}
              <Bar dataKey="start" stackId="gantt" fill="transparent" radius={0} />
              {/* Visible duration bar */}
              <Bar dataKey="duration" stackId="gantt" radius={[4, 4, 4, 4]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isCritical ? CRITICAL_COLOR : GANTT_COLORS[entry.colorIndex]}
                    opacity={entry.isCritical ? 1 : entry.isMajor ? 0.85 : 0.6}
                    stroke={entry.isCritical ? 'hsl(0, 75%, 35%)' : entry.isMajor ? GANTT_COLORS[entry.colorIndex] : 'none'}
                    strokeWidth={entry.isCritical ? 2 : entry.isMajor ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
