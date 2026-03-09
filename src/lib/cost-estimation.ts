/**
 * Cost Estimation utilities based on सार्वजनिक खरिद नियमावली (Public Procurement Regulations)
 * and PPMO Standard Bidding Document guidelines for Nepal.
 *
 * Methods:
 * 1. Engineer's Estimate (दर विश्लेषणमा आधारित) — Rate Analysis based
 * 2. Market Rate Method (बजार दर विधि)
 * 3. Reference Project Method (सन्दर्भ आयोजना विधि) — Similar project with price index adjustment
 * 4. Unit Cost Method (एकाइ लागत विधि) — Standard cost per unit (km, sq.m, etc.)
 * 5. Lump-Sum / Parametric Method (अनुमानित विधि)
 */

import { RATE_ANALYSIS_NORMS, RateAnalysisNorm } from './rate-analysis-norms';

// ═══════════════════════════════════════════
// ─── AUTO-RATE MATCHING ───
// ═══════════════════════════════════════════

/**
 * Fuzzy-match a BOQ description to the best matching rate analysis norm.
 * Returns the norm and a confidence score (0–1).
 */
export function matchBoqToNorm(description: string): { norm: RateAnalysisNorm | null; score: number } {
  const desc = description.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = desc.split(/\s+/).filter(w => w.length > 2);

  let bestNorm: RateAnalysisNorm | null = null;
  let bestScore = 0;

  for (const norm of RATE_ANALYSIS_NORMS) {
    const normDesc = norm.description.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const normWords = normDesc.split(/\s+/).filter(w => w.length > 2);

    // Exact substring match
    if (normDesc.includes(desc) || desc.includes(normDesc)) {
      const score = 0.95;
      if (score > bestScore) {
        bestScore = score;
        bestNorm = norm;
      }
      continue;
    }

    // Word overlap scoring
    const matchedWords = words.filter(w => normWords.some(nw => nw.includes(w) || w.includes(nw)));
    const score = words.length > 0 ? matchedWords.length / Math.max(words.length, normWords.length) : 0;

    if (score > bestScore) {
      bestScore = score;
      bestNorm = norm;
    }
  }

  return { norm: bestScore >= 0.3 ? bestNorm : null, score: bestScore };
}

/**
 * Given a list of BOQ descriptions, returns a map of description -> suggested rate
 * from rate analysis norms (using default material rates).
 */
export function autoFillRates(
  items: { id: string; description: string; unit: string }[]
): Map<string, { rate: number; normId: string; normDescription: string; confidence: number }> {
  const result = new Map<string, { rate: number; normId: string; normDescription: string; confidence: number }>();

  for (const item of items) {
    const { norm, score } = matchBoqToNorm(item.description);
    if (norm && score >= 0.3) {
      // Compute a basic rate from norm's material/labor/equipment defaults
      const materialCost = norm.materials.reduce((sum, m) => sum + m.quantity * getDefaultMaterialRate(m.materialId), 0);
      const laborCost = norm.labor.reduce((sum, l) => sum + l.quantity * getDefaultLaborRate(l.role), 0);
      const equipmentCost = norm.equipment.reduce((sum, eq) => sum + eq.quantity * getDefaultEquipmentRate(eq.equipment), 0);
      const subtotal = materialCost + laborCost + equipmentCost;
      const withOverhead = subtotal * 1.15; // 15% overhead + profit default

      result.set(item.id, {
        rate: Math.round(withOverhead * 100) / 100,
        normId: norm.id,
        normDescription: norm.description,
        confidence: score,
      });
    }
  }

  return result;
}

// Default material rates (rough Nepal market averages)
function getDefaultMaterialRate(materialId: string): number {
  const defaults: Record<string, number> = {
    cement: 850,
    sand: 3500,
    aggregate_20mm: 4000,
    aggregate_40mm: 3800,
    stone: 3500,
    brick: 12,
    steel_bar: 135,
    binding_wire: 180,
    timber: 45000,
    plywood: 3200,
    gi_sheet: 850,
    nail: 180,
    paint: 550,
    bitumen: 95,
    emulsion: 75,
    pcc_block: 45,
    gabion_wire: 120,
    geo_textile: 250,
    pvc_pipe: 350,
    hume_pipe_600: 4500,
    hume_pipe_900: 8500,
    water: 500,
    boulders: 2800,
    gravel: 2500,
    moorum: 1800,
  };
  return defaults[materialId] || 500;
}

function getDefaultLaborRate(role: string): number {
  const defaults: Record<string, number> = {
    'Skilled Mason': 1200,
    'Unskilled Labor': 800,
    'Semi-Skilled Labor': 950,
    'Bar Bender': 1100,
    'Carpenter': 1200,
    'Plumber': 1100,
    'Painter': 1050,
    'Electrician': 1200,
    'Operator': 1500,
    'Foreman': 1800,
  };
  return defaults[role] || 900;
}

function getDefaultEquipmentRate(equipment: string): number {
  const defaults: Record<string, number> = {
    'Concrete Mixer 0.5 cum': 3500,
    'Vibrator': 1500,
    'Water Pump': 1200,
    'Roller (8-10T)': 12000,
    'Excavator': 18000,
    'Loader': 14000,
    'Tipper Truck': 8000,
    'Bitumen Sprayer': 6000,
    'Hot Mix Plant': 45000,
    'Batching Plant': 35000,
    'Crane (10T)': 25000,
    'Compressor': 5000,
    'Grader': 15000,
  };
  return defaults[equipment] || 5000;
}

// ═══════════════════════════════════════════
// ─── COST ESTIMATION METHODS ───
// ═══════════════════════════════════════════

export interface CostEstimationResult {
  method: string;
  methodNe: string;
  estimatedCost: number;
  details: string;
  breakdown?: { label: string; amount: number }[];
}

/**
 * Method 1: Engineer's Estimate (दर विश्लेषण विधि)
 * Sum of (Qty × Rate) for all BOQ items + contingency + VAT
 */
export function engineersEstimate(
  items: { quantity: number; rate: number; amount: number }[],
  contingencyPercent: number = 5,
  vatPercent: number = 13,
  physicalContingency: number = 2.5,
): CostEstimationResult {
  const boqTotal = items.reduce((s, i) => s + (i.amount || i.quantity * i.rate), 0);
  const physicalContingencyAmt = boqTotal * (physicalContingency / 100);
  const contingencyAmt = boqTotal * (contingencyPercent / 100);
  const subtotal = boqTotal + physicalContingencyAmt + contingencyAmt;
  const vatAmt = subtotal * (vatPercent / 100);
  const total = subtotal + vatAmt;

  return {
    method: "Engineer's Estimate (Rate Analysis)",
    methodNe: 'दर विश्लेषणमा आधारित इन्जिनियर्स अनुमान',
    estimatedCost: Math.round(total),
    details: `BOQ Total + ${physicalContingency}% Physical + ${contingencyPercent}% Price Contingency + ${vatPercent}% VAT`,
    breakdown: [
      { label: 'BOQ Total (बिओक्यू जम्मा)', amount: Math.round(boqTotal) },
      { label: `Physical Contingency ${physicalContingency}%`, amount: Math.round(physicalContingencyAmt) },
      { label: `Price Contingency ${contingencyPercent}%`, amount: Math.round(contingencyAmt) },
      { label: `VAT ${vatPercent}%`, amount: Math.round(vatAmt) },
      { label: 'Estimated Cost (अनुमानित लागत)', amount: Math.round(total) },
    ],
  };
}

/**
 * Method 2: Reference Project Method (सन्दर्भ आयोजना विधि)
 * Adjust a known project cost using PPMO price index
 */
export function referenceProjectEstimate(
  referenceCost: number,
  referenceYear: number,
  currentYear: number,
  annualEscalation: number = 8, // avg Nepal construction inflation
  scopeAdjustment: number = 0, // +/- % for scope difference
): CostEstimationResult {
  const years = currentYear - referenceYear;
  const escalationFactor = Math.pow(1 + annualEscalation / 100, years);
  const adjustedCost = referenceCost * escalationFactor;
  const scopeAdj = adjustedCost * (scopeAdjustment / 100);
  const total = adjustedCost + scopeAdj;

  return {
    method: 'Reference Project Method',
    methodNe: 'सन्दर्भ आयोजना विधि',
    estimatedCost: Math.round(total),
    details: `Reference cost × (1+${annualEscalation}%)^${years} years ${scopeAdjustment !== 0 ? `+ ${scopeAdjustment}% scope adj.` : ''}`,
    breakdown: [
      { label: `Reference Cost (${referenceYear})`, amount: Math.round(referenceCost) },
      { label: `Escalation (${years} yrs @ ${annualEscalation}%/yr)`, amount: Math.round(adjustedCost - referenceCost) },
      ...(scopeAdjustment !== 0 ? [{ label: `Scope Adjustment ${scopeAdjustment}%`, amount: Math.round(scopeAdj) }] : []),
      { label: 'Estimated Cost (अनुमानित लागत)', amount: Math.round(total) },
    ],
  };
}

/**
 * Method 3: Unit Cost Method (एकाइ लागत विधि)
 * Standard cost per unit (e.g., per km of road, per sq.m of building)
 */
export const UNIT_COST_STANDARDS: {
  id: string;
  label: string;
  labelNe: string;
  unit: string;
  rates: { grade: string; costPerUnit: number }[];
}[] = [
  {
    id: 'road-blacktop',
    label: 'Blacktopped Road',
    labelNe: 'कालोपत्रे सडक',
    unit: 'per km',
    rates: [
      { grade: 'Terai (flat)', costPerUnit: 25_000_000 },
      { grade: 'Hill (moderate)', costPerUnit: 45_000_000 },
      { grade: 'Mountain (difficult)', costPerUnit: 75_000_000 },
    ],
  },
  {
    id: 'road-gravel',
    label: 'Gravel Road',
    labelNe: 'ग्राभेल सडक',
    unit: 'per km',
    rates: [
      { grade: 'Terai', costPerUnit: 8_000_000 },
      { grade: 'Hill', costPerUnit: 15_000_000 },
      { grade: 'Mountain', costPerUnit: 25_000_000 },
    ],
  },
  {
    id: 'bridge-rcc',
    label: 'RCC Bridge',
    labelNe: 'RCC पुल',
    unit: 'per running meter',
    rates: [
      { grade: 'Small (up to 20m)', costPerUnit: 2_500_000 },
      { grade: 'Medium (20-50m)', costPerUnit: 3_500_000 },
      { grade: 'Large (50m+)', costPerUnit: 5_000_000 },
    ],
  },
  {
    id: 'building-rcc',
    label: 'RCC Building',
    labelNe: 'RCC भवन',
    unit: 'per sq.m (plinth)',
    rates: [
      { grade: 'Basic Finish', costPerUnit: 28_000 },
      { grade: 'Standard Finish', costPerUnit: 38_000 },
      { grade: 'Premium Finish', costPerUnit: 55_000 },
    ],
  },
  {
    id: 'retaining-wall',
    label: 'Retaining Wall (Gabion)',
    labelNe: 'ग्याबियन पर्खाल',
    unit: 'per cum',
    rates: [
      { grade: 'Standard', costPerUnit: 8_500 },
      { grade: 'With Geo-textile', costPerUnit: 11_000 },
    ],
  },
  {
    id: 'irrigation-canal',
    label: 'Irrigation Canal (Lined)',
    labelNe: 'सिंचाइ नहर (लाइन्ड)',
    unit: 'per km',
    rates: [
      { grade: 'Small (<1 cumec)', costPerUnit: 6_000_000 },
      { grade: 'Medium (1-5 cumec)', costPerUnit: 15_000_000 },
    ],
  },
];

export function unitCostEstimate(
  standardId: string,
  gradeIndex: number,
  quantity: number,
  vatPercent: number = 13,
): CostEstimationResult {
  const standard = UNIT_COST_STANDARDS.find(s => s.id === standardId);
  if (!standard) {
    return { method: 'Unit Cost Method', methodNe: 'एकाइ लागत विधि', estimatedCost: 0, details: 'Standard not found' };
  }
  const grade = standard.rates[gradeIndex] || standard.rates[0];
  const subtotal = grade.costPerUnit * quantity;
  const vat = subtotal * (vatPercent / 100);
  const total = subtotal + vat;

  return {
    method: 'Unit Cost Method',
    methodNe: 'एकाइ लागत विधि',
    estimatedCost: Math.round(total),
    details: `${standard.label} (${grade.grade}) × ${quantity} ${standard.unit}`,
    breakdown: [
      { label: `${standard.label} — ${grade.grade}`, amount: grade.costPerUnit },
      { label: `Quantity (${standard.unit})`, amount: quantity },
      { label: 'Subtotal', amount: Math.round(subtotal) },
      { label: `VAT ${vatPercent}%`, amount: Math.round(vat) },
      { label: 'Estimated Cost (अनुमानित लागत)', amount: Math.round(total) },
    ],
  };
}

/**
 * Method 4: Comparative / Lump-Sum Parametric
 * User enters known parameters and the system calculates
 */
export function parametricEstimate(
  baseAmount: number,
  factors: { label: string; percent: number }[],
): CostEstimationResult {
  let running = baseAmount;
  const breakdown: { label: string; amount: number }[] = [
    { label: 'Base Amount (आधार रकम)', amount: Math.round(baseAmount) },
  ];

  for (const f of factors) {
    const add = running * (f.percent / 100);
    running += add;
    breakdown.push({ label: `${f.label} (${f.percent}%)`, amount: Math.round(add) });
  }

  breakdown.push({ label: 'Estimated Cost (अनुमानित लागत)', amount: Math.round(running) });

  return {
    method: 'Parametric / Lump-Sum Method',
    methodNe: 'अनुमानित / लम्पसम विधि',
    estimatedCost: Math.round(running),
    details: `Base amount with ${factors.length} adjustment factors`,
    breakdown,
  };
}
