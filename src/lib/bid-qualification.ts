/**
 * Bid Qualification & Rate Estimation based on PPMO criteria
 * सार्वजनिक खरिद नियमावली अनुसार बोलपत्र योग्यता र लागत अनुमान
 *
 * Factors: Similar size, Nature of work, Turnover, Contract duration, Bank guarantee, Bid security
 */

export interface BidQualificationInput {
  estimatedCost: number;
  contractDurationMonths: number;
  workNature: 'road' | 'bridge' | 'building' | 'irrigation' | 'water-supply' | 'other';
}

export interface QualificationCriteria {
  label: string;
  labelNe: string;
  value: string;
  amount: number;
  formula: string;
}

// PPMO Standard thresholds
const NATURE_FACTORS: Record<string, { label: string; complexityFactor: number }> = {
  road: { label: 'Road Construction (सडक निर्माण)', complexityFactor: 1.0 },
  bridge: { label: 'Bridge Construction (पुल निर्माण)', complexityFactor: 1.15 },
  building: { label: 'Building Construction (भवन निर्माण)', complexityFactor: 0.95 },
  irrigation: { label: 'Irrigation (सिंचाइ)', complexityFactor: 1.05 },
  'water-supply': { label: 'Water Supply (खानेपानी)', complexityFactor: 1.0 },
  other: { label: 'Other (अन्य)', complexityFactor: 1.0 },
};

/**
 * Calculate all PPMO bid qualification requirements from estimated cost
 */
export function calculateBidQualification(input: BidQualificationInput): QualificationCriteria[] {
  const { estimatedCost, contractDurationMonths, workNature } = input;
  const natureFactor = NATURE_FACTORS[workNature]?.complexityFactor || 1.0;
  const criteria: QualificationCriteria[] = [];

  // 1. Minimum Similar Size Contract (न्यूनतम समान आकारको ठेक्का)
  // PPMO: At least one contract of 80% of estimated cost in last 5 years (NCB)
  const similarSize80 = Math.round(estimatedCost * 0.80);
  const similarSize60 = Math.round(estimatedCost * 0.60);
  criteria.push({
    label: 'Minimum Similar Contract (80%)',
    labelNe: 'न्यूनतम समान ठेक्का (८०%)',
    value: `NPR ${similarSize80.toLocaleString('en-IN')}`,
    amount: similarSize80,
    formula: 'Estimated Cost × 80% (NCB single contract)',
  });
  criteria.push({
    label: 'Minimum Similar Contract (60% each, 2 contracts)',
    labelNe: 'न्यूनतम समान ठेक्का (६०% प्रत्येक, २ वटा)',
    value: `NPR ${similarSize60.toLocaleString('en-IN')} each`,
    amount: similarSize60,
    formula: 'Estimated Cost × 60% (2 contracts alternative)',
  });

  // 2. Minimum Average Annual Turnover (न्यूनतम वार्षिक कारोबार)
  // PPMO: Average annual turnover of last 5 years ≥ estimated cost (or 150% for some)
  const turnover100 = Math.round(estimatedCost * 1.0);
  const turnover150 = Math.round(estimatedCost * 1.5);
  criteria.push({
    label: 'Min Avg Annual Turnover (100%)',
    labelNe: 'न्यूनतम वार्षिक कारोबार (१००%)',
    value: `NPR ${turnover100.toLocaleString('en-IN')}`,
    amount: turnover100,
    formula: 'Estimated Cost × 100% (last 5 fiscal years avg)',
  });
  criteria.push({
    label: 'Min Avg Annual Turnover (150% - ICB)',
    labelNe: 'न्यूनतम वार्षिक कारोबार (१५०% - ICB)',
    value: `NPR ${turnover150.toLocaleString('en-IN')}`,
    amount: turnover150,
    formula: 'Estimated Cost × 150% (ICB requirement)',
  });

  // 3. Bid Security (बोलपत्र जमानत)
  // PPMO: 2.5% of estimated cost
  const bidSecurity = Math.round(estimatedCost * 0.025);
  criteria.push({
    label: 'Bid Security (बोलपत्र जमानत)',
    labelNe: 'बोलपत्र जमानत',
    value: `NPR ${bidSecurity.toLocaleString('en-IN')}`,
    amount: bidSecurity,
    formula: 'Estimated Cost × 2.5%',
  });

  // 4. Performance Security (कार्य सम्पादन जमानत)
  // PPMO: 5% of contract amount
  const perfSecurity = Math.round(estimatedCost * 0.05);
  criteria.push({
    label: 'Performance Security (कार्य सम्पादन जमानत)',
    labelNe: 'कार्य सम्पादन जमानत',
    value: `NPR ${perfSecurity.toLocaleString('en-IN')}`,
    amount: perfSecurity,
    formula: 'Contract Amount × 5%',
  });

  // 5. Bank Guarantee / Credit Line (बैंक ऋण सुविधा)
  // Typically 40-50% of estimated cost
  const creditLine = Math.round(estimatedCost * 0.40);
  criteria.push({
    label: 'Minimum Credit Line (बैंक ऋण सुविधा)',
    labelNe: 'न्यूनतम ऋण सुविधा',
    value: `NPR ${creditLine.toLocaleString('en-IN')}`,
    amount: creditLine,
    formula: 'Estimated Cost × 40%',
  });

  // 6. Liquid Assets / Working Capital
  const liquidAssets = Math.round(estimatedCost * 0.25);
  criteria.push({
    label: 'Min Liquid Assets (तरल सम्पत्ति)',
    labelNe: 'न्यूनतम तरल सम्पत्ति',
    value: `NPR ${liquidAssets.toLocaleString('en-IN')}`,
    amount: liquidAssets,
    formula: 'Estimated Cost × 25%',
  });

  // 7. Retention Money (निलम्बन रकम)
  // 5% retention, released after DLP
  const retention = Math.round(estimatedCost * 0.05);
  criteria.push({
    label: 'Retention Money (निलम्बन रकम)',
    labelNe: 'निलम्बन रकम',
    value: `NPR ${retention.toLocaleString('en-IN')}`,
    amount: retention,
    formula: 'Contract Amount × 5% (released after DLP)',
  });

  // 8. Advance Payment (अग्रिम भुक्तानी)
  // PPMO allows up to 20% mobilization advance
  const advance = Math.round(estimatedCost * 0.20);
  criteria.push({
    label: 'Max Mobilization Advance (अग्रिम भुक्तानी)',
    labelNe: 'अधिकतम अग्रिम भुक्तानी',
    value: `NPR ${advance.toLocaleString('en-IN')}`,
    amount: advance,
    formula: 'Contract Amount × 20% (against bank guarantee)',
  });

  // 9. Constructor License Class
  const licenseClass = estimatedCost > 500_000_000 ? 'Class A (क श्रेणी)' :
    estimatedCost > 200_000_000 ? 'Class B (ख श्रेणी)' :
    estimatedCost > 60_000_000 ? 'Class C (ग श्रेणी)' :
    'Class D (घ श्रेणी)';
  criteria.push({
    label: 'Required License Class',
    labelNe: 'आवश्यक इजाजतपत्र श्रेणी',
    value: licenseClass,
    amount: 0,
    formula: 'A: >50Cr, B: >20Cr, C: >6Cr, D: ≤6Cr',
  });

  // 10. Defect Liability Period
  const dlp = contractDurationMonths <= 12 ? '12 months' : '12 months (standard)';
  criteria.push({
    label: 'Defect Liability Period (त्रुटि दायित्व अवधि)',
    labelNe: 'त्रुटि दायित्व अवधि',
    value: dlp,
    amount: 0,
    formula: 'Standard 12 months after completion',
  });

  return criteria;
}

/**
 * Estimate cost with nature/complexity factor applied
 */
export function estimateWithNatureFactor(baseCost: number, workNature: string): { adjusted: number; factor: number; label: string } {
  const nature = NATURE_FACTORS[workNature] || NATURE_FACTORS.other;
  return {
    adjusted: Math.round(baseCost * nature.complexityFactor),
    factor: nature.complexityFactor,
    label: nature.label,
  };
}

export const WORK_NATURE_OPTIONS = Object.entries(NATURE_FACTORS).map(([key, val]) => ({
  value: key,
  label: val.label,
}));
