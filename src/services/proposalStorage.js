import { STORAGE_KEY_V1, STORAGE_KEY_V2, sampleProposal } from '../data/defaults.js';
import { proposalTemplates } from '../data/templates.js';

export function loadProposalsFromStorage() {
  const standardInvoiceTemplate = proposalTemplates.find((t) => t.id === 'template-invoice-standard') || proposalTemplates[0];

  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy compact invoices and ensure INR currency with GST
        const cleaned = withoutCompact.map((p) => {
          const company = (p.company === 'I-Globus Corporate Consulting' || p.company === 'iGlobus Corporate Consulting') ? 'iGLOBUS Corporate Consulting' : p.company;
          if (p.documentType === 'invoice') {
            return {
              ...p,
              company: company || 'iGLOBUS Corporate Consulting',
              currency: 'INR',
              cgstPct: typeof p.cgstPct === 'number' ? p.cgstPct : 9,
              sgstPct: typeof p.sgstPct === 'number' ? p.sgstPct : 9,
              taxRate: 18,
              invoiceStyle: 'standard'
            };
          }
          return { ...p, company };
        });

        // Deduplicate proposals based on type, title and preparedFor
        const seen = new Set();
        const deduplicated = [];
        for (const p of cleaned) {
          const key = `${p.documentType || 'proposal'}-${p.proposalTitle}-${p.preparedFor}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(p);
          }
        }

        // Ensure at least one standard invoice is present
        const hasInvoice = deduplicated.some((p) => p.documentType === 'invoice');
        if (!hasInvoice && standardInvoiceTemplate) {
          const defaultInvoice = { ...standardInvoiceTemplate, id: 'inv-standard-default' };
          delete defaultInvoice.name;
          delete defaultInvoice.description;
          delete defaultInvoice.category;
          deduplicated.push(defaultInvoice);
        }

        if (deduplicated.length > 0) {
          localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(deduplicated));
          return deduplicated;
        }
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

  // Fallback list: sample proposal + standard invoice
  const defaultInvoice = { ...standardInvoiceTemplate, id: 'inv-standard-default' };
  delete defaultInvoice.name;
  delete defaultInvoice.description;
  delete defaultInvoice.category;

  const fallbackList = [sampleProposal, defaultInvoice];
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
