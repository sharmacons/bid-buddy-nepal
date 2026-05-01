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
  errors?: string[];
  warnings?: string[];
}

// ─── Schema validation helpers ───
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Validate the shape of a parsed JSON payload.
 * Returns the list of candidate bids together with any validation errors/warnings.
 */
function validateImportPayload(raw: unknown): {
  bids: BidData[];
  errors: string[];
  warnings: string[];
  shape: 'BidExport' | 'Backup' | 'Array' | 'SingleBid' | 'Unknown';
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (raw === null || raw === undefined) {
    return { bids: [], errors: ['File is empty'], warnings, shape: 'Unknown' };
  }
  if (typeof raw !== 'object') {
    return { bids: [], errors: ['Root JSON value must be an object or array'], warnings, shape: 'Unknown' };
  }

  let candidates: unknown[] = [];
  let shape: 'BidExport' | 'Backup' | 'Array' | 'SingleBid' | 'Unknown' = 'Unknown';

  if (Array.isArray(raw)) {
    shape = 'Array';
    candidates = raw;
  } else if (isPlainObject(raw)) {
    const obj = raw;
    if (obj.kind === 'bidready-bid-export') {
      shape = 'BidExport';
      if (!Array.isArray(obj.bids)) {
        errors.push('Bid export file is missing the "bids" array');
      } else {
        candidates = obj.bids;
      }
      if (obj.version && obj.version !== '1.0') {
        warnings.push(`Unknown export version "${String(obj.version)}" — proceeding anyway`);
      }
    } else if ('version' in obj && 'bids' in obj && Array.isArray(obj.bids)) {
      shape = 'Backup';
      candidates = obj.bids as unknown[];
      warnings.push('Detected full system backup — only the bids section will be imported. Use Restore Backup to import everything.');
    } else if ('projectName' in obj && 'boqItems' in obj) {
      shape = 'SingleBid';
      candidates = [obj];
    } else {
      errors.push('Unrecognised file format. Expected a bid export, backup, or a single bid object.');
    }
  }

  if (errors.length === 0 && candidates.length === 0) {
    errors.push('No bids were found in the file');
  }

  // Validate every candidate bid
  const validBids: BidData[] = [];
  candidates.forEach((c, i) => {
    const label = `Bid #${i + 1}`;
    if (!isPlainObject(c)) {
      warnings.push(`${label}: not an object — skipped`);
      return;
    }
    const projectName = c.projectName;
    if (typeof projectName !== 'string' || !projectName.trim()) {
      warnings.push(`${label}: missing required "projectName" — skipped`);
      return;
    }
    if ('boqItems' in c && c.boqItems !== undefined && c.boqItems !== null && !Array.isArray(c.boqItems)) {
      warnings.push(`${label} (${projectName}): "boqItems" must be an array — skipped`);
      return;
    }
    if ('jvPartners' in c && c.jvPartners !== undefined && c.jvPartners !== null && !Array.isArray(c.jvPartners)) {
      warnings.push(`${label} (${projectName}): "jvPartners" must be an array — ignored`);
    }
    if ('workSchedule' in c && c.workSchedule !== undefined && c.workSchedule !== null && !Array.isArray(c.workSchedule)) {
      warnings.push(`${label} (${projectName}): "workSchedule" must be an array — ignored`);
    }
    validBids.push(c as unknown as BidData);
  });

  return { bids: validBids, errors, warnings, shape };
}

export function importBidsFromFile(
  file: File,
  options: { onConflict?: 'replace' | 'duplicate' | 'skip' } = {}
): Promise<ImportBidsResult> {
  const onConflict = options.onConflict ?? 'replace';
  return new Promise((resolve) => {
    // Pre-flight checks
    if (!file) {
      resolve({ success: false, message: 'No file selected', imported: 0, replaced: 0, skipped: 0, ids: [] });
      return;
    }
    const nameOk = /\.json$/i.test(file.name);
    const typeOk = !file.type || file.type === 'application/json' || file.type === 'text/plain';
    if (!nameOk && !typeOk) {
      resolve({
        success: false,
        message: `Unsupported file type "${file.type || file.name}". Please upload a .json file exported from BidReady.`,
        imported: 0, replaced: 0, skipped: 0, ids: [],
      });
      return;
    }
    if (file.size === 0) {
      resolve({ success: false, message: 'File is empty', imported: 0, replaced: 0, skipped: 0, ids: [] });
      return;
    }
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB safety cap
    if (file.size > MAX_BYTES) {
      resolve({
        success: false,
        message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 25 MB.`,
        imported: 0, replaced: 0, skipped: 0, ids: [],
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let raw: unknown;
      try {
        raw = JSON.parse(e.target?.result as string);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown parse error';
        resolve({
          success: false,
          message: `Invalid JSON: ${msg}`,
          imported: 0, replaced: 0, skipped: 0, ids: [],
        });
        return;
      }

      const { bids: incoming, errors, warnings } = validateImportPayload(raw);
      if (errors.length > 0 || incoming.length === 0) {
        resolve({
          success: false,
          message: errors[0] || 'No valid bids found in file',
          imported: 0, replaced: 0, skipped: 0, ids: [],
          errors, warnings,
        });
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
          warnings,
        });
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
