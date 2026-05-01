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

// ═══════════════════════════════════════════
// ─── PER-BID IMPORT / EXPORT ───
// ═══════════════════════════════════════════

export interface BidExport {
  kind: 'bidready-bid-export';
  version: '1.0';
  exportedAt: string;
  bids: BidData[];
}

function safeName(s: string) {
  return (s || 'bid').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBid(id: string): boolean {
  const bid = getBids().find((b) => b.id === id);
  if (!bid) return false;
  const payload: BidExport = {
    kind: 'bidready-bid-export',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    bids: [bid],
  };
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`Bid-${safeName(bid.projectName)}-${date}.json`, payload);
  return true;
}

export function exportAllBids(): number {
  const bids = getBids();
  if (bids.length === 0) return 0;
  const payload: BidExport = {
    kind: 'bidready-bid-export',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    bids,
  };
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`BidReady-Bids-${date}.json`, payload);
  return bids.length;
}

export interface ImportBidsResult {
  success: boolean;
  message: string;
  imported: number;
  replaced: number;
  skipped: number;
  ids: string[];
}

export function importBidsFromFile(
  file: File,
  options: { onConflict?: 'replace' | 'duplicate' | 'skip' } = {}
): Promise<ImportBidsResult> {
  const onConflict = options.onConflict ?? 'replace';
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        // Accept three shapes: BidExport, full BackupData, or a single BidData
        let incoming: BidData[] = [];
        if (raw && Array.isArray(raw.bids)) incoming = raw.bids as BidData[];
        else if (Array.isArray(raw)) incoming = raw as BidData[];
        else if (raw && typeof raw === 'object' && 'projectName' in raw && 'boqItems' in raw)
          incoming = [raw as BidData];

        if (!incoming.length) {
          resolve({ success: false, message: 'No bids found in file', imported: 0, replaced: 0, skipped: 0, ids: [] });
          return;
        }

        const existing = getBids();
        const byId = new Map(existing.map((b) => [b.id, b]));
        let imported = 0;
        let replaced = 0;
        let skipped = 0;
        const ids: string[] = [];

        for (const bid of incoming) {
          if (!bid || !bid.projectName) {
            skipped++;
            continue;
          }
          const incomingBid: BidData = {
            ...bid,
            id: bid.id || `bid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            checklist: bid.checklist || [],
            boqItems: bid.boqItems || [],
            jvPartners: bid.jvPartners || [],
            runningContracts: bid.runningContracts || [],
            workSchedule: bid.workSchedule || [],
            createdAt: bid.createdAt || new Date().toISOString(),
          };
          if (byId.has(incomingBid.id)) {
            if (onConflict === 'skip') {
              skipped++;
              continue;
            }
            if (onConflict === 'duplicate') {
              incomingBid.id = `${incomingBid.id}-copy-${Date.now().toString(36)}`;
              incomingBid.projectName = `${incomingBid.projectName} (imported)`;
              imported++;
            } else {
              replaced++;
            }
          } else {
            imported++;
          }
          byId.set(incomingBid.id, incomingBid);
          ids.push(incomingBid.id);
        }

        const merged = Array.from(byId.values());
        localStorage.setItem(KEYS.bids, JSON.stringify(merged));
        resolve({
          success: true,
          message: `Imported ${imported} new, replaced ${replaced}, skipped ${skipped}`,
          imported,
          replaced,
          skipped,
          ids,
        });
      } catch {
        resolve({ success: false, message: 'Failed to parse file (must be valid JSON)', imported: 0, replaced: 0, skipped: 0, ids: [] });
      }
    };
    reader.onerror = () =>
      resolve({ success: false, message: 'Failed to read file', imported: 0, replaced: 0, skipped: 0, ids: [] });
    reader.readAsText(file);
  });
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
