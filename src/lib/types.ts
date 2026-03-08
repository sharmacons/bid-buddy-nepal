export type BidType = 'ncb-single' | 'ncb-double' | 'sealed-quotation' | 'icb';

export type BidStatus = 'preparing' | 'submitted' | 'won' | 'lost';

export interface CompanyProfile {
  companyName: string;
  address: string;
  panVatNumber: string;
  registrationNumber: string;
  authorizedRepresentative: string;
  contactPhone: string;
  contactEmail: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  type: DocumentTag;
  dataUrl: string; // base64 data URL
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
  bidType: BidType;
  status: BidStatus;
  submissionDeadline: string;
  createdAt: string;
  checklist: ChecklistItem[];
  boqItems: BOQItem[];
  // Template fields
  bidAmount?: string;
  bidValidity?: string;
  completionPeriod?: string;
  bidSecurityAmount?: string;
  methodology?: string;
  workSchedule?: string;
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
  other: 'Other',
};
