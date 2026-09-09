export const proposalTemplates = [
  {
    id: 'template-invoice-compact',
    name: 'Invoice — Compact Template',
    description: 'Dense, clean invoice layout with teal accents (#0f766e), SAC/HSN codes, rate, discount, tax split & bank details.',
    category: 'Invoice',
    documentType: 'invoice',
    invoiceStyle: 'compact',
    company: 'Nimbus Software Solutions',
    companyMeta: 'Hitech Towers, Madhapur, Hyderabad, TG 500081 · GSTIN 36AABCN1234F1Z5 · hello@nimbussoft.in',
    proposalTitle: 'INVOICE',
    proposalNumber: 'INV-2026-0142',
    date: '2026-09-09',
    validUntil: '2026-09-24',
    invoiceStatus: 'PENDING',
    preparedFor: 'Aarav Retail Pvt Ltd',
    clientAddress: 'Plot 22, Jubilee Enclave, Kondapur, Hyderabad, TG 500084 · GSTIN 36AACCA5678K1Z2',
    placeOfSupply: 'Telangana (Intra-state)',
    paymentTerms: 'Net 15 days',
    currency: 'INR',
    invoiceItems: [
      { id: 'inv-1', description: 'Web Application Development', hsnSac: 'SAC 998314', qty: 40, unit: 'hrs', rate: 1500, discountPct: 10, taxPct: 18 },
      { id: 'inv-2', description: 'UI/UX Design Services', hsnSac: 'SAC 998314', qty: 20, unit: 'hrs', rate: 1200, discountPct: 0, taxPct: 18 },
      { id: 'inv-3', description: 'Cloud Hosting Setup, Annual', hsnSac: 'SAC 998315', qty: 1, unit: 'unit', rate: 15000, discountAmount: 1000, taxPct: 18 }
    ],
    cgstPct: 9,
    sgstPct: 9,
    notes: 'Quote invoice number with payment. 1.5% monthly interest applies after due date.',
    bankName: 'HDFC Bank',
    accountNo: '50100234567890',
    ifscCode: 'HDFC0001234',
    upiId: 'nimbussoft@hdfcbank',
    sections: []
  },
  {
    id: 'template-invoice-standard',
    name: 'Invoice — Standard Template',
    description: 'Executive invoice layout with royal blue accents (#2454a8), logo mark, HSN codes, payment terms & notes.',
    category: 'Invoice',
    documentType: 'invoice',
    invoiceStyle: 'standard',
    company: 'Nimbus Software Solutions',
    companyBadge: 'NS',
    companyMeta: '4th Floor, Hitech Towers, Madhapur\nHyderabad, Telangana 500081\nGSTIN: 36AABCN1234F1Z5 · hello@nimbussoft.in',
    proposalTitle: 'INVOICE',
    proposalNumber: 'INV-2026-0142',
    date: '2026-09-09',
    validUntil: '2026-09-24',
    invoiceStatus: 'Pending',
    preparedFor: 'Aarav Retail Pvt Ltd',
    clientAddress: 'Plot 22, Jubilee Enclave, Kondapur\nHyderabad, Telangana 500084\nGSTIN: 36AACCA5678K1Z2',
    placeOfSupply: 'Telangana (Intra-state)',
    paymentTerms: 'Net 15 days',
    currency: 'INR',
    invoiceItems: [
      { id: 'inv-1', description: 'Web Application Development', hsnSac: 'HSN/SAC 998314', qty: 40, unit: 'hrs', rate: 1500, discountPct: 10, taxPct: 18 },
      { id: 'inv-2', description: 'UI/UX Design Services', hsnSac: 'HSN/SAC 998314', qty: 20, unit: 'hrs', rate: 1200, discountPct: 0, taxPct: 18 },
      { id: 'inv-3', description: 'Cloud Hosting Setup (Annual)', hsnSac: 'HSN/SAC 998315', qty: 1, unit: 'unit', rate: 15000, discountAmount: 1000, taxPct: 18 }
    ],
    cgstPct: 9,
    sgstPct: 9,
    notes: 'Thank you for the opportunity. Please quote the invoice number in your payment reference. Late payments may attract 1.5% monthly interest as per terms.',
    bankName: 'HDFC Bank Ltd',
    accountNo: '50100234567890',
    ifscCode: 'HDFC0001234',
    upiId: 'nimbussoft@hdfcbank',
    sections: []
  },
  {
    id: 'template-sample',
    name: 'iBunify Standard Proposal',
    description: 'Complete sales proposal template with scope, timeline, and commercials.',
    category: 'Standard',
    company: 'iBunify',
    proposalTitle: 'Digital Workspace Transformation Proposal',
    preparedFor: 'Client Company Name',
    preparedBy: 'iBunify Sales Team',
    currency: 'INR',
    useStructuredCommercials: false,
    commercialItems: [
      { id: 'item-1', name: 'Implementation & Configuration', qty: 1, unitPrice: 250000 },
      { id: 'item-2', name: 'Annual Platform Subscription', qty: 1, unitPrice: 480000 }
    ],
    taxRate: 18,
    sections: [
      {
        id: 'tpl-s1',
        title: 'Executive Summary',
        content: 'iBunify proposes a secure, scalable digital workspace solution tailored to centralize collaboration and automate routine operations.'
      },
      {
        id: 'tpl-s2',
        title: 'Client Objectives',
        content: '• Unify internal communication\n• Streamline approval workflows\n• Improve executive visibility into active projects'
      },
      {
        id: 'tpl-s3',
        title: 'Proposed Solution',
        content: 'A fully configured cloud workspace with custom role permissions, approval pipelines, real-time analytics, and user onboarding.'
      },
      {
        id: 'tpl-s4',
        title: 'Scope & Timeline',
        content: 'Phase 1: Architecture & Design (1 Week)\nPhase 2: Configuration & Testing (2 Weeks)\nPhase 3: Training & Go-Live (1 Week)'
      },
      {
        id: 'tpl-s5',
        title: 'Terms & Acceptance',
        content: 'Validity: 30 Days\nPayment: 50% advance, 50% on project sign-off.'
      }
    ]
  },
  {
    id: 'template-ai-platform',
    name: 'AI Customer Engagement Platform',
    description: 'Product proposal tailored for AI-powered CRM, chatbots, and omnichannel support.',
    category: 'Product & AI',
    company: 'iBunify',
    proposalTitle: 'AI-Powered Omnichannel Engagement Platform Proposal',
    preparedFor: 'Enterprise Client',
    preparedBy: 'iBunify Enterprise Team',
    currency: 'USD',
    useStructuredCommercials: true,
    commercialItems: [
      { id: 'ai-1', name: 'AI Conversational Engine Setup', qty: 1, unitPrice: 5000 },
      { id: 'ai-2', name: 'CRM & Helpdesk Integration', qty: 1, unitPrice: 3500 },
      { id: 'ai-3', name: 'Monthly Agent Seats (12 Months)', qty: 25, unitPrice: 480 }
    ],
    taxRate: 10,
    sections: [
      {
        id: 'ai-s1',
        title: 'Executive Overview',
        content: 'Deploy iBunify AI Assistant to handle incoming customer inquiries 24/7 across WhatsApp, Web Chat, and Email.'
      },
      {
        id: 'ai-s2',
        title: 'Key Capabilities',
        content: '1. Intelligent Sentiment Analysis & Routing\n2. Automated Ticket Resolution\n3. Omnichannel Dashboard'
      },
      {
        id: 'ai-s3',
        title: 'Commercial Terms',
        content: 'Monthly billing with annual commitment. Dedicated account manager included.'
      }
    ]
  },
  {
    id: 'template-blank',
    name: 'Blank Custom Proposal',
    description: 'Clean canvas with empty sections to build custom proposals from scratch.',
    category: 'Custom',
    company: 'iBunify',
    proposalTitle: 'Custom Business Proposal',
    preparedFor: '',
    preparedBy: 'Sales Representative',
    currency: 'INR',
    useStructuredCommercials: false,
    commercialItems: [],
    taxRate: 18,
    sections: [
      {
        id: 'blank-s1',
        title: 'Executive Summary',
        content: 'Enter executive summary here.'
      }
    ]
  }
];
