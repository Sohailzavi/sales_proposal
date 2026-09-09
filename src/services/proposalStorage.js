import { STORAGE_KEY_V1, STORAGE_KEY_V2, sampleProposal } from '../data/defaults.js';

export function loadProposalsFromStorage() {
  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Check for V1 legacy proposal to perform non-destructive migration
    const v1Raw = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Raw) {
      const v1Parsed = JSON.parse(v1Raw);
      if (v1Parsed && typeof v1Parsed === 'object') {
        const migratedProposal = {
          ...v1Parsed,
          id: v1Parsed.id || `migrated-${Date.now()}`
        };
        const initialList = [migratedProposal];
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(initialList));
        return initialList;
      }
    }
  } catch (err) {
    console.error('Failed to load proposals from storage:', err);
  }

  // Fallback to initial sample proposal
  const fallbackList = [sampleProposal];
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(fallbackList));
  } catch (e) {
    console.error('Failed to initialize fallback proposal in storage:', e);
  }
  return fallbackList;
}

export function saveProposalsToStorage(proposals) {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(proposals));
  } catch (err) {
    console.error('Failed to save proposals to storage:', err);
  }
}
