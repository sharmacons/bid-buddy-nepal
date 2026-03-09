import { BidData, CompanyProfile, StoredDocument } from './types';

const KEYS = {
  company: 'nba-company-profile',
  bids: 'nba-bids',
  documents: 'nba-documents',
  customNorms: 'bidready-custom-norms',
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

// ═══════════════════════════════════════════
// ─── BACKUP & RESTORE ───
// ═══════════════════════════════════════════

export interface BackupData {
  version: string;
  exportedAt: string;
  company: CompanyProfile | null;
  bids: BidData[];
  documents: StoredDocument[];
  customNorms: unknown[];
}

export function exportBackup(): BackupData {
  const customNormsRaw = localStorage.getItem(KEYS.customNorms);
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    company: getCompanyProfile(),
    bids: getBids(),
    documents: getDocuments(),
    customNorms: customNormsRaw ? JSON.parse(customNormsRaw) : [],
  };
}

export function downloadBackup() {
  const backup = exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `BidReady-Backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restoreBackup(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (!data.version || !data.exportedAt) {
          resolve({ success: false, message: 'Invalid backup file format' });
          return;
        }
        // Restore all data
        if (data.company) {
          localStorage.setItem(KEYS.company, JSON.stringify(data.company));
        }
        if (data.bids) {
          localStorage.setItem(KEYS.bids, JSON.stringify(data.bids));
        }
        if (data.documents) {
          localStorage.setItem(KEYS.documents, JSON.stringify(data.documents));
        }
        if (data.customNorms) {
          localStorage.setItem(KEYS.customNorms, JSON.stringify(data.customNorms));
        }
        resolve({
          success: true,
          message: `Restored: ${data.bids?.length || 0} bids, ${data.documents?.length || 0} documents, ${data.customNorms?.length || 0} custom norms (backed up ${new Date(data.exportedAt).toLocaleDateString()})`,
        });
      } catch {
        resolve({ success: false, message: 'Failed to parse backup file' });
      }
    };
    reader.onerror = () => resolve({ success: false, message: 'Failed to read file' });
    reader.readAsText(file);
  });
}

// ═══════════════════════════════════════════
// ─── CLEAR ALL DATA ───
// ═══════════════════════════════════════════

export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

export function clearBidsAndDocuments() {
  localStorage.removeItem(KEYS.bids);
  localStorage.removeItem(KEYS.documents);
  localStorage.removeItem(KEYS.customNorms);
}
