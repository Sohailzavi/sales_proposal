export const STORAGE_KEY_V1 = 'ibunify-sales-proposal-v1';
export const STORAGE_KEY_V2 = 'ibunify-sales-proposals-v2';
export const AUTH_STORAGE_KEY = 'ibunify-sales-auth-v1';
export const LOGIN_EMAIL = 'sales@gmail.com';
export const LOGIN_PASSWORD = 'Sales@2026';
export const OFFICIAL_PROPOSAL_FILE = '/iBunify-Overall-Proposal.pdf';

export const documentFormats = [
  { id: 'all', label: 'All documents', extension: 'ALL', icon: '📄', count: 3 },
  { id: 'pdf', label: 'PDF', extension: 'PDF', icon: '📕', count: 1 },
  { id: 'word', label: 'Word', extension: 'DOC', icon: '📘', count: 0 },
  { id: 'html', label: 'Web', extension: 'HTML', icon: '🌐', count: 0 },
  { id: 'json', label: 'Backups', extension: 'JSON', icon: '💾', count: 0 },
  { id: 'invoice', label: 'Invoices', extension: 'INV', icon: '🧾', count: 2 }
];

export const sampleProposal = {
  id: 'sample-ibunify-proposal-001',
  company: 'iBunify',
  proposalTitle: 'Digital Workspace Transformation Proposal',
  proposalNumber: 'IBU-SP-2026-001',
  preparedFor: 'Acme Enterprises Pvt. Ltd.',
  preparedBy: 'iBunify Sales Team',
  date: new Date().toISOString().slice(0, 10),
  validUntil: '',
  currency: 'INR',
  useStructuredCommercials: false,
  commercialItems: [
    { id: 'item-1', name: 'Discovery & Solution Design', qty: 1, unitPrice: 50000 },
    { id: 'item-2', name: 'Workspace Configuration & Workflows', qty: 1, unitPrice: 200000 },
    { id: 'item-3', name: 'Annual Platform Subscription', qty: 1, unitPrice: 480000 },
    { id: 'item-4', name: 'Managed Support (1 Year)', qty: 12, unitPrice: 25000 }
  ],
  taxRate: 18,
  sections: [
    {
      id: 'sec-1',
      title: 'Executive Summary',
      content:
        'iBunify proposes a secure, scalable, and user-friendly digital workspace solution for Acme Enterprises. The solution will centralize collaboration, automate routine workflows, and improve visibility across teams while reducing operational overhead.'
    },
    {
      id: 'sec-2',
      title: 'Client Objectives',
      content:
        '• Create a unified workspace for employees and partners\n• Reduce manual follow-ups and scattered communication\n• Improve document accessibility and approval tracking\n• Provide management with real-time visibility into work progress'
    },
    {
      id: 'sec-3',
      title: 'Proposed Solution',
      content:
        'iBunify will configure a modular digital workspace consisting of team spaces, document repositories, automated approval flows, dashboards, notifications, access controls, and onboarding support. The implementation will be tailored to the client’s operating model and branding.'
    },
    {
      id: 'sec-4',
      title: 'Scope of Work',
      content:
        '1. Discovery and requirements workshop\n2. Workspace architecture and configuration\n3. User roles and permission setup\n4. Workflow and approval automation\n5. Dashboard and reporting setup\n6. User acceptance testing\n7. Admin training and go-live support'
    },
    {
      id: 'sec-5',
      title: 'Implementation Timeline',
      content:
        'Week 1: Discovery and solution design\nWeek 2–3: Configuration and workflow setup\nWeek 4: Testing and refinements\nWeek 5: Training, go-live, and handover'
    },
    {
      id: 'sec-6',
      title: 'Commercial Proposal',
      content:
        'Implementation fee: ₹2,50,000\nAnnual platform subscription: ₹4,80,000\nOptional managed support: ₹25,000 per month\nTaxes will be charged as applicable.'
    },
    {
      id: 'sec-7',
      title: 'Terms and Conditions',
      content:
        '• Proposal validity: 30 days\n• Payment terms: 50% advance, 40% before go-live, 10% after handover\n• Client will provide required content, approvals, and system access on time\n• Any material scope change may require a revised estimate'
    },
    {
      id: 'sec-8',
      title: 'Acceptance',
      content:
        'By signing below, both parties confirm their intent to proceed with the scope, commercials, and terms described in this proposal.\n\nClient Name:\nDesignation:\nSignature:\nDate:'
    }
  ]
};
