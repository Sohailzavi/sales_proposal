import { STORAGE_KEY_V1, STORAGE_KEY_V2, sampleProposal } from '../data/defaults.js';
import { proposalTemplates } from '../data/templates.js';

function sanitizeProposalData(data) {
  if (typeof data === 'string') {
    return data
      .replace(/[iI][bB][uU][nN][iI][fF][yY]/g, 'iBUNIFY');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeProposalData);
  }
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      res[key] = sanitizeProposalData(data[key]);
    }
    return res;
  }
  return data;
}

export function loadProposalsFromStorage() {
  const standardInvoiceTemplate = proposalTemplates.find((t) => t.id === 'template-invoice-standard') || proposalTemplates[0];

  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy compact invoices, ensure INR currency with GST, and normalize ibunify
        const cleanDateField = (val) => {
          if (!val || typeof val !== 'string') return '';
          const trimmed = val.trim();
          if (
            trimmed === '[Date]' ||
            trimmed === '[Effective Date]' ||
            trimmed === 'August 2026' ||
            trimmed === '2026-09-10' ||
            trimmed === '2026-09-11' ||
            trimmed === '2026-09-12' ||
            trimmed === '2026-09-13' ||
            trimmed === '2026-09-14' ||
            trimmed === '2026-09-15'
          ) {
            return '';
          }
          return trimmed;
        };
        const cleanContactsField = (c) => {
          if (!c || c.includes('Contacts: Rama Krishna') || c === 'Rama Krishna | Sohail' || c === 'Rama Krishna | Sohail | Ramyasree') {
            return 'Product Owner: Rama Krishna | CTO';
          }
          return c;
        };
        const cleanProductLeadField = (pl) => {
          if (!pl || pl.includes('Sohail') || pl.includes('Ramyasree') || pl.includes('Ramya')) {
            return 'Product Lead: Rama Krishna';
          }
          return pl;
        };
        const cleanAddress = (addr) => {
          if (!addr || addr === 'Headquarters: Madhapur, Opp. Raheja Mindspace, Hyderabad') {
            return 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad';
          }
          return addr;
        };
        const cleanPortalsField = (portals) => {
          if (!portals || portals === 'Digital Portals: www.ibunify.com | www.iglobuscc.com') {
            return 'Portals: www.ibunify.com | www.iglobuscc.com';
          }
          return portals;
        };
        const cleanSignatoryTitle = (t) => {
          if (!t || t === 'CTO' || t === 'FOR ibunify TECHNOLOGIES' || (typeof t === 'string' && (t.includes('FOR ibunify') || t.includes('FOR: ibunify')))) {
            return 'Enterprise Practice Leads';
          }
          return t;
        };
        const cleanProposalNumber = (num, docType) => {
          if (docType === 'commercial_proposal' && (!num || num === 'IGC-ibunify-PROP-2026')) {
            return 'IGC-ibunify-05-2026';
          }
          return num;
        };
        const cleanPreparedFor = (pf) => {
          if (!pf || pf === 'Client Company Name') {
            return '[Client Company Name]';
          }
          return pf;
        };
        const withoutCompact = parsed.filter((p) => p.invoiceStyle !== 'compact');
        const cleaned = sanitizeProposalData(withoutCompact).map((p) => {
          let company = (p.company === 'I-Globus Corporate Consulting' || p.company === 'iGlobus Corporate Consulting') ? 'iGLOBUS Corporate Consulting' : p.company;
          if (company === 'ibunify (iGLOBUS Corporate Consulting Pvt. Ltd.)' || company === 'ibunify (iGLOBUS Corporate Consulting)') {
            company = 'ibunify (iGLOBUS Corporate Consulting)';
          }
          const sanitizedProposal = {
            ...p,
            proposalNumber: cleanProposalNumber(p.proposalNumber, p.documentType),
            preparedFor: cleanPreparedFor(p.preparedFor),
            companyAddress: cleanAddress(p.companyAddress),
            portals: cleanPortalsField(p.portals),
            contacts: cleanContactsField(p.contacts),
            productLead: cleanProductLeadField(p.productLead),
            leadSignatoryTitle: cleanSignatoryTitle(p.leadSignatoryTitle),
            providerSignatoryTitle: cleanSignatoryTitle(p.providerSignatoryTitle),
            acceptedByDesignation: cleanSignatoryTitle(p.acceptedByDesignation),
            footerContacts: p.footerContacts ? cleanContactsField(p.footerContacts) : p.footerContacts,
            date: cleanDateField(p.date),
            effectiveDate: cleanDateField(p.effectiveDate),
            executionDate: cleanDateField(p.executionDate),
            poDate: cleanDateField(p.poDate),
            handoverDate: cleanDateField(p.handoverDate),
            clientSignDate: cleanDateField(p.clientSignDate),
            leadSignDate: cleanDateField(p.leadSignDate),
            providerSignDate: cleanDateField(p.providerSignDate),
            issuedByDate: cleanDateField(p.issuedByDate),
            acceptedByDate: cleanDateField(p.acceptedByDate),
            acceptedDate: cleanDateField(p.acceptedDate),
            deliveredDate: cleanDateField(p.deliveredDate),
            handoverAcceptClientDate: cleanDateField(p.handoverAcceptClientDate),
            handoverDeliveredLeadDate: cleanDateField(p.handoverDeliveredLeadDate),
          };
          if (p.documentType === 'invoice') {
            return {
              ...sanitizedProposal,
              company: company || 'iGLOBUS Corporate Consulting',
              currency: 'INR',
              cgstPct: typeof p.cgstPct === 'number' ? p.cgstPct : 9,
              sgstPct: typeof p.sgstPct === 'number' ? p.sgstPct : 9,
              taxRate: 18,
              invoiceStyle: 'standard'
            };
          }
          if (p.id === 'sample-ibunify-proposal-001' || p.proposalTitle === 'Digital Workspace Transformation Proposal') {
            return {
              ...sampleProposal,
              id: 'sample-ibunify-proposal-001'
            };
          }
          return { ...sanitizedProposal, company };
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
          ...sanitizeProposalData(v1Parsed),
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
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(sanitizeProposalData(proposals)));
  } catch (err) {
    console.error('Failed to save proposals to storage:', err);
  }
}
