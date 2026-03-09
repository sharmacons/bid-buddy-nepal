import { BOQItem, WorkScheduleItem } from './types';

export interface CashFlowMonth {
  month: number;
  label: string;
  planned: number;
  cumPlanned: number;
  advance?: number;
  ipc?: number;
  retention?: number;
  netPayment?: number;
}

export interface CashFlowQuarter {
  quarter: number;
  label: string;
  planned: number;
  cumPlanned: number;
  months: CashFlowMonth[];
}

export interface CashFlowProjection {
  months: CashFlowMonth[];
  quarters: CashFlowQuarter[];
  totalBudget: number;
  totalDurationMonths: number;
  sCurveData: { month: number; label: string; cumPlanned: number; cumPercent: number }[];
}

/**
 * Generate cash flow projection from BOQ items and work schedule.
 * Distributes BOQ costs across the schedule timeline using weighted allocation.
 */
export function generateCashFlowProjection(params: {
  boqItems: BOQItem[];
  workSchedule: WorkScheduleItem[];
  totalDurationWeeks: number;
  advancePercent?: number;     // mobilization advance (default 10%)
  retentionPercent?: number;   // retention money (default 5%)
}): CashFlowProjection {
  const {
    boqItems,
    workSchedule,
    totalDurationWeeks,
    advancePercent = 10,
    retentionPercent = 5,
  } = params;

  const totalBudget = boqItems.reduce((s, item) => s + item.amount, 0);
  const totalDurationMonths = Math.ceil(totalDurationWeeks / 4);

  // Create monthly buckets
  const months: CashFlowMonth[] = [];
  for (let m = 1; m <= totalDurationMonths; m++) {
    months.push({
      month: m,
      label: `Month ${m}`,
      planned: 0,
      cumPlanned: 0,
    });
  }

  if (workSchedule.length > 0 && totalBudget > 0) {
    // Distribute costs based on work schedule activities
    // Each activity gets a share of total budget proportional to its duration
    const totalActivityWeeks = workSchedule.reduce((s, ws) => s + ws.duration, 0);

    workSchedule.forEach(ws => {
      const activityBudget = (ws.duration / totalActivityWeeks) * totalBudget;
      const startMonth = Math.ceil(ws.startWeek / 4);
      const endWeek = ws.startWeek + ws.duration - 1;
      const endMonth = Math.ceil(endWeek / 4);

      // Distribute activity budget across its months with S-curve weighting
      const activityMonths = Math.max(endMonth - startMonth + 1, 1);
      for (let m = startMonth; m <= endMonth && m <= totalDurationMonths; m++) {
        // Bell curve distribution within activity
        const pos = (m - startMonth) / activityMonths;
        const weight = Math.sin(pos * Math.PI + 0.3) + 0.5;
        const monthIdx = m - 1;
        if (monthIdx >= 0 && monthIdx < months.length) {
          months[monthIdx].planned += activityBudget / activityMonths * weight;
        }
      }
    });

    // Normalize to match total budget
    const rawTotal = months.reduce((s, m) => s + m.planned, 0);
    if (rawTotal > 0) {
      const factor = totalBudget / rawTotal;
      months.forEach(m => m.planned = Math.round(m.planned * factor));
    }
  } else {
    // Simple S-curve distribution if no schedule
    months.forEach((m, i) => {
      const t = (i + 0.5) / totalDurationMonths;
      // S-curve: cumulative normal-ish distribution
      const cumWeight = 1 / (1 + Math.exp(-10 * (t - 0.5)));
      const prevCum = i > 0 ? 1 / (1 + Math.exp(-10 * ((i - 0.5) / totalDurationMonths - 0.5))) : 0;
      m.planned = Math.round(totalBudget * (cumWeight - prevCum));
    });
  }

  // Fix rounding difference
  const diff = totalBudget - months.reduce((s, m) => s + m.planned, 0);
  if (months.length > 0) months[months.length - 1].planned += diff;

  // Calculate cumulative and payment details
  let cumPlanned = 0;
  const advance = Math.round(totalBudget * advancePercent / 100);

  months.forEach((m, i) => {
    cumPlanned += m.planned;
    m.cumPlanned = cumPlanned;
    m.advance = i === 0 ? advance : 0;
    m.retention = Math.round(m.planned * retentionPercent / 100);
    // Advance recovery spread over first 50% of months
    const recoveryMonths = Math.ceil(totalDurationMonths * 0.5);
    const advanceRecovery = i > 0 && i <= recoveryMonths ? Math.round(advance / recoveryMonths) : 0;
    m.ipc = m.planned;
    m.netPayment = m.planned - (m.retention || 0) - advanceRecovery + (m.advance || 0);
  });

  // Group into quarters
  const quarters: CashFlowQuarter[] = [];
  const numQuarters = Math.ceil(totalDurationMonths / 3);
  for (let q = 0; q < numQuarters; q++) {
    const qMonths = months.slice(q * 3, q * 3 + 3);
    const qPlanned = qMonths.reduce((s, m) => s + m.planned, 0);
    const lastMonth = qMonths[qMonths.length - 1];
    quarters.push({
      quarter: q + 1,
      label: `Q${q + 1}`,
      planned: qPlanned,
      cumPlanned: lastMonth?.cumPlanned || 0,
      months: qMonths,
    });
  }

  // S-curve data
  const sCurveData = months.map(m => ({
    month: m.month,
    label: m.label,
    cumPlanned: m.cumPlanned,
    cumPercent: totalBudget > 0 ? Math.round(m.cumPlanned / totalBudget * 100 * 10) / 10 : 0,
  }));

  return { months, quarters, totalBudget, totalDurationMonths, sCurveData };
}
