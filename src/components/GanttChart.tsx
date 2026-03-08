import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WorkScheduleItem } from '@/lib/types';

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

interface GanttChartProps {
  items: WorkScheduleItem[];
  totalWeeks: number;
}

export default function GanttChart({ items, totalWeeks }: GanttChartProps) {
  const { data, months } = useMemo(() => {
    const maxWeek = totalWeeks || Math.max(...items.map(i => i.startWeek + i.duration - 1), 24);
    const months = Math.ceil(maxWeek / 4);

    const data = items.map((item, i) => ({
      name: item.activity.length > 28 ? item.activity.slice(0, 26) + '…' : item.activity,
      fullName: item.activity,
      start: item.startWeek - 1, // offset (invisible)
      duration: item.duration,
      isMajor: item.isMajor,
      colorIndex: i % GANTT_COLORS.length,
      endWeek: item.startWeek + item.duration - 1,
    }));

    return { data: data.reverse(), months }; // reverse so first activity is at top
  }, [items, totalWeeks]);

  if (items.length === 0) return null;

  const chartHeight = Math.max(300, data.length * 36 + 60);

  return (
    <div className="w-full overflow-x-auto">
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
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
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
                    {d.isMajor && <p className="text-primary font-medium mt-0.5">★ Major Activity</p>}
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
                  fill={GANTT_COLORS[entry.colorIndex]}
                  opacity={entry.isMajor ? 1 : 0.7}
                  stroke={entry.isMajor ? GANTT_COLORS[entry.colorIndex] : 'none'}
                  strokeWidth={entry.isMajor ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
