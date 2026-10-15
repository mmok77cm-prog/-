import { SurveyingTransaction } from '../types';
import { INITIAL_SURVEY_TRANSACTIONS } from '../data/mockTransactions';

export const TRANSACTIONS_STORAGE_KEY = 'engitrack_survey_transactions_v2';
export const ACTIVE_TAB_STORAGE_KEY = 'engitrack_active_tab_v2';
export const LAST_SAVED_STORAGE_KEY = 'engitrack_last_saved_timestamp';

/**
 * Safely load transactions from localStorage, falling back to INITIAL_SURVEY_TRANSACTIONS.
 */
export function loadSavedTransactions(): SurveyingTransaction[] {
  if (typeof window === 'undefined') {
    return INITIAL_SURVEY_TRANSACTIONS;
  }

  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      return INITIAL_SURVEY_TRANSACTIONS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate that at least the first item has the required structure
      const sample = parsed[0];
      if (sample && typeof sample === 'object' && 'id' in sample && 'steps' in sample) {
        return parsed as SurveyingTransaction[];
      }
    }
  } catch (error) {
    console.warn('تعذر قراءة بيانات المعاملات المحفوظة من المتصفح، سيتم استخدام البيانات الافتراضية:', error);
  }

  return INITIAL_SURVEY_TRANSACTIONS;
}

/**
 * Safely save transactions to localStorage.
 */
export function saveTransactions(transactions: SurveyingTransaction[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const jsonStr = JSON.stringify(transactions);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, jsonStr);
    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SAVED_STORAGE_KEY, nowIso);
    return true;
  } catch (error) {
    console.error('فشل في حفظ المعاملات إلى الذاكرة المحلية (localStorage):', error);
    return false;
  }
}

/**
 * Reset local storage back to initial default transactions.
 */
export function resetTransactionsToDefault(): SurveyingTransaction[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      localStorage.removeItem(LAST_SAVED_STORAGE_KEY);
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
  }
  return INITIAL_SURVEY_TRANSACTIONS;
}

/**
 * Export current transactions as a downloaded JSON file backup.
 */
export function exportTransactionsAsJson(transactions: SurveyingTransaction[]): void {
  const exportPayload = {
    app: 'EngiTrack',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    totalRecords: transactions.length,
    transactions,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `engitrack-transactions-backup-${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse an imported backup file.
 */
export function parseTransactionsBackup(jsonString: string): SurveyingTransaction[] {
  const parsed = JSON.parse(jsonString);

  let rawList: unknown = parsed;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'transactions' in parsed) {
    rawList = (parsed as { transactions: unknown }).transactions;
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('الملف المحدد لا يحتوي على قائمة معاملات مساحية صالحة.');
  }

  // Basic validation of fields
  const sample = rawList[0];
  if (!sample || typeof sample !== 'object' || !('id' in sample) || !('referenceCode' in sample) || !('steps' in sample)) {
    throw new Error('صيغة بيانات المعاملات في الملف غير مطابقة لهيكل النظام.');
  }

  return rawList as SurveyingTransaction[];
}

/**
 * Get current storage diagnostics.
 */
export function getStorageDiagnostics(): {
  recordsCount: number;
  estimatedBytes: number;
  lastSavedAt: string | null;
} {
  if (typeof window === 'undefined') {
    return { recordsCount: 0, estimatedBytes: 0, lastSavedAt: null };
  }

  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const lastSaved = localStorage.getItem(LAST_SAVED_STORAGE_KEY);
    const bytes = raw ? new Blob([raw]).size : 0;
    const count = raw ? (JSON.parse(raw) as unknown[]).length : 0;
    return {
      recordsCount: count,
      estimatedBytes: bytes,
      lastSavedAt: lastSaved,
    };
  } catch {
    return { recordsCount: 0, estimatedBytes: 0, lastSavedAt: null };
  }
}
