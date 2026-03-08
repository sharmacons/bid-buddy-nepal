import { WorkScheduleItem } from './types';

export interface CriticalPathResult {
  criticalIds: Set<string>;
  totalFloat: Map<string, number>; // id -> float in weeks
}

/**
 * Compute Critical Path Method (CPM) for a set of work schedule items.
 * Uses forward + backward pass to identify zero-float activities.
 */
export function computeCriticalPath(items: WorkScheduleItem[]): CriticalPathResult {
  if (items.length === 0) return { criticalIds: new Set(), totalFloat: new Map() };

  const byId = new Map(items.map(i => [i.id, i]));

  // Forward pass: compute earliest start (ES) and earliest finish (EF)
  const ES = new Map<string, number>();
  const EF = new Map<string, number>();

  for (const item of items) {
    const deps = (item.dependencies || []).filter(d => byId.has(d));
    const es = deps.length > 0
      ? Math.max(...deps.map(d => EF.get(d) ?? (byId.get(d)!.startWeek + byId.get(d)!.duration - 1)))
      : item.startWeek - 1; // 0-based week
    ES.set(item.id, es);
    EF.set(item.id, es + item.duration);
  }

  // Project end
  const projectEnd = Math.max(...items.map(i => EF.get(i.id) ?? 0));

  // Build reverse dependency map (successors)
  const successors = new Map<string, string[]>();
  for (const item of items) {
    for (const dep of (item.dependencies || [])) {
      if (!successors.has(dep)) successors.set(dep, []);
      successors.get(dep)!.push(item.id);
    }
  }

  // Backward pass: compute latest finish (LF) and latest start (LS)
  const LF = new Map<string, number>();
  const LS = new Map<string, number>();

  // Process in reverse order
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const succs = (successors.get(item.id) || []).filter(s => byId.has(s));
    const lf = succs.length > 0
      ? Math.min(...succs.map(s => LS.get(s) ?? projectEnd))
      : projectEnd;
    LF.set(item.id, lf);
    LS.set(item.id, lf - item.duration);
  }

  // Total float = LS - ES (critical when float = 0)
  const totalFloat = new Map<string, number>();
  const criticalIds = new Set<string>();

  for (const item of items) {
    const float = (LS.get(item.id) ?? 0) - (ES.get(item.id) ?? 0);
    totalFloat.set(item.id, float);
    if (float <= 0) {
      criticalIds.add(item.id);
    }
  }

  // If all items are critical (simple sequential), keep it. 
  // If none are critical (parallel with slack), mark the longest chain.
  if (criticalIds.size === 0) {
    // Fallback: mark items on the longest path by duration
    let maxEnd = 0;
    let lastId = '';
    for (const item of items) {
      const ef = EF.get(item.id) ?? 0;
      if (ef >= maxEnd) {
        maxEnd = ef;
        lastId = item.id;
      }
    }
    // Trace back through dependencies
    const traced = new Set<string>();
    const trace = (id: string) => {
      traced.add(id);
      const item = byId.get(id);
      if (!item) return;
      for (const dep of (item.dependencies || [])) {
        if (byId.has(dep)) trace(dep);
      }
    };
    if (lastId) trace(lastId);
    return { criticalIds: traced, totalFloat };
  }

  return { criticalIds, totalFloat };
}
