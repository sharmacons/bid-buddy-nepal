export type BidType = 'ncb-single' | 'ncb-double' | 'sealed-quotation' | 'icb';

export type BidStatus = 'preparing' | 'submitted' | 'won' | 'lost';

export type Gender = 'male' | 'female' | 'other';

export interface JVPartner {
  id: string;
  legalName: string;
  country: string;
  yearOfConstitution: string;
  address: string;
  panVatNumber: string;
  registrationNumber: string;
  authorizedRepresentative: string;
  gender: Gender;
  fatherName: string;
  grandfatherName: string;
  designation: string; // MD, Proprietor, Partner, Director, etc.
  contactPhone: string;
  contactEmail: string;
  sharePercentage: number;
}

export interface RunningContract {
  id: string;
  name: string;
  sourceOfFund: string;
  dateOfAcceptance: string;
  status: 'yet-to-sign' | 'running' | 'substantially-completed';
  takingOverDate?: string;
}

export interface WorkScheduleItem {
  id: string;
  activity: string;
  duration: number; // in weeks
  startWeek: number;
  isMajor: boolean;
}

export interface CompanyProfile {
  companyName: string;
  address: string;
  panVatNumber: string;
  registrationNumber: string;
  authorizedRepresentative: string;
  designation: string; // MD, Proprietor, Partner, Director, etc.
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string; // Optional company logo data URL
  yearOfConstitution?: string;
  country?: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  type: DocumentTag;
  dataUrl: string;
  uploadedAt: string;
  size: number;
}

export type DocumentTag =
  | 'company-registration'
  | 'vat-pan'
  | 'tax-clearance'
  | 'financial-statement'
  | 'bank-guarantee'
  | 'power-of-attorney'
  | 'jv-agreement'
  | 'other';

export interface ChecklistItem {
  id: string;
  label: string;
  labelNe?: string;
  completed: boolean;
  envelope?: 'technical' | 'financial';
  notes?: string;
}

export interface BOQItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BidData {
  id: string;
  projectName: string;
  employer: string;
  employerAddress?: string;
  bidType: BidType;
  status: BidStatus;
  submissionDeadline: string;
  createdAt: string;
  checklist: ChecklistItem[];
  boqItems: BOQItem[];
  // JV
  isJV: boolean;
  jvPartners: JVPartner[];
  jvLeadPartner?: string;
  // Running contracts
  runningContracts: RunningContract[];
  // Work schedule
  workSchedule: WorkScheduleItem[];
  totalDurationWeeks?: number;
  // Template fields
  ifbNumber?: string;
  contractId?: string;
  bidAmount?: string;
  bidAmountWords?: string;
  bidValidity?: string;
  completionPeriod?: string;
  commencementDays?: string;
  bidSecurityAmount?: string;
  performanceSecurityPercent?: string;
  methodology?: string;
  siteOrganization?: string;
  mobilizationPlan?: string;
  notes?: string;
}

export const BID_TYPE_LABELS: Record<BidType, string> = {
  'ncb-single': 'NCB Single Envelope',
  'ncb-double': 'NCB Double Envelope',
  'sealed-quotation': 'Sealed Quotation',
  'icb': 'ICB Works',
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  preparing: 'Preparing',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
};

export const DOCUMENT_TAG_LABELS: Record<DocumentTag, string> = {
  'company-registration': 'Company Registration',
  'vat-pan': 'VAT/PAN Certificate',
  'tax-clearance': 'Tax Clearance',
  'financial-statement': 'Financial Statement',
  'bank-guarantee': 'Bank Guarantee Template',
  'power-of-attorney': 'Power of Attorney',
  'jv-agreement': 'JV Agreement',
  other: 'Other',
};

// Common road construction BOQ items for auto-generating work schedule
export const COMMON_ROAD_WORK_ITEMS = [
  { activity: 'Site Clearance & Mobilization', defaultDuration: 2, isMajor: true },
  { activity: 'Earthwork - Excavation', defaultDuration: 6, isMajor: true },
  { activity: 'Earthwork - Embankment / Fill', defaultDuration: 4, isMajor: true },
  { activity: 'Sub-base Course', defaultDuration: 3, isMajor: true },
  { activity: 'Base Course (Granular)', defaultDuration: 3, isMajor: true },
  { activity: 'Bituminous Surface / Seal Coat', defaultDuration: 2, isMajor: true },
  { activity: 'Drainage Works (Side Drain, Cross Drain)', defaultDuration: 4, isMajor: true },
  { activity: 'Retaining Wall / Gabion Wall', defaultDuration: 4, isMajor: false },
  { activity: 'Bridge / Culvert Construction', defaultDuration: 6, isMajor: false },
  { activity: 'Bio-Engineering / Slope Protection', defaultDuration: 2, isMajor: false },
  { activity: 'Road Furniture & Signage', defaultDuration: 1, isMajor: false },
  { activity: 'Demobilization & Cleanup', defaultDuration: 1, isMajor: false },
];
