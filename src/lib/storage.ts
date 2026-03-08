import { BidData, CompanyProfile, StoredDocument } from './types';

const KEYS = {
  company: 'nba-company-profile',
  bids: 'nba-bids',
  documents: 'nba-documents',
};

export function getCompanyProfile(): CompanyProfile | null {
  const raw = localStorage.getItem(KEYS.company);
  return raw ? JSON.parse(raw) : null;
}

export function saveCompanyProfile(profile: CompanyProfile) {
  localStorage.setItem(KEYS.company, JSON.stringify(profile));
}

export function getBids(): BidData[] {
  const raw = localStorage.getItem(KEYS.bids);
  return raw ? JSON.parse(raw) : [];
}

export function saveBid(bid: BidData) {
  const bids = getBids();
  const idx = bids.findIndex((b) => b.id === bid.id);
  if (idx >= 0) bids[idx] = bid;
  else bids.push(bid);
  localStorage.setItem(KEYS.bids, JSON.stringify(bids));
}

export function deleteBid(id: string) {
  const bids = getBids().filter((b) => b.id !== id);
  localStorage.setItem(KEYS.bids, JSON.stringify(bids));
}

export function getDocuments(): StoredDocument[] {
  const raw = localStorage.getItem(KEYS.documents);
  return raw ? JSON.parse(raw) : [];
}

export function saveDocument(doc: StoredDocument) {
  const docs = getDocuments();
  docs.push(doc);
  localStorage.setItem(KEYS.documents, JSON.stringify(docs));
}

export function deleteDocument(id: string) {
  const docs = getDocuments().filter((d) => d.id !== id);
  localStorage.setItem(KEYS.documents, JSON.stringify(docs));
}
