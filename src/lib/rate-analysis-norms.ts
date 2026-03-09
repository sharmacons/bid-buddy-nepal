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
  { materialId: 'fine-sand', material: 'Sand (fine/plastering)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'aggregate-10mm', material: 'Aggregate (10mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'aggregate-40mm', material: 'Aggregate (40mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'dressed-stone', material: 'Dressed Stone', unit: 'cu.m', marketRate: 0 },
  { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', marketRate: 0 },
  { materialId: 'bitumen-emulsion', material: 'Bitumen Emulsion', unit: 'litre', marketRate: 0 },
  { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', marketRate: 0 },
  { materialId: 'structural-steel', material: 'Structural Steel Section', unit: 'kg', marketRate: 0 },
  { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', marketRate: 0 },
  { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', marketRate: 0 },
  { materialId: 'brick', material: 'Bricks (1st class)', unit: 'nos', marketRate: 0 },
  { materialId: 'water', material: 'Water', unit: 'litre', marketRate: 0 },
  { materialId: 'gabion-wire', material: 'Gabion Wire Mesh', unit: 'sq.m', marketRate: 0 },
  { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', marketRate: 0 },
  { materialId: 'pipe-hdpe', material: 'HDPE Pipe (various dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'pipe-gi', material: 'GI Pipe (various dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'pipe-pvc', material: 'PVC Pipe (various dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'hume-pipe-600', material: 'Hume Pipe (600mm dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'hume-pipe-900', material: 'Hume Pipe (900mm dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'hume-pipe-1200', material: 'Hume Pipe (1200mm dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'diesel', material: 'Diesel', unit: 'litre', marketRate: 0 },
  { materialId: 'paint', material: 'Paint (road marking)', unit: 'litre', marketRate: 0 },
  { materialId: 'enamel-paint', material: 'Enamel Paint', unit: 'litre', marketRate: 0 },
  { materialId: 'primer', material: 'Primer/Putty', unit: 'litre', marketRate: 0 },
  { materialId: 'distemper', material: 'Distemper/Acrylic Paint', unit: 'litre', marketRate: 0 },
  { materialId: 'geo-textile', material: 'Geo-textile', unit: 'sq.m', marketRate: 0 },
  { materialId: 'waterproof-compound', material: 'Waterproofing Compound', unit: 'kg', marketRate: 0 },
  { materialId: 'bitumen-felt', material: 'Bitumen Felt', unit: 'sq.m', marketRate: 0 },
  { materialId: 'tile-ceramic', material: 'Ceramic Floor Tile', unit: 'sq.m', marketRate: 0 },
  { materialId: 'tile-wall', material: 'Wall Tile (glazed)', unit: 'sq.m', marketRate: 0 },
  { materialId: 'tile-adhesive', material: 'Tile Adhesive', unit: 'kg', marketRate: 0 },
  { materialId: 'gi-sheet', material: 'GI Corrugated Sheet (0.5mm)', unit: 'sq.m', marketRate: 0 },
  { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', marketRate: 0 },
  { materialId: 'door-frame-sal', material: 'Door Frame (Sal wood)', unit: 'cu.ft', marketRate: 0 },
  { materialId: 'glass-5mm', material: 'Glass (5mm plain)', unit: 'sq.m', marketRate: 0 },
  { materialId: 'aluminium-section', material: 'Aluminium Section', unit: 'kg', marketRate: 0 },
  { materialId: 'electric-wire', material: 'Electric Wire (1.5 sq.mm)', unit: 'r.m', marketRate: 0 },
  { materialId: 'pvc-conduit', material: 'PVC Conduit Pipe (20mm)', unit: 'r.m', marketRate: 0 },
  { materialId: 'switch-socket', material: 'Switch/Socket Point', unit: 'nos', marketRate: 0 },
  { materialId: 'bearing-pad', material: 'Elastomeric Bearing Pad', unit: 'nos', marketRate: 0 },
  { materialId: 'expansion-joint', material: 'Expansion Joint Material', unit: 'r.m', marketRate: 0 },
  { materialId: 'prestress-cable', material: 'Prestressing Cable/Strand', unit: 'kg', marketRate: 0 },
  { materialId: 'soling-stone', material: 'Soling Stone (150mm)', unit: 'cu.m', marketRate: 0 },
  { materialId: 'rcc-pipe-300', material: 'RCC Pipe (300mm dia)', unit: 'r.m', marketRate: 0 },
  { materialId: 'manhole-cover', material: 'CI Manhole Cover', unit: 'nos', marketRate: 0 },
];

// ── Standard Labor Rates (default, user can override) ──
export const STANDARD_LABOR: { role: string; unit: string; defaultRate: number }[] = [
  { role: 'Skilled Mason', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Carpenter', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Bar Bender', unit: 'day', defaultRate: 1100 },
  { role: 'Skilled Painter', unit: 'day', defaultRate: 1100 },
  { role: 'Skilled Plumber', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Electrician', unit: 'day', defaultRate: 1200 },
  { role: 'Skilled Tiler', unit: 'day', defaultRate: 1100 },
  { role: 'Skilled Welder', unit: 'day', defaultRate: 1300 },
  { role: 'Semi-skilled Labor', unit: 'day', defaultRate: 900 },
  { role: 'Unskilled Labor', unit: 'day', defaultRate: 750 },
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
  { equipment: 'Crane (10T)', unit: 'hr', defaultRate: 5000 },
  { equipment: 'Batching Plant', unit: 'hr', defaultRate: 6000 },
  { equipment: 'Pile Driving Rig', unit: 'hr', defaultRate: 8000 },
  { equipment: 'Concrete Pump', unit: 'hr', defaultRate: 4000 },
  { equipment: 'Bar Cutting Machine', unit: 'hr', defaultRate: 400 },
  { equipment: 'Bar Bending Machine', unit: 'hr', defaultRate: 400 },
  { equipment: 'Generator Set', unit: 'hr', defaultRate: 1500 },
];

// ── DoR/DoLIDAR/NBC Standard Norms for Road, Bridge, Building & Other Works ──
export const RATE_ANALYSIS_NORMS: RateAnalysisNorm[] = [
  // ═══════════════════════════════════════════
  // ─── EARTHWORK ───
  // ═══════════════════════════════════════════
  {
    id: 'earthwork-excavation',
    category: 'Earthwork',
    description: 'Earthwork in excavation in ordinary soil (manual)',
    unit: 'cu.m',
    materials: [],
    labor: [{ role: 'Unskilled Labor', unit: 'day', quantity: 1.5 }],
    equipment: [],
  },
  {
    id: 'earthwork-excavation-hard',
    category: 'Earthwork',
    description: 'Earthwork in excavation in hard rock (manual with blasting)',
    unit: 'cu.m',
    materials: [],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.0 },
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
    equipment: [{ equipment: 'Excavator', unit: 'hr', quantity: 0.05 }],
  },
  {
    id: 'earthwork-fill',
    category: 'Earthwork',
    description: 'Earthwork in filling & compaction',
    unit: 'cu.m',
    materials: [
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 50, wastageDefault: 5 },
    ],
    labor: [{ role: 'Unskilled Labor', unit: 'day', quantity: 0.8 }],
    equipment: [{ equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.03 }],
  },
  {
    id: 'foundation-trench',
    category: 'Earthwork',
    description: 'Foundation trench excavation for building',
    unit: 'cu.m',
    materials: [],
    labor: [{ role: 'Unskilled Labor', unit: 'day', quantity: 1.8 }],
    equipment: [],
  },
  {
    id: 'sand-filling',
    category: 'Earthwork',
    description: 'Sand filling under floor/foundation',
    unit: 'cu.m',
    materials: [
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 40, wastageDefault: 5 },
    ],
    labor: [{ role: 'Unskilled Labor', unit: 'day', quantity: 0.5 }],
    equipment: [],
  },
  {
    id: 'soling-work',
    category: 'Earthwork',
    description: 'Soling with stone (150mm thick)',
    unit: 'cu.m',
    materials: [
      { materialId: 'soling-stone', material: 'Soling Stone (150mm)', unit: 'cu.m', quantity: 1.25, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.0 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── SUB-BASE & BASE COURSE ───
  // ═══════════════════════════════════════════
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
    equipment: [{ equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.2 }],
  },

  // ═══════════════════════════════════════════
  // ─── BITUMINOUS WORK ───
  // ═══════════════════════════════════════════
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
    equipment: [{ equipment: 'Asphalt Plant', unit: 'hr', quantity: 0.002 }],
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
    equipment: [{ equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.01 }],
  },
  {
    id: 'seal-coat',
    category: 'Bituminous Work',
    description: 'Seal Coat (surface dressing)',
    unit: 'sq.m',
    materials: [
      { materialId: 'aggregate-10mm', material: 'Aggregate (10mm)', unit: 'cu.m', quantity: 0.012, wastageDefault: 5 },
      { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', quantity: 1.2, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Semi-skilled Labor', unit: 'day', quantity: 0.008 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.03 },
    ],
    equipment: [{ equipment: 'Roller (8-10T)', unit: 'hr', quantity: 0.008 }],
  },

  // ═══════════════════════════════════════════
  // ─── CONCRETE WORK ───
  // ═══════════════════════════════════════════
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
    id: 'pcc-m15',
    category: 'Concrete Work',
    description: 'Plain Cement Concrete (PCC) M15 (1:2:4)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 6.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.6 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.5 },
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
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.2, wastageDefault: 5 },
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
  {
    id: 'rcc-m25',
    category: 'Concrete Work',
    description: 'Reinforced Cement Concrete (RCC) M25',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 10.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.4, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.8, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 100, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.5, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'rcc-m30',
    category: 'Concrete Work',
    description: 'Reinforced Cement Concrete (RCC) M30',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 11.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.38, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.76, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 110, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.6, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.2 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 6.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },

  // ═══════════════════════════════════════════
  // ─── FORMWORK ───
  // ═══════════════════════════════════════════
  {
    id: 'formwork-foundation',
    category: 'Formwork',
    description: 'Formwork for foundation/footing',
    unit: 'sq.m',
    materials: [
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 0.5, wastageDefault: 10 },
      { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', quantity: 1.1, wastageDefault: 15 },
      { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', quantity: 0.25, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.4 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.3 },
    ],
    equipment: [],
  },
  {
    id: 'formwork-column',
    category: 'Formwork',
    description: 'Formwork for columns',
    unit: 'sq.m',
    materials: [
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 0.6, wastageDefault: 10 },
      { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', quantity: 1.15, wastageDefault: 15 },
      { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', quantity: 0.3, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.35 },
    ],
    equipment: [],
  },
  {
    id: 'formwork-beam-slab',
    category: 'Formwork',
    description: 'Formwork for beam & slab (with propping)',
    unit: 'sq.m',
    materials: [
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 0.8, wastageDefault: 10 },
      { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', quantity: 1.15, wastageDefault: 15 },
      { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', quantity: 0.35, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.6 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.4 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── MASONRY ───
  // ═══════════════════════════════════════════
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
    id: 'stone-masonry-cm-1-6',
    category: 'Masonry',
    description: 'Stone Masonry in cement mortar (1:6)',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 2.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 55, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
    ],
    equipment: [],
  },
  {
    id: 'dressed-stone-masonry',
    category: 'Masonry',
    description: 'Dressed Stone Masonry in cement mortar (1:4)',
    unit: 'cu.m',
    materials: [
      { materialId: 'dressed-stone', material: 'Dressed Stone', unit: 'cu.m', quantity: 1.15, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 2.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.25, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 55, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.5 },
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
  {
    id: 'brick-masonry-cm-1-6',
    category: 'Masonry',
    description: 'Brick Masonry in cement mortar (1:6)',
    unit: 'cu.m',
    materials: [
      { materialId: 'brick', material: 'Bricks (1st class)', unit: 'nos', quantity: 500, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 2.2, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.33, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 60, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.5 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── PLASTERING & FINISHING ───
  // ═══════════════════════════════════════════
  {
    id: 'plaster-12mm-1-4',
    category: 'Plastering & Finishing',
    description: 'Cement plaster 12mm thick (1:4)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.22, wastageDefault: 5 },
      { materialId: 'fine-sand', material: 'Sand (fine/plastering)', unit: 'cu.m', quantity: 0.016, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 4, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.15 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },
  {
    id: 'plaster-20mm-1-4',
    category: 'Plastering & Finishing',
    description: 'Cement plaster 20mm thick (1:4)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.36, wastageDefault: 5 },
      { materialId: 'fine-sand', material: 'Sand (fine/plastering)', unit: 'cu.m', quantity: 0.025, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 6, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.18 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.12 },
    ],
    equipment: [],
  },
  {
    id: 'plaster-ceiling',
    category: 'Plastering & Finishing',
    description: 'Cement plaster on ceiling 12mm (1:3)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.28, wastageDefault: 5 },
      { materialId: 'fine-sand', material: 'Sand (fine/plastering)', unit: 'cu.m', quantity: 0.014, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 4, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.22 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.15 },
    ],
    equipment: [],
  },
  {
    id: 'pointing-cm-1-3',
    category: 'Plastering & Finishing',
    description: 'Pointing in cement mortar (1:3)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.1, wastageDefault: 5 },
      { materialId: 'fine-sand', material: 'Sand (fine/plastering)', unit: 'cu.m', quantity: 0.006, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.2 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── PAINTING ───
  // ═══════════════════════════════════════════
  {
    id: 'distember-2coat',
    category: 'Painting',
    description: 'Distemper/Acrylic paint (2 coats) on wall',
    unit: 'sq.m',
    materials: [
      { materialId: 'distemper', material: 'Distemper/Acrylic Paint', unit: 'litre', quantity: 0.35, wastageDefault: 5 },
      { materialId: 'primer', material: 'Primer/Putty', unit: 'litre', quantity: 0.15, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Painter', unit: 'day', quantity: 0.06 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.02 },
    ],
    equipment: [],
  },
  {
    id: 'enamel-paint-2coat',
    category: 'Painting',
    description: 'Enamel paint (2 coats) on wood/metal',
    unit: 'sq.m',
    materials: [
      { materialId: 'enamel-paint', material: 'Enamel Paint', unit: 'litre', quantity: 0.2, wastageDefault: 5 },
      { materialId: 'primer', material: 'Primer/Putty', unit: 'litre', quantity: 0.12, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Painter', unit: 'day', quantity: 0.08 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.02 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── FLOORING & TILING ───
  // ═══════════════════════════════════════════
  {
    id: 'floor-tile-ceramic',
    category: 'Flooring & Tiling',
    description: 'Ceramic floor tiling with adhesive',
    unit: 'sq.m',
    materials: [
      { materialId: 'tile-ceramic', material: 'Ceramic Floor Tile', unit: 'sq.m', quantity: 1.05, wastageDefault: 5 },
      { materialId: 'tile-adhesive', material: 'Tile Adhesive', unit: 'kg', quantity: 5, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.2, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Tiler', unit: 'day', quantity: 0.15 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },
  {
    id: 'wall-tile-glazed',
    category: 'Flooring & Tiling',
    description: 'Glazed wall tiling (dado) with adhesive',
    unit: 'sq.m',
    materials: [
      { materialId: 'tile-wall', material: 'Wall Tile (glazed)', unit: 'sq.m', quantity: 1.05, wastageDefault: 5 },
      { materialId: 'tile-adhesive', material: 'Tile Adhesive', unit: 'kg', quantity: 5, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.15, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Tiler', unit: 'day', quantity: 0.18 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },
  {
    id: 'cement-floor-25mm',
    category: 'Flooring & Tiling',
    description: 'Cement concrete flooring 25mm thick (1:2:4)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.4, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.012, wastageDefault: 5 },
      { materialId: 'aggregate-10mm', material: 'Aggregate (10mm)', unit: 'cu.m', quantity: 0.024, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.12 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.15 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── ROOFING ───
  // ═══════════════════════════════════════════
  {
    id: 'gi-sheet-roofing',
    category: 'Roofing',
    description: 'GI corrugated sheet roofing (0.5mm) with purlin',
    unit: 'sq.m',
    materials: [
      { materialId: 'gi-sheet', material: 'GI Corrugated Sheet (0.5mm)', unit: 'sq.m', quantity: 1.1, wastageDefault: 5 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 0.4, wastageDefault: 10 },
      { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', quantity: 0.15, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.15 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.2 },
    ],
    equipment: [],
  },
  {
    id: 'rcc-roof-slab',
    category: 'Roofing',
    description: 'RCC roof slab M20 (125mm thick)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 1.06, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.053, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.105, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 10, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 0.15, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.15 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.1 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.6 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 0.2 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 0.15 },
    ],
  },

  // ═══════════════════════════════════════════
  // ─── DOORS & WINDOWS ───
  // ═══════════════════════════════════════════
  {
    id: 'sal-door-frame',
    category: 'Doors & Windows',
    description: 'Sal wood door frame (75x100mm section)',
    unit: 'r.m',
    materials: [
      { materialId: 'door-frame-sal', material: 'Door Frame (Sal wood)', unit: 'cu.ft', quantity: 0.28, wastageDefault: 10 },
      { materialId: 'nail', material: 'Nails (assorted)', unit: 'kg', quantity: 0.1, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },
  {
    id: 'aluminium-window',
    category: 'Doors & Windows',
    description: 'Aluminium sliding window with 5mm glass',
    unit: 'sq.m',
    materials: [
      { materialId: 'aluminium-section', material: 'Aluminium Section', unit: 'kg', quantity: 5.0, wastageDefault: 5 },
      { materialId: 'glass-5mm', material: 'Glass (5mm plain)', unit: 'sq.m', quantity: 1.05, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.4 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.2 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── WATERPROOFING ───
  // ═══════════════════════════════════════════
  {
    id: 'waterproof-cement',
    category: 'Waterproofing',
    description: 'Waterproofing treatment with cement-based compound',
    unit: 'sq.m',
    materials: [
      { materialId: 'waterproof-compound', material: 'Waterproofing Compound', unit: 'kg', quantity: 1.5, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.15, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.08 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.05 },
    ],
    equipment: [],
  },
  {
    id: 'bitumen-felt-waterproof',
    category: 'Waterproofing',
    description: 'Bitumen felt waterproofing (2 layers)',
    unit: 'sq.m',
    materials: [
      { materialId: 'bitumen-felt', material: 'Bitumen Felt', unit: 'sq.m', quantity: 2.1, wastageDefault: 5 },
      { materialId: 'bitumen-60-70', material: 'Bitumen (60/70 grade)', unit: 'kg', quantity: 1.5, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.1 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.08 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── PLUMBING & SANITARY ───
  // ═══════════════════════════════════════════
  {
    id: 'gi-pipe-supply-20mm',
    category: 'Plumbing & Sanitary',
    description: 'GI pipe water supply line (20mm dia)',
    unit: 'r.m',
    materials: [
      { materialId: 'pipe-gi', material: 'GI Pipe (various dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.15 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.1 },
    ],
    equipment: [],
  },
  {
    id: 'pvc-pipe-drainage-110mm',
    category: 'Plumbing & Sanitary',
    description: 'PVC pipe drainage line (110mm dia)',
    unit: 'r.m',
    materials: [
      { materialId: 'pipe-pvc', material: 'PVC Pipe (various dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 3 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.05, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.12 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.15 },
    ],
    equipment: [],
  },
  {
    id: 'manhole-construction',
    category: 'Plumbing & Sanitary',
    description: 'Manhole construction (internal 900x900mm)',
    unit: 'nos',
    materials: [
      { materialId: 'brick', material: 'Bricks (1st class)', unit: 'nos', quantity: 250, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.35, wastageDefault: 5 },
      { materialId: 'manhole-cover', material: 'CI Manhole Cover', unit: 'nos', quantity: 1, wastageDefault: 0 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.0 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── ELECTRICAL ───
  // ═══════════════════════════════════════════
  {
    id: 'electrical-wiring-point',
    category: 'Electrical',
    description: 'Concealed wiring per point (switch/socket)',
    unit: 'nos',
    materials: [
      { materialId: 'electric-wire', material: 'Electric Wire (1.5 sq.mm)', unit: 'r.m', quantity: 12, wastageDefault: 5 },
      { materialId: 'pvc-conduit', material: 'PVC Conduit Pipe (20mm)', unit: 'r.m', quantity: 4, wastageDefault: 5 },
      { materialId: 'switch-socket', material: 'Switch/Socket Point', unit: 'nos', quantity: 1, wastageDefault: 2 },
    ],
    labor: [
      { role: 'Skilled Electrician', unit: 'day', quantity: 0.25 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.15 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── DRAINAGE & PROTECTION ───
  // ═══════════════════════════════════════════
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
    id: 'stone-pitching',
    category: 'Drainage & Protection',
    description: 'Stone pitching (150-200mm thick) for slope protection',
    unit: 'sq.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 0.2, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.3, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.03, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.4 },
    ],
    equipment: [],
  },
  {
    id: 'side-drain-lined',
    category: 'Drainage & Protection',
    description: 'Lined side drain (V-shape, cement mortar)',
    unit: 'r.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 0.15, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.05, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.5 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── CULVERT WORK ───
  // ═══════════════════════════════════════════
  {
    id: 'hume-pipe-culvert-600mm',
    category: 'Culvert Work',
    description: 'Hume Pipe Culvert (600mm dia) laying',
    unit: 'r.m',
    materials: [
      { materialId: 'hume-pipe-600', material: 'Hume Pipe (600mm dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 2 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 1.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.1, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
    ],
    equipment: [{ equipment: 'Excavator', unit: 'hr', quantity: 0.3 }],
  },
  {
    id: 'hume-pipe-culvert-900mm',
    category: 'Culvert Work',
    description: 'Hume Pipe Culvert (900mm dia) laying',
    unit: 'r.m',
    materials: [
      { materialId: 'hume-pipe-900', material: 'Hume Pipe (900mm dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 2 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 1.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.15, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.6 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
    ],
    equipment: [
      { equipment: 'Excavator', unit: 'hr', quantity: 0.4 },
      { equipment: 'Crane (10T)', unit: 'hr', quantity: 0.2 },
    ],
  },
  {
    id: 'hume-pipe-culvert-1200mm',
    category: 'Culvert Work',
    description: 'Hume Pipe Culvert (1200mm dia) laying',
    unit: 'r.m',
    materials: [
      { materialId: 'hume-pipe-1200', material: 'Hume Pipe (1200mm dia)', unit: 'r.m', quantity: 1.05, wastageDefault: 2 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 2.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.2, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Plumber', unit: 'day', quantity: 0.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.0 },
    ],
    equipment: [
      { equipment: 'Excavator', unit: 'hr', quantity: 0.5 },
      { equipment: 'Crane (10T)', unit: 'hr', quantity: 0.3 },
    ],
  },
  {
    id: 'box-culvert-single',
    category: 'Culvert Work',
    description: 'RCC Box Culvert (single cell 1.5mx1.5m) M25',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 18, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.72, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 1.44, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 180, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 2.7, wastageDefault: 5 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 8, wastageDefault: 10 },
      { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', quantity: 6, wastageDefault: 15 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 350, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 2.0 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 8.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 3.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 2.0 },
      { equipment: 'Excavator', unit: 'hr', quantity: 0.5 },
    ],
  },
  {
    id: 'box-culvert-double',
    category: 'Culvert Work',
    description: 'RCC Box Culvert (double cell 2x1.5mx1.5m) M25',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 30, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 2.4, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 300, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 4.5, wastageDefault: 5 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 14, wastageDefault: 10 },
      { materialId: 'plywood', material: 'Plywood (12mm)', unit: 'sq.m', quantity: 10, wastageDefault: 15 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 580, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 4.0 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 3.5 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 2.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 12.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 5.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 3.0 },
      { equipment: 'Excavator', unit: 'hr', quantity: 1.0 },
      { equipment: 'Crane (10T)', unit: 'hr', quantity: 0.5 },
    ],
  },
  {
    id: 'slab-culvert',
    category: 'Culvert Work',
    description: 'RCC Slab Culvert (2m span) M20',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 12, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.6, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 1.2, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 100, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.5, wastageDefault: 5 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 5, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 230, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 6.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'culvert-headwall',
    category: 'Culvert Work',
    description: 'Culvert head wall / wing wall (stone masonry)',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 65, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── BRIDGE WORK ───
  // ═══════════════════════════════════════════
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
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.8, wastageDefault: 5 },
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
  {
    id: 'rcc-m30-bridge',
    category: 'Bridge Work',
    description: 'RCC M30 for bridge superstructure/pier',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 11.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.38, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.76, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 150, wastageDefault: 2 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 2.2, wastageDefault: 5 },
      { materialId: 'timber', material: 'Timber (Sal)', unit: 'cu.ft', quantity: 6, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.5 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 7.0 },
    ],
    equipment: [
      { equipment: 'Batching Plant', unit: 'hr', quantity: 1.5 },
      { equipment: 'Concrete Pump', unit: 'hr', quantity: 1.0 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 2.0 },
      { equipment: 'Crane (10T)', unit: 'hr', quantity: 0.5 },
    ],
  },
  {
    id: 'bridge-pile-foundation',
    category: 'Bridge Work',
    description: 'Bored cast-in-situ pile (600mm dia, M25)',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.0, wastageDefault: 5 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.12, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.24, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 35, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 0.5, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.4 },
      { role: 'Equipment Operator', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
    ],
    equipment: [
      { equipment: 'Pile Driving Rig', unit: 'hr', quantity: 1.0 },
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 0.5 },
      { equipment: 'Crane (10T)', unit: 'hr', quantity: 0.3 },
    ],
  },
  {
    id: 'bridge-bearing',
    category: 'Bridge Work',
    description: 'Elastomeric bearing pad installation',
    unit: 'nos',
    materials: [
      { materialId: 'bearing-pad', material: 'Elastomeric Bearing Pad', unit: 'nos', quantity: 1, wastageDefault: 0 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.5, wastageDefault: 5 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.02, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.5 },
    ],
    equipment: [{ equipment: 'Crane (10T)', unit: 'hr', quantity: 0.2 }],
  },
  {
    id: 'bridge-expansion-joint',
    category: 'Bridge Work',
    description: 'Expansion joint installation',
    unit: 'r.m',
    materials: [
      { materialId: 'expansion-joint', material: 'Expansion Joint Material', unit: 'r.m', quantity: 1.05, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 10, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Skilled Welder', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.5 },
    ],
    equipment: [],
  },
  {
    id: 'bridge-railing',
    category: 'Bridge Work',
    description: 'RCC bridge railing/parapet',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 1.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.06, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.12, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 15, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 0.2, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.3 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 0.3 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 0.2 },
    ],
  },
  {
    id: 'bridge-approach-slab',
    category: 'Bridge Work',
    description: 'Bridge approach slab (RCC M20)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 75, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.1, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.0 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.8 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'steel-bridge-fabrication',
    category: 'Bridge Work',
    description: 'Structural steel fabrication & erection for bridge',
    unit: 'kg',
    materials: [
      { materialId: 'structural-steel', material: 'Structural Steel Section', unit: 'kg', quantity: 1.05, wastageDefault: 3 },
    ],
    labor: [
      { role: 'Skilled Welder', unit: 'day', quantity: 0.02 },
      { role: 'Semi-skilled Labor', unit: 'day', quantity: 0.01 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.01 },
    ],
    equipment: [{ equipment: 'Crane (10T)', unit: 'hr', quantity: 0.005 }],
  },

  // ═══════════════════════════════════════════
  // ─── BUILDING STRUCTURAL ───
  // ═══════════════════════════════════════════
  {
    id: 'rcc-footing-m20',
    category: 'Building Structural',
    description: 'RCC Isolated Footing M20',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 60, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 0.9, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.0 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.6 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 4.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'rcc-column-m20',
    category: 'Building Structural',
    description: 'RCC Column M20 (300x300mm)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 120, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.8, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'rcc-beam-m20',
    category: 'Building Structural',
    description: 'RCC Beam M20 (230x350mm)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 100, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.5, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'rcc-staircase',
    category: 'Building Structural',
    description: 'RCC Staircase M20 (waist slab type)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 90, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 6.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'dpc-layer',
    category: 'Building Structural',
    description: 'Damp Proof Course (DPC) 50mm thick (1:2:4)',
    unit: 'sq.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.55, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.017, wastageDefault: 5 },
      { materialId: 'aggregate-10mm', material: 'Aggregate (10mm)', unit: 'cu.m', quantity: 0.033, wastageDefault: 5 },
      { materialId: 'waterproof-compound', material: 'Waterproofing Compound', unit: 'kg', quantity: 0.5, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.1 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.15 },
    ],
    equipment: [],
  },
  {
    id: 'rcc-raft-foundation',
    category: 'Building Structural',
    description: 'RCC Raft Foundation M20 (300mm thick)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 78, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'rcc-pile-cap',
    category: 'Building Structural',
    description: 'RCC Pile Cap M25',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 9.96, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.43, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.86, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 100, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.5, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 4.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.5 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 2.0 },
    ],
  },
  {
    id: 'rcc-shear-wall',
    category: 'Building Structural',
    description: 'RCC Shear Wall M25 (200mm thick)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 9.96, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.43, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.86, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 120, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.8, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 10.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 4.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.5 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 2.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.5 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 2.0 },
    ],
  },
  {
    id: 'rcc-water-tank-underground',
    category: 'Building Structural',
    description: 'RCC Underground Water Tank M25 (walls 200mm)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 9.96, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.43, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.86, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 95, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.4, wastageDefault: 5 },
      { materialId: 'waterproof-compound', material: 'Waterproofing Compound', unit: 'kg', quantity: 2.0, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 8.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.5 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 1.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.5 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 2.0 },
    ],
  },
  {
    id: 'rcc-overhead-water-tank',
    category: 'Building Structural',
    description: 'RCC Overhead Water Tank M25 (elevated)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 9.96, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.43, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.86, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 110, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.6, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 12.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 3.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.8 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 2.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.5 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 2.0 },
    ],
  },
  {
    id: 'rcc-septic-tank',
    category: 'Building Structural',
    description: 'RCC Septic Tank M20 (two-chamber)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 70, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.0, wastageDefault: 5 },
      { materialId: 'waterproof-compound', material: 'Waterproofing Compound', unit: 'kg', quantity: 2.5, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 6.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 4.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 1.2 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'rcc-soak-pit',
    category: 'Building Structural',
    description: 'RCC Soak Pit / Dispersion Chamber',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 6.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 50, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 0.8, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 150, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 0.8 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'compound-wall-brick',
    category: 'Building Structural',
    description: 'Compound Wall — Brick in CM (1:4) with RCC posts',
    unit: 'r.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.18, wastageDefault: 5 },
      { materialId: 'brick', material: 'Brick (1st class)', unit: 'nos', quantity: 120, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.06, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 8, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 0.15, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 60, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 0.3 },
    ],
    equipment: [],
  },
  {
    id: 'compound-wall-stone',
    category: 'Building Structural',
    description: 'Compound Wall — Random Rubble Stone Masonry (1:4)',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.25, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 65, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
    ],
    equipment: [],
  },
  {
    id: 'rcc-tie-beam',
    category: 'Building Structural',
    description: 'RCC Tie Beam / Band Beam M20 (NBC seismic)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 80, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.2, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 6.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.8 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.0 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 1.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'rcc-slab-m20',
    category: 'Building Structural',
    description: 'RCC Slab M20 (125mm thick)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 85, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 8.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 4.0 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.2 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 2.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.5 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 2.0 },
    ],
  },
  {
    id: 'rcc-lintel',
    category: 'Building Structural',
    description: 'RCC Lintel M20 (over doors/windows)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 65, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.0, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 5.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.5 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 0.8 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 1.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
    ],
  },
  {
    id: 'rcc-chajja',
    category: 'Building Structural',
    description: 'RCC Chajja / Sun Shade M20 (75mm thick)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.22, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.45, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.90, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'TMT Steel Bar', unit: 'kg', quantity: 90, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire', unit: 'kg', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'plywood', material: 'Plywood (formwork)', unit: 'sq.m', quantity: 14.0, wastageDefault: 10 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 180, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 3.5 },
      { role: 'Bar Bender', unit: 'day', quantity: 1.2 },
      { role: 'Carpenter (formwork)', unit: 'day', quantity: 2.5 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 2.0 },
      { equipment: 'Needle Vibrator', unit: 'hr', quantity: 1.5 },
    ],
  },

  // ═══════════════════════════════════════════
  // ─── RETAINING WALL & PROTECTION ───
  // ═══════════════════════════════════════════
  {
    id: 'retaining-wall-stone',
    category: 'Retaining & Protection',
    description: 'Stone masonry retaining wall (1:4 CM)',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.25, wastageDefault: 5 },
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 3.0, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 65, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 2.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 2.5 },
    ],
    equipment: [],
  },
  {
    id: 'retaining-wall-rcc',
    category: 'Retaining & Protection',
    description: 'RCC Retaining Wall M20 (cantilever type)',
    unit: 'cu.m',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 8.5, wastageDefault: 3 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.42, wastageDefault: 5 },
      { materialId: 'aggregate-20mm', material: 'Aggregate (20mm)', unit: 'cu.m', quantity: 0.84, wastageDefault: 3 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 90, wastageDefault: 3 },
      { materialId: 'binding-wire', material: 'Binding Wire (GI)', unit: 'kg', quantity: 1.3, wastageDefault: 5 },
      { materialId: 'water', material: 'Water', unit: 'litre', quantity: 185, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.2 },
      { role: 'Skilled Bar Bender', unit: 'day', quantity: 0.9 },
      { role: 'Skilled Carpenter', unit: 'day', quantity: 0.6 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 5.0 },
    ],
    equipment: [
      { equipment: 'Concrete Mixer', unit: 'hr', quantity: 1.5 },
      { equipment: 'Vibrator', unit: 'hr', quantity: 1.0 },
    ],
  },
  {
    id: 'breast-wall',
    category: 'Retaining & Protection',
    description: 'Dry stone breast wall',
    unit: 'cu.m',
    materials: [
      { materialId: 'stone', material: 'Stone (rubble)', unit: 'cu.m', quantity: 1.3, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 1.0 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 1.5 },
    ],
    equipment: [],
  },

  // ═══════════════════════════════════════════
  // ─── ROAD FURNITURE ───
  // ═══════════════════════════════════════════
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
  {
    id: 'km-post',
    category: 'Road Furniture',
    description: 'RCC Kilometre post',
    unit: 'nos',
    materials: [
      { materialId: 'cement', material: 'Cement (OPC)', unit: 'bag (50kg)', quantity: 0.5, wastageDefault: 5 },
      { materialId: 'sand', material: 'Sand (coarse)', unit: 'cu.m', quantity: 0.02, wastageDefault: 5 },
      { materialId: 'aggregate-10mm', material: 'Aggregate (10mm)', unit: 'cu.m', quantity: 0.04, wastageDefault: 5 },
      { materialId: 'steel-bar', material: 'Steel Reinforcement Bar', unit: 'kg', quantity: 2, wastageDefault: 5 },
      { materialId: 'enamel-paint', material: 'Enamel Paint', unit: 'litre', quantity: 0.2, wastageDefault: 5 },
    ],
    labor: [
      { role: 'Skilled Mason', unit: 'day', quantity: 0.3 },
      { role: 'Unskilled Labor', unit: 'day', quantity: 0.5 },
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
