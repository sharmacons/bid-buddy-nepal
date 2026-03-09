import { BOQItem, WorkScheduleItem } from './types';

// Keyword-based activity detection from BOQ descriptions
// Maps BOQ item keywords to construction activity categories with default durations
const ACTIVITY_PATTERNS: {
  keywords: string[];
  activity: string;
  defaultDurationWeeks: number;
  isMajor: boolean;
  order: number;
}[] = [
  // Top-level items that span full or early contract period
  { keywords: ['insurance', 'contractor all risk', 'car policy', 'third party'], activity: 'Insurance (Contractor All Risk)', defaultDurationWeeks: -1, isMajor: true, order: 0.1 }, // -1 = full contract period
  { keywords: ['camp', 'site office', 'temporary building', 'labour camp', 'labor camp'], activity: 'Camp Setup & Site Office', defaultDurationWeeks: 3, isMajor: true, order: 0.2 },
  { keywords: ['diversion', 'traffic diversion', 'traffic management', 'detour', 'bypass'], activity: 'Traffic Diversion & Management', defaultDurationWeeks: 3, isMajor: true, order: 0.3 },
  { keywords: ['preliminary', 'p/s', 'ps item', 'provisional sum', 'daywork', 'day work', 'contingency'], activity: 'Provisional Sum (PS) Items', defaultDurationWeeks: -1, isMajor: false, order: 0.4 }, // -1 = full contract period
  // Standard construction activities
  { keywords: ['mobilization', 'mobilisation', 'site clearance', 'clearing', 'grubbing', 'site preparation'], activity: 'Site Clearance & Mobilization', defaultDurationWeeks: 2, isMajor: true, order: 1 },
  { keywords: ['survey', 'setting out', 'staking'], activity: 'Survey & Setting Out', defaultDurationWeeks: 1, isMajor: false, order: 2 },
  { keywords: ['excavation', 'earthwork', 'earth work', 'cutting', 'roadway excavation'], activity: 'Earthwork — Excavation', defaultDurationWeeks: 6, isMajor: true, order: 3 },
  { keywords: ['embankment', 'fill', 'backfill', 'filling'], activity: 'Earthwork — Embankment / Fill', defaultDurationWeeks: 4, isMajor: true, order: 4 },
  { keywords: ['subgrade', 'sub-grade', 'subbase', 'sub-base', 'sub base'], activity: 'Sub-base Course', defaultDurationWeeks: 3, isMajor: true, order: 5 },
  { keywords: ['base course', 'granular base', 'aggregate base', 'wbm', 'water bound macadam'], activity: 'Base Course (Granular)', defaultDurationWeeks: 3, isMajor: true, order: 6 },
  { keywords: ['prime coat', 'tack coat', 'bituminous', 'asphalt', 'seal coat', 'premix carpet', 'dbm', 'surface dressing', 'blacktop'], activity: 'Bituminous Surface / Asphalt', defaultDurationWeeks: 3, isMajor: true, order: 7 },
  { keywords: ['concrete', 'rcc', 'reinforced', 'cement concrete', 'pcc'], activity: 'Concrete / RCC Works', defaultDurationWeeks: 4, isMajor: true, order: 8 },
  { keywords: ['reinforcement', 'rebar', 'steel bar', 'tor steel'], activity: 'Reinforcement Steel Works', defaultDurationWeeks: 3, isMajor: false, order: 9 },
  { keywords: ['formwork', 'shuttering', 'centering'], activity: 'Formwork / Shuttering', defaultDurationWeeks: 2, isMajor: false, order: 10 },
  { keywords: ['drain', 'drainage', 'side drain', 'cross drain', 'hume pipe', 'pipe culvert'], activity: 'Drainage Works', defaultDurationWeeks: 4, isMajor: true, order: 11 },
  { keywords: ['culvert', 'slab culvert', 'box culvert'], activity: 'Culvert Construction', defaultDurationWeeks: 4, isMajor: true, order: 12 },
  { keywords: ['bridge', 'span', 'abutment', 'pier', 'bearing'], activity: 'Bridge Construction', defaultDurationWeeks: 8, isMajor: true, order: 13 },
  { keywords: ['retaining wall', 'retaining', 'breast wall'], activity: 'Retaining Wall / Breast Wall', defaultDurationWeeks: 4, isMajor: false, order: 14 },
  { keywords: ['gabion', 'wire mesh', 'mattress'], activity: 'Gabion Wall / Protection', defaultDurationWeeks: 3, isMajor: false, order: 15 },
  { keywords: ['masonry', 'stone masonry', 'rubble'], activity: 'Stone Masonry Works', defaultDurationWeeks: 4, isMajor: false, order: 16 },
  { keywords: ['bioengineering', 'bio-engineering', 'grass', 'turfing', 'slope protection', 'plantation'], activity: 'Bio-Engineering / Slope Protection', defaultDurationWeeks: 2, isMajor: false, order: 17 },
  { keywords: ['guardrail', 'guard rail', 'road furniture', 'sign', 'signage', 'road marking', 'kilometer post', 'delineator'], activity: 'Road Furniture & Signage', defaultDurationWeeks: 1, isMajor: false, order: 18 },
  { keywords: ['painting', 'paint'], activity: 'Painting Works', defaultDurationWeeks: 1, isMajor: false, order: 19 },
  { keywords: ['demobilization', 'demobilisation', 'cleanup', 'clean up', 'defect', 'restoration'], activity: 'Demobilization & Cleanup', defaultDurationWeeks: 1, isMajor: false, order: 20 },
];

interface DetectedActivity {
  activity: string;
  durationWeeks: number;
  isMajor: boolean;
  order: number;
  matchedBoqItems: string[];
  totalAmount: number;
}

export function detectActivitiesFromBOQ(boqItems: BOQItem[]): DetectedActivity[] {
  const activityMap = new Map<string, DetectedActivity>();

  for (const item of boqItems) {
    const desc = item.description.toLowerCase();
    let matched = false;

    for (const pattern of ACTIVITY_PATTERNS) {
      if (pattern.keywords.some(kw => desc.includes(kw))) {
        const existing = activityMap.get(pattern.activity);
        if (existing) {
          existing.matchedBoqItems.push(item.description);
          existing.totalAmount += item.amount;
        } else {
          activityMap.set(pattern.activity, {
            activity: pattern.activity,
            durationWeeks: pattern.defaultDurationWeeks,
            isMajor: pattern.isMajor,
            order: pattern.order,
            matchedBoqItems: [item.description],
            totalAmount: item.amount,
          });
        }
        matched = true;
        break;
      }
    }

    // Unmatched items with high amount are flagged as major
    if (!matched && item.amount > 0) {
      const key = `Other: ${item.description}`;
      activityMap.set(key, {
        activity: item.description,
        durationWeeks: 2,
        isMajor: item.amount > (boqItems.reduce((s, i) => s + i.amount, 0) * 0.05), // >5% of total = major
        order: 99,
        matchedBoqItems: [item.description],
        totalAmount: item.amount,
      });
    }
  }

  return Array.from(activityMap.values()).sort((a, b) => a.order - b.order);
}

export function generateWorkSchedule(
  detectedActivities: DetectedActivity[],
  totalDurationWeeks: number,
): WorkScheduleItem[] {
  if (detectedActivities.length === 0) return [];

  // Scale durations to fit total project duration
  const rawTotal = detectedActivities.reduce((s, a) => s + a.durationWeeks, 0);
  const scaleFactor = rawTotal > 0 ? totalDurationWeeks / rawTotal : 1;

  // Build sequential schedule with overlaps for efficiency
  const schedule: WorkScheduleItem[] = [];
  let currentWeek = 1;

  for (let i = 0; i < detectedActivities.length; i++) {
    const act = detectedActivities[i];
    const scaledDuration = Math.max(1, Math.round(act.durationWeeks * scaleFactor));
    const itemId = crypto.randomUUID();

    // Each activity depends on its predecessor (sequential chain)
    const dependencies: string[] = [];
    if (i > 0) {
      dependencies.push(schedule[i - 1].id);
    }

    schedule.push({
      id: itemId,
      activity: act.activity,
      duration: scaledDuration,
      startWeek: currentWeek,
      isMajor: act.isMajor,
      dependencies,
    });

    // Overlap: next activity starts at ~60% of current for parallel work
    const overlap = Math.max(1, Math.round(scaledDuration * 0.6));
    currentWeek += overlap;

    // Don't exceed total duration
    if (currentWeek + 1 > totalDurationWeeks) {
      currentWeek = Math.max(1, totalDurationWeeks - scaledDuration);
    }
  }

  return schedule;
}
