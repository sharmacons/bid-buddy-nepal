/**
 * Standard Rate Analysis Norms for Road, Bridge & Building Works
 * Based on DoR (Department of Roads) Nepal & DoLIDAR specifications
 */

export interface MaterialRequirement {
  materialId: string;
  material: string;
  unit: string;
  quantity: number; // per unit of work item
  wastageDefault: number; // default wastage % for this material
}

export interface LaborRequirement {
  role: string;
  unit: string;
  quantity: number; // per unit of work item
}

export interface EquipmentRequirement {
  equipment: string;
  unit: string;
  quantity: number; // per unit of work item
}

export interface RateAnalysisNorm {
  id: string;
  category: string;
  description: string;
  unit: string;
  materials: MaterialRequirement[];
  labor: LaborRequirement[];
  equipment: EquipmentRequirement[];
}

export interface MaterialRate {
  materialId: string;
  material: string;
  unit: string;
  marketRate: number;
}

export interface RateAnalysisResult {
  normId: string;
  description: string;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subtotal: number;
  overheadPercent: number;
  overheadAmount: number;
  wastagePercent: number;
  wastageAmount: number;
  totalRate: number;
  breakdown: {
    item: string;
    unit: string;
    quantity: number;
    rate: number;
    wastage: number;
    amount: number;
  }[];
}

// ── Standard Materials List ──
export const STANDARD_MATERIALS: MaterialRate[] = [
  { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', marketRate: 0 },
  { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'aggregate-40mm', material: 'Aggregate (40mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', marketRate: 0 },
  { materialId: 'bitumen-emulsion', material: 'Bitumen Emulsion', unit: 'litre', marketRate: 0 },
  { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', marketRate: 0 },
  { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', marketRate: 0 },
  { materialId: 'brick', material: 'Bricks (1st class)', unit: 'nos', marketRate: 0 },
  { materialId: 'water', material: 'Water', unit: 'litre', marketRate: 0 },
  { materialId: 'gabion-wire', material: 'Gabion Wire Mesh', unit: 'sq.m', marketRate: 0 },
  { materialId: 'pipe-hdpe', material: 'HDPE Pipe (various dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'diesel', material: 'Diesel', unit: 'litre', marketRate: 0 },
  { materialId: 'paint', material: 'Paint (road marking)', unit: 'litre', marketRate: 0 },
  { materialId: 'geo-textile', material: 'Geo-textile', unit: 'sq.m', marketRate: 0 },
];

// ── Standard Labor Rates (default, user can override) ──
export const STANDARD_LABOR: { role: string; unit: string; defaultRate: number }[] = [
  { role: 'Skilled Mason', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Carpenter', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Bar Bender', unit: 'day', defaultRate: 1100 },
  { role: 'Semi-skilled Labor', unit: 'day', defaultRate: 900 },
  { role: 'Unskilled Labor', unit: 'day', defaultRate: 750 },
  { role: 'Skilled Plumber', unit: 'day', defaultRate: 1200 },
  { role: 'Equipment Operator', unit: 'day', defaultRate: 1500 },
];

// ── Standard Equipment Rates ──
export const STANDARD_EQUIPMENT: { equipment: string; unit: string; defaultRate: number }[] = [
  { equipment: 'Excavator', unit: 'hr', defaultRate: 4500 },
  { equipment: 'Loader', unit: 'hr', defaultRate: 3500 },
  { equipment: 'Tipper Truck', unit: 'trip', defaultRate: 2500 },
  { equipment: 'Roller (8-10T)', unit: 'hr', defaultRate: 3000 },
  { equipment: 'Concrete Mixer', unit: 'hr', defaultRate: 800 },
  { equipment: 'Vibrator', unit: 'hr', defaultRate: 300 },
  { equipment: 'Asphalt Plant', unit: 'hr', defaultRate: 8000 },
  { equipment: 'Paver Finisher', unit: 'hr', defaultRate: 6000 },
  { equipment: 'Water Tanker', unit: 'trip', defaultRate: 2000 },
];

// ── DoR Standard Norms for Road & Bridge Works ──
export const RATE_ANALYSIS_NORMS: RateAnalysisNorm[] = [
  // ─── Earthwork ───
  {
    id: 'earthwork-excavation',
    category: 'Earthwork',
    description: 'Earthwork in excavation in ordinary soil (manual)',
    unit: 'cu.m',
    materials: [],
    labor: [
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.5 },
    ],
    equipment: [],
  },
  {
    id: 'earthwork-excavation-machine',
    category: 'Earthwork',
    description: 'Earthwork in excavation using excavator',
    unit: 'cu.m',
    materials: [
      { materialId: 'diesel', material: 'Diesel', unit: 'litre', quantity: 0.8, wastageDefault: 2 },
    ],
    labor: [
      { role: 'Equipment Operator', unit: 'day', quantity: 0.02 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [
      { equipment: 'Excavator', unit: 'hr', quantity: 0.05 },
    ],
  },
  {
    id: 'earthwork-fill',
    category: 'Earthwork',
    description: 'Earthwork in filling & compaction',
    unit: 'cu.m',
    materials: [
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 50, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.8 },
    ],
    equipment: [
      { equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.03 },
    ],
  },
  // ─── Sub-base & Base Course ───
  {
    id: 'granular-subbase',
    category: 'Sub-base & Base',
    description: 'Granular Sub-base (GSB) course',
    unit: 'cu.m',
    materials: [
      { materialId: 'aggregate-40mm', material: 'Aggregate (40mm)', unit: 'cu.m', quantity: 1.25, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 80, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.1 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.0 },
    ],
    equipment: [
      { equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.15 },
      { equipment: 'Water Tanker', unit: 'trip', quantity: 0.05 },
    ],
  },
  {
    id: 'wbm-base',
    category: 'Sub-base & Base',
    description: 'Water Bound Macadam (WBM) base course',
    unit: 'cu.m',
    materials: [
      { materialId: 'aggregate-40mm', material: 'Aggregate (40mm)', unit: 'cu.m', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 3 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 100, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.15 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.5 },
    ],
    equipment: [
      { equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.2 },
    ],
  },
  // ─── Pavement / Bituminous Work ───
  {
    id: 'prime-coat',
    category: 'Bituminous Work',
    description: 'Prime Coat (MC-30/MC-70)',
    unit: 'sq.m',
    materials: [
      { materialId: 'bitumen-emulsion', material: 'Bitumen Emulsion', unit: 'litre', quantity: 0.9, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Semi-skilled Labor', unit: 'day', quantity: 0.01 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.02 },
    ],
    equipment: [
      { equipment: 'Asphalt Plant', unit: 'hr', quantity: 0.002 },
    ],
  },
  {
    id: 'tack-coat',
    category: 'Bituminous Work',
    description: 'Tack Coat',
    unit: 'sq.m',
    materials: [
      { materialId: 'bitumen-emulsion', material: 'Bitumen Emulsion', unit: 'litre', quantity: 0.3, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Semi-skilled Labor', unit: 'day', quantity: 0.005 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.01 },
    ],
    equipment: [],
  },
  {
    id: 'dbm-50mm',
    category: 'Bituminous Work',
    description: 'Dense Bituminous Macadam (DBM) 50mm thick',
    unit: 'cu.m',
    materials: [
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.9, wastageDefault: 5 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.15, wastageDefault: 3 },
      { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', quantity: 50, wastageDefault: 2 },
      { materialId: 'diesel', material: 'Diesel', unit: 'litre', quantity: 10, wastageDefault: 2 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.2 },
      { role: 'Semi-skilled Labor', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.0 },
      { role: 'Equipment Operator', unit: 'day', quantity: 0.1 },
    ],
    equipment: [
      { equipment: 'Asphalt Plant', unit: 'hr', quantity: 0.1 },
      { equipment: 'Paver Finisher', unit: 'hr', quantity: 0.08 },
      { equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.15 },
    ],
  },
  {
    id: 'premix-carpet',
    category: 'Bituminous Work',
    description: 'Premix Carpet 20mm thick',
    unit: 'sq.m',
    materials: [
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.022, wastageDefault: 5 },
      { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', quantity: 1.7, wastageDefault: 2 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.01 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.05 },
    ],
    equipment: [
      { equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.01 },
    ],
  },
  // ─── Concrete Work ───
  {
    id: 'pcc-m10',
    category: 'Concrete Work',
    description: 'Plain Cement Concrete (PCC) M10 (1:3:6)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 4.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.9, wastageDefault: 3 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 0.5 },
    ],
  },
  {
    id: 'rcc-m20',
    category: 'Concrete Work',
    description: 'Reinforced Cement Concrete (RCC) M20 (1:1.5:3)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 80, wastageDefault: 3 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.0 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  // ─── Masonry ───
  {
    id: 'stone-masonry-cm-1-4',
    category: 'Masonry',
    description: 'Stone Masonry in cement mortar (1:4)',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 2.8, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.28, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 60, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
    ],
    equipment: [],
  },
  {
    id: 'brick-masonry-cm-1-4',
    category: 'Masonry',
    description: 'Brick Masonry in cement mortar (1:4)',
    unit: 'cu.m',
    materials: [
      { materialId: 'brick', material: 'Bricks (1st class)', unit: 'nos', quantity: 500, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 65, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.5 },
    ],
    equipment: [],
  },
  // ─── Drainage / Cross Drainage ───
  {
    id: 'gabion-wall',
    category: 'Drainage & Protection',
    description: 'Gabion Wall (including wire mesh & stone filling)',
    unit: 'cu.m',
    materials: [
      { materialId: 'gabion-wire', material: 'Gabion Wire Mesh', unit: 'sq.m', quantity: 3.0, wastageDefault: 5 },
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.1, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
    ],
    equipment: [],
  },
  {
    id: 'hume-pipe-culvert-600mm',
    category: 'Drainage & Protection',
    description: 'Hume Pipe Culvert (600mm dia) laying',
    unit: 'r.m',
    materials: [
      { materialId: 'pipe-hdpe', material: 'HDPE Pipe (various dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 2 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 1.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.1, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
    ],
    equipment: [
      { equipment: 'Excavator', unit: 'hr', quantity: 0.3 },
    ],
  },
  // ─── Bridge Work ───
  {
    id: 'rcc-m25-bridge',
    category: 'Bridge Work',
    description: 'RCC M25 for bridge deck/abutment',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 10.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.4, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.8, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 120, wastageDefault: 2 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 5, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 190, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 6.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },
  // ─── Road Furniture ───
  {
    id: 'road-marking',
    category: 'Road Furniture',
    description: 'Thermoplastic road marking',
    unit: 'sq.m',
    materials: [
      { materialId: 'paint', material: 'Paint (road marking)', unit: 'litre', quantity: 0.5, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.02 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.05 },
    ],
    equipment: [],
  },
];

/**
 * Calculate rate analysis for a given norm with user-provided rates
 */
export function calculateRateAnalysis(
  norm: RateAnalysisNorm,
  materialRates: Map<string, number>,
  laborRates: Map<string, number>,
  equipmentRates: Map<string, number>,
  overheadPercent: number,
  wastagePercent: number, // global additional wastage on top of material-specific
): RateAnalysisResult {
  const breakdown: RateAnalysisResult['breakdown'] = [];
  let materialCost = 0;
  let laborCost = 0;
  let equipmentCost = 0;

  // Materials
  for (const mat of norm.materials) {
    const rate = materialRates.get(mat.materialId) || 0;
    const effectiveWastage = mat.wastageDefault + wastagePercent;
    const wastageFactor = 1 + effectiveWastage / 100;
    const amount = mat.quantity * rate * wastageFactor;
    materialCost += amount;
    breakdown.push({
      item: `${mat.material}`,
      unit: mat.unit,
      quantity: mat.quantity,
      rate,
      wastage: effectiveWastage,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // Labor
  for (const lab of norm.labor) {
    const rate = laborRates.get(lab.role) || 0;
    const amount = lab.quantity * rate;
    laborCost += amount;
    breakdown.push({
      item: `👷 ${lab.role}`,
      unit: lab.unit,
      quantity: lab.quantity,
      rate,
      wastage: 0,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // Equipment
  for (const eq of norm.equipment) {
    const rate = equipmentRates.get(eq.equipment) || 0;
    const amount = eq.quantity * rate;
    equipmentCost += amount;
    breakdown.push({
      item: `🚜 ${eq.equipment}`,
      unit: eq.unit,
      quantity: eq.quantity,
      rate,
      wastage: 0,
      amount: Math.round(amount * 100) / 100,
    });
  }

  const subtotal = materialCost + laborCost + equipmentCost;
  const overheadAmount = subtotal * overheadPercent / 100;
  const wastageAmount = materialCost * wastagePercent / 100; // wastage already factored into material cost above
  const totalRate = subtotal + overheadAmount;

  return {
    normId: norm.id,
    description: norm.description,
    unit: norm.unit,
    materialCost: Math.round(materialCost * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    equipmentCost: Math.round(equipmentCost * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    overheadPercent,
    overheadAmount: Math.round(overheadAmount * 100) / 100,
    wastagePercent,
    wastageAmount: Math.round(wastageAmount * 100) / 100,
    totalRate: Math.round(totalRate * 100) / 100,
    breakdown,
  };
}
