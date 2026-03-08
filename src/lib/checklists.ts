import { BidType, ChecklistItem } from './types';

function item(id: string, label: string, envelope?: 'technical' | 'financial'): ChecklistItem {
  return { id, label, completed: false, envelope };
}

const NCB_SINGLE: ChecklistItem[] = [
  item('letter-of-bid', 'Letter of Bid (बोलपत्र पत्र)'),
  item('boq', 'Bill of Quantities / Activity Schedule (परिमाण विवरण)'),
  item('bid-security', 'Bid Security / Bank Guarantee (बोलपत्र जमानत)'),
  item('qual-general', 'Qualification: General Experience (सामान्य अनुभव)'),
  item('qual-specific', 'Qualification: Specific Experience (विशिष्ट अनुभव)'),
  item('qual-financial', 'Qualification: Financial Capacity (आर्थिक क्षमता)'),
  item('qual-personnel', 'Qualification: Key Personnel (प्रमुख कर्मचारी)'),
  item('qual-equipment', 'Qualification: Equipment (उपकरण)'),
  item('company-reg', 'Company Registration Certificate (कम्पनी दर्ता प्रमाणपत्र)'),
  item('vat-pan', 'VAT/PAN Certificate (मूल्य अभिवृद्धि कर प्रमाणपत्र)'),
  item('tax-clearance', 'Tax Clearance Certificate (कर चुक्ता प्रमाणपत्र)'),
  item('financial-stmt', 'Audited Financial Statements (लेखापरीक्षण प्रतिवेदन)'),
  item('poa', 'Power of Attorney / Authorization (अख्तियारनामा)'),
  item('jv-agreement', 'JV Agreement (if applicable) (संयुक्त उपक्रम सम्झौता)'),
  item('methodology', 'Technical Proposal: Methodology (कार्यविधि)'),
  item('work-schedule', 'Work Schedule (कार्य तालिका)'),
  item('org-chart', 'Organization Chart (संगठन तालिका)'),
];

const NCB_DOUBLE: ChecklistItem[] = [
  // Technical Envelope
  item('tech-letter', 'Letter of Technical Bid (प्राविधिक बोलपत्र पत्र)', 'technical'),
  item('qual-general', 'Qualification: General Experience', 'technical'),
  item('qual-specific', 'Qualification: Specific Experience', 'technical'),
  item('qual-financial', 'Qualification: Financial Capacity', 'technical'),
  item('qual-personnel', 'Qualification: Key Personnel', 'technical'),
  item('qual-equipment', 'Qualification: Equipment', 'technical'),
  item('company-reg', 'Company Registration Certificate', 'technical'),
  item('vat-pan', 'VAT/PAN Certificate', 'technical'),
  item('tax-clearance', 'Tax Clearance Certificate', 'technical'),
  item('bid-security', 'Bid Security / Bank Guarantee', 'technical'),
  item('methodology', 'Technical Proposal: Methodology', 'technical'),
  item('work-plan', 'Work Plan & Schedule', 'technical'),
  item('org-chart', 'Organization Chart', 'technical'),
  item('poa', 'Power of Attorney', 'technical'),
  // Financial Envelope
  item('fin-letter', 'Letter of Financial Bid (आर्थिक बोलपत्र पत्र)', 'financial'),
  item('boq', 'Bill of Quantities / Priced Activity Schedule', 'financial'),
  item('cost-summary', 'Summary of Costs', 'financial'),
];

const SEALED_QUOTATION: ChecklistItem[] = [
  item('quotation-letter', 'Quotation Letter (दरभाउपत्र)'),
  item('boq', 'Priced Bill of Quantities (परिमाण विवरण)'),
  item('company-reg', 'Company Registration Certificate'),
  item('vat-pan', 'VAT/PAN Certificate'),
  item('tax-clearance', 'Tax Clearance Certificate'),
];

const ICB: ChecklistItem[] = [
  ...NCB_DOUBLE,
  item('eligibility', 'Eligibility Declaration (योग्यता घोषणा)', 'technical'),
  item('country-origin', 'Country of Origin Forms', 'technical'),
  item('currency-req', 'Currency Requirements Declaration', 'financial'),
];

export function getChecklistForType(type: BidType): ChecklistItem[] {
  switch (type) {
    case 'ncb-single': return NCB_SINGLE.map((i) => ({ ...i }));
    case 'ncb-double': return NCB_DOUBLE.map((i) => ({ ...i }));
    case 'sealed-quotation': return SEALED_QUOTATION.map((i) => ({ ...i }));
    case 'icb': return ICB.map((i) => ({ ...i }));
  }
}
