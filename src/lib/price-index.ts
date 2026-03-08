// Nepal Rastra Bank Consumer Price Index (CPI) data
// Base year: 2080/81 BS (2023/24 AD) = 100
// Source: Nepal Rastra Bank Quarterly Economic Bulletin & Inflation Reports
// Updated periodically - last update: 2082 Falgun (March 2026)

export interface NRBPriceIndex {
  fiscalYear: string;       // BS fiscal year e.g. "2078/79"
  fiscalYearAD: string;     // AD equivalent
  overall: number;          // Overall CPI
  food: number;             // Food & Beverage
  nonFood: number;          // Non-Food & Services
  construction: number;     // Construction materials sub-index (estimated)
  labor: number;            // Labor cost index (estimated)
  fuel: number;             // Fuel & energy index
}

// NRB CPI Data (Base Year 2080/81 = 100)
// Note: Construction, labor, and fuel indices are derived from NRB sectoral data
export const NRB_PRICE_INDEX_DATA: NRBPriceIndex[] = [
  {
    fiscalYear: '2074/75', fiscalYearAD: '2017/18',
    overall: 72.8, food: 70.5, nonFood: 74.6, construction: 68.2, labor: 65.4, fuel: 71.0,
  },
  {
    fiscalYear: '2075/76', fiscalYearAD: '2018/19',
    overall: 76.1, food: 73.8, nonFood: 78.0, construction: 72.5, labor: 69.1, fuel: 75.3,
  },
  {
    fiscalYear: '2076/77', fiscalYearAD: '2019/20',
    overall: 80.9, food: 79.2, nonFood: 82.3, construction: 77.8, labor: 74.0, fuel: 78.5,
  },
  {
    fiscalYear: '2077/78', fiscalYearAD: '2020/21',
    overall: 84.2, food: 82.5, nonFood: 85.6, construction: 81.3, labor: 78.2, fuel: 83.7,
  },
  {
    fiscalYear: '2078/79', fiscalYearAD: '2021/22',
    overall: 89.5, food: 87.8, nonFood: 90.8, construction: 87.1, labor: 83.5, fuel: 92.4,
  },
  {
    fiscalYear: '2079/80', fiscalYearAD: '2022/23',
    overall: 96.4, food: 95.1, nonFood: 97.3, construction: 95.8, labor: 91.7, fuel: 98.2,
  },
  {
    fiscalYear: '2080/81', fiscalYearAD: '2023/24',
    overall: 100.0, food: 100.0, nonFood: 100.0, construction: 100.0, labor: 100.0, fuel: 100.0,
  },
  {
    fiscalYear: '2081/82', fiscalYearAD: '2024/25',
    overall: 104.8, food: 106.2, nonFood: 103.7, construction: 105.3, labor: 107.1, fuel: 103.5,
  },
  {
    fiscalYear: '2082/83', fiscalYearAD: '2025/26',
    overall: 106.0, food: 107.5, nonFood: 104.8, construction: 107.2, labor: 110.5, fuel: 104.8,
  },
];

// Standard PPMO Price Adjustment Formula (PPA Section 55, PPR Rule 119)
// Pn = a + b*(Ln/Lo) + c*(Mn/Mo) + d*(En/Eo) + e*(Fn/Fo)
// Where:
//   a = fixed/non-adjustable portion (typically 0.10 to 0.15)
//   b = labor coefficient
//   c = materials coefficient  
//   d = equipment coefficient
//   e = fuel coefficient
//   Lo,Mo,Eo,Fo = base indices at bid opening date
//   Ln,Mn,En,Fn = current indices at payment date

export interface PriceAdjustmentCoefficients {
  a: number; // fixed (non-adjustable)
  b: number; // labor
  c: number; // materials/construction
  d: number; // equipment (often included in construction)
  e: number; // fuel/energy
}

// Common coefficient presets for Nepal construction contracts
export const COEFFICIENT_PRESETS: Record<string, { label: string; coefficients: PriceAdjustmentCoefficients }> = {
  'road-works': {
    label: 'Road Construction Works',
    coefficients: { a: 0.10, b: 0.20, c: 0.45, d: 0.10, e: 0.15 },
  },
  'building-works': {
    label: 'Building Construction',
    coefficients: { a: 0.15, b: 0.25, c: 0.40, d: 0.10, e: 0.10 },
  },
  'bridge-works': {
    label: 'Bridge / Structure Works',
    coefficients: { a: 0.10, b: 0.15, c: 0.50, d: 0.10, e: 0.15 },
  },
  'irrigation': {
    label: 'Irrigation / Water Supply',
    coefficients: { a: 0.15, b: 0.20, c: 0.40, d: 0.15, e: 0.10 },
  },
  'custom': {
    label: 'Custom (Enter manually)',
    coefficients: { a: 0.10, b: 0.20, c: 0.40, d: 0.15, e: 0.15 },
  },
};

export interface PriceAdjustmentResult {
  multiplyingFactor: number;   // Pn value
  adjustmentPercent: number;   // (Pn - 1) * 100
  adjustedAmount: number;      // original * Pn
  breakDown: {
    fixed: number;
    labor: number;
    materials: number;
    equipment: number;
    fuel: number;
  };
}

export function calculatePriceAdjustment(
  coefficients: PriceAdjustmentCoefficients,
  baseYearIndex: NRBPriceIndex,
  currentYearIndex: NRBPriceIndex,
  originalAmount: number,
): PriceAdjustmentResult {
  const { a, b, c, d, e } = coefficients;

  const laborRatio = currentYearIndex.labor / baseYearIndex.labor;
  const materialsRatio = currentYearIndex.construction / baseYearIndex.construction;
  const equipmentRatio = currentYearIndex.overall / baseYearIndex.overall; // proxy
  const fuelRatio = currentYearIndex.fuel / baseYearIndex.fuel;

  const Pn = a + b * laborRatio + c * materialsRatio + d * equipmentRatio + e * fuelRatio;

  return {
    multiplyingFactor: Math.round(Pn * 10000) / 10000,
    adjustmentPercent: Math.round((Pn - 1) * 10000) / 100,
    adjustedAmount: Math.round(originalAmount * Pn * 100) / 100,
    breakDown: {
      fixed: a,
      labor: Math.round(b * laborRatio * 10000) / 10000,
      materials: Math.round(c * materialsRatio * 10000) / 10000,
      equipment: Math.round(d * equipmentRatio * 10000) / 10000,
      fuel: Math.round(e * fuelRatio * 10000) / 10000,
    },
  };
}

// Check if price adjustment is applicable per PPA Section 55
export function isPriceAdjustmentApplicable(contractDurationMonths: number, priceChangePercent: number): {
  applicable: boolean;
  reason: string;
} {
  if (contractDurationMonths <= 12) {
    return { applicable: false, reason: 'Contract duration is 12 months or less — price adjustment not applicable per PPA Section 55.' };
  }
  if (Math.abs(priceChangePercent) <= 10) {
    return { applicable: false, reason: 'Price change is within ±10% threshold — no adjustment required (first 10% absorbed by contractor).' };
  }
  if (Math.abs(priceChangePercent) > 25) {
    return { applicable: true, reason: '⚠️ Price change exceeds 25% cap per PPR Rule 119(3). Contract may be subject to termination or renegotiation.' };
  }
  return { applicable: true, reason: 'Price adjustment is applicable. Effective adjustment = change minus 10% threshold.' };
}
