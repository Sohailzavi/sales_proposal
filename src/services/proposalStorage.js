import { STORAGE_KEY_V1, STORAGE_KEY_V2, sampleProposal, DEFAULT_COMMERCIAL_SCOPES } from '../data/defaults.js';
import { proposalTemplates } from '../data/templates.js';

function sanitizeProposalData(data) {
  if (typeof data === 'string') {
    return data
      .replace(/[iI][bB][uU][nN][iI][fF][yY]/g, 'ibunify');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeProposalData);
  }
  if (data && typeof data === 'object') {
    const res = {};
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
        const withoutCompact = parsed.filter((p) => p.invoiceStyle !== 'compact');
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
          if (!c || c.includes('Contacts: Rama Krishna') || c === 'Rama Krishna | Sohail' || c === 'Rama Krishna | Sohail | Ramyasree' || c === 'Product Owner: Rama Krishna | CTO') {
            return 'Product Owner: Pavan Chandra Duddilla';
          }
          return c;
        };
        const cleanProductLeadField = (pl) => {
          if (!pl || pl === 'Rama Krishna' || pl === 'Product Lead: Rama Krishna' || pl === 'Rama Krishna | CTO' || pl.includes('Ramyasree') || pl === 'Product Lead: Ramyasree (+91 63005 61742 | ramyasree@iglobuscc.com)') {
            return 'Product Lead: Ramya | Sohail';
          }
          return pl;
        };
        const cleanSignatoryName = (sn) => {
          if (!sn || sn === 'Rama Krishna' || sn.includes('Rama Krishna')) {
            return 'Pavan Chandra Duddilla';
          }
          return sn;
        };
        const cleanSignatoryTitle = (st) => {
          if (!st || st.includes('Practice Leads') || st.includes('Enterprise Lead') || st === 'Enterprise Practice Leads') {
            return 'Director';
          }
          return st;
        };
        const cleanAddress = (addr) => {
          if (!addr || addr.includes('Madhapur') || addr.includes('Hyderabad')) {
            return 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad';
          }
          return addr;
        };
        const cleanPortalsField = (portals) => {
          if (!portals || portals.includes('ibunify.com') || portals.includes('iglobuscc.com')) {
            return 'Portals: www.ibunify.com | www.iglobuscc.com';
          }
          return portals;
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
        const cleanCommercialItems = (items) => {
          if (!Array.isArray(items) || items.length === 0) {
            return [
              { id: 'cs-1', component: 'One-Time Setup & Implementation', scope: DEFAULT_COMMERCIAL_SCOPES[0], investment: '₹50,000 (One-Time)' },
              { id: 'cs-2', component: 'ibunify CRM User License', scope: DEFAULT_COMMERCIAL_SCOPES[1], investment: '₹2,500 / user / month' },
              { id: 'cs-3', component: 'WhatsApp Business Platform', scope: DEFAULT_COMMERCIAL_SCOPES[2], investment: '₹15,000 for 6 Months' },
              { id: 'cs-4', component: 'WhatsApp Message Wallet', scope: DEFAULT_COMMERCIAL_SCOPES[3], investment: '₹10,000 Prepaid' },
              { id: 'cs-5', component: 'Cloud Telephony Virtual Numbers', scope: DEFAULT_COMMERCIAL_SCOPES[4], investment: '₹1,500 / Number / mo' },
              { id: 'cs-6', component: 'AI Agent Calling', scope: DEFAULT_COMMERCIAL_SCOPES[5], investment: '₹7 / call' }
            ];
          }
          return items.map((item, idx) => ({
            ...item,
            component: item.component === 'One-Time Setup & Onboarding' ? 'One-Time Setup & Implementation' : item.component,
            scope: (item.scope && item.scope.trim()) ? item.scope : ((item.deliverables && item.deliverables.trim()) ? item.deliverables : (DEFAULT_COMMERCIAL_SCOPES[idx] || ''))
          }));
        };
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
            leadSignatoryName: cleanSignatoryName(p.leadSignatoryName),
            providerSignatoryName: cleanSignatoryName(p.providerSignatoryName),
            acceptedByAuthorized: cleanSignatoryName(p.acceptedByAuthorized),
            deliveredByLead: cleanSignatoryName(p.deliveredByLead),
            leadSignatoryTitle: cleanSignatoryTitle(p.leadSignatoryTitle),
            providerSignatoryTitle: cleanSignatoryTitle(p.providerSignatoryTitle),
            acceptedByDesignation: cleanSignatoryTitle(p.acceptedByDesignation),
            commercialScheduleItems: cleanCommercialItems(p.commercialScheduleItems),
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
          if (p.id === 'sample-custom-proposal-001' || p.id === 'sample-ibunify-proposal-001' || p.documentType === 'proposal') {
            return {
              ...sampleProposal,
              id: p.id || 'sample-ibunify-proposal-001',
              documentType: 'proposal'
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
