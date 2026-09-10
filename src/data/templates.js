export const proposalTemplates = [
  {
    id: 'template-invoice-standard',
    name: 'Standard Invoice',
    description: 'Executive invoice layout with corporate logo, terms, line item details, CGST/SGST & bank transfer details.',
    category: 'Invoice',
    documentType: 'invoice',
    invoiceStyle: 'standard',
    company: 'I-Globus Corporate Consulting',
    companyLogoUrl: 'https://cdn.magicpatterns.com/uploads/3KkWC6KLDLBJ93VSkPP3wQ/image.png',
    companyAddress: 'Techno Enclave Madhapur, Hyderabad, Telangana 500081',
    companyPhone: '084648 48389',
    proposalTitle: 'Invoice',
    proposalNumber: 'INV-2026-0148',
    date: '2026-09-10',
    validUntil: '2026-10-10',
    paymentTerms: 'Net 30',
    currency: 'INR',
    cgstPct: 9,
    sgstPct: 9,
    taxRate: 18,
    preparedFor: 'Northwind Retail Pvt. Ltd.',
    clientAttention: 'Attn: Priya Raman, Finance',
    clientAddress: '22 Harbour Line Road\nBandra East, Mumbai 400051\nIndia',
    clientEmail: 'accounts@northwindretail.com',
    invoiceItems: [
      {
        id: 'li-1',
        description: 'Product design retainer',
        detail: 'August 2026 — discovery, flows, and UI design',
        qty: 1,
        rate: 6800
      },
      {
        id: 'li-2',
        description: 'Frontend development',
        detail: 'Checkout rebuild, React + TypeScript',
        qty: 92,
        rate: 65
      },
      {
        id: 'li-3',
        description: 'Design system maintenance',
        detail: 'Component updates and documentation',
        qty: 18,
        rate: 60
      },
      {
        id: 'li-4',
        description: 'QA and release support',
        detail: 'Regression passes across two releases',
        qty: 12,
        rate: 55
      }
    ],
    notes:
      'Payment by bank transfer to iGlobus Pvt. Ltd., HDFC Bank, A/C 5010 2233 4455, IFSC HDFC0000123. Please reference the invoice number with your payment.',
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
