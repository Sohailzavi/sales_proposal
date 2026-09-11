export const STORAGE_KEY_V1 = 'ibunify-sales-proposal-v1';
export const STORAGE_KEY_V2 = 'ibunify-sales-proposals-v2';
export const AUTH_STORAGE_KEY = 'ibunify-sales-auth-v1';
export const LOGIN_EMAIL = 'sales@gmail.com';
export const LOGIN_PASSWORD = 'Sales@2026';
export const OFFICIAL_PROPOSAL_FILE = '/iBunify-Overall-Proposal.pdf';

export const documentFormats = [
  { id: 'all', label: 'All Assets', extension: 'ALL', count: 11 },
  { id: 'pdf', label: 'Corporate Deck', extension: 'PDF', count: 1 },
  { id: 'discovery', label: 'Discovery & Scoping', extension: 'DISC', count: 1 },
  { id: 'nda', label: 'Mutual NDA', extension: 'NDA', count: 1 },
  { id: 'msa', label: 'Master Services Agreement', extension: 'MSA', count: 1 },
  { id: 'commercial_proposal', label: 'Statement of Work (SOW)', extension: 'SOW', count: 1 },
  { id: 'sla', label: 'Service Level Agreement', extension: 'SLA', count: 1 },
  { id: 'po', label: 'Purchase Order', extension: 'PO', count: 1 },
  { id: 'handover', label: 'Delivery', extension: 'DEL', count: 1 },
  { id: 'closure', label: 'Closure', extension: 'CLS', count: 1 },
  { id: 'proposal', label: 'Custom Proposal', extension: 'PROP', count: 1 },
  { id: 'invoice', label: 'Invoices', extension: 'INV', count: 1 }
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

export const sampleDiscoveryDoc = {
  id: 'sample-discovery-001',
  documentType: 'discovery',
  badge: 'DISCOVERY — REQUIREMENT GATHERING & SCOPING',
  proposalTitle: 'Discovery — Requirement Gathering & Scoping',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  description: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  proposalNumber: 'IGC-IBUNIFY-01-2026',
  date: new Date().toISOString().slice(0, 10),
  preparedFor: 'Client Company Name',
  clientAttention: 'Attn: Project Sponsor / Sales Leadership',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  clientSignatory: 'Client Signatory: ______________________',
  leadSignatory: 'iBUNIFY Lead: Rama Krishna / Sohail',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  useStructuredTable: true,
  pipelineStages: [
    {
      id: 'ps-1',
      stage: 'Stage 1: Lead Ingested',
      objective: 'Capture complete prospect metadata',
      action: 'Instant CRM record created + auto-assigned via round-robin.'
    },
    {
      id: 'ps-2',
      stage: 'Stage 2: Instant Outreach',
      objective: 'Connect within < 1 minute',
      action: 'AI Calling agent dials lead + WhatsApp brochure dispatched.'
    },
    {
      id: 'ps-3',
      stage: 'Stage 3: Site Visit Scheduled',
      objective: 'Confirm property visit appointment',
      action: 'Location pin sent on WhatsApp + calendar task created.'
    },
    {
      id: 'ps-4',
      stage: 'Stage 4: Negotiation & Booking',
      objective: 'Finalize unit selection and payment',
      action: 'Payment milestone tracker activated + contract logged.'
    }
  ],
  sections: [
    {
      id: 'disc-sec-1',
      title: '1. BUSINESS OBJECTIVES & OPERATIONAL SCOPE',
      content:
        'This Discovery Document establishes the functional and technical requirements for deploying the iBUNIFY platform. It maps existing lead channels, sales team structures, and automation triggers.'
    },
    {
      id: 'disc-sec-2',
      title: '2. LEAD INGESTION & CHANNEL ARCHITECTURE',
      content:
        '• Digital Channels: Meta Ads (Facebook/Instagram), Google Search & Display Ads, Website Landing Page forms.\n• Real Estate Portals: Automated webhook ingestion from 99acres, MagicBricks, Housing.com, and CommonFloor.\n• Inbound & Offline: Dedicated Cloud Telephony virtual numbers, QR code campaign scans, and property walk-in entries.'
    },
    {
      id: 'disc-sec-3',
      title: '3. SALES HIERARCHY & PIPELINE STAGES',
      content:
        'Configured pipeline stage mapping and automated CRM actions upon lead state transitions.'
    },
    {
      id: 'disc-sec-4',
      title: '4. SIGN-OFF FOR SCOPING BASELINE',
      content:
        'The undersigned agree that the requirements detailed above represent the baseline for project deployment.'
    }
  ]
};

export const sampleNdaDoc = {
  id: 'sample-nda-001',
  documentType: 'nda',
  badge: 'MUTUAL NON-DISCLOSURE AGREEMENT (NDA)',
  proposalTitle: 'Mutual Non-Disclosure Agreement',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  description: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  proposalNumber: 'IGC-IBUNIFY-02-2026',
  date: new Date().toISOString().slice(0, 10),
  effectiveDate: new Date().toISOString().slice(0, 10),
  preparedFor: 'Client Company Name',
  clientAttention: 'Attn: Project Sponsor / Sales Leadership',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  clientSignatory: 'FOR: [CLIENT COMPANY NAME]',
  clientSignatoryName: '',
  leadSignatory: 'FOR: iBUNIFY (iGLOBUS)',
  leadSignatoryName: 'Rama Krishna / Sohail',
  leadSignatoryTitle: 'Enterprise Practice Leads',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: [
    {
      id: 'nda-sec-1',
      title: '1. PURPOSE OF ENGAGEMENT',
      content:
        'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [Effective Date] by and between iGLOBUS Corporate Consulting Private Limited ("iBUNIFY") and [Client Company Name] ("Client") to protect proprietary technical, commercial, and customer information.'
    },
    {
      id: 'nda-sec-2',
      title: '2. DEFINITION OF CONFIDENTIAL INFORMATION',
      content:
        '"Confidential Information" includes all technical data, customer leads, pricing matrices, source codes, AI prompts, marketing strategies, telephony records, and business workflows disclosed by either party.'
    },
    {
      id: 'nda-sec-3',
      title: '3. OBLIGATIONS OF CONFIDENTIALITY',
      content:
        '• Both parties agree to hold all Confidential Information in strict trust and confidence using the same degree of care as for their own proprietary data (at minimum reasonable care).\n• Confidential Information shall not be disclosed to any third party without prior written authorization.\n• Full compliance with Indian Digital Personal Data Protection (DPDPA) Act 2023 regulations regarding Data Principal rights.'
    },
    {
      id: 'nda-sec-4',
      title: '4. TERM & EXECUTION',
      content:
        'This Agreement remains in effect for a period of Three (3) Years from the Effective Date.'
    }
  ]
};

export const sampleMsaDoc = {
  id: 'sample-msa-001',
  documentType: 'msa',
  badge: 'MASTER SERVICES AGREEMENT (MSA)',
  proposalTitle: 'Master Services Agreement (MSA)',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  description: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  proposalNumber: 'IGC-IBUNIFY-04-2026',
  date: new Date().toISOString().slice(0, 10),
  effectiveDate: new Date().toISOString().slice(0, 10),
  preparedFor: 'Client Company Name',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  clientSignatory: 'FOR: [CLIENT COMPANY NAME]',
  clientSignatoryName: '',
  leadSignatory: 'FOR: iBUNIFY (iGLOBUS)',
  leadSignatoryName: 'Rama Krishna / Sohail',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: [
    {
      id: 'msa-sec-1',
      title: '1. FRAMEWORK AGREEMENT & TERM',
      content:
        'This Master Services Agreement ("MSA") is entered into as of [Effective Date] by and between iGLOBUS Corporate Consulting Private Limited ("iBUNIFY") and [Client Company Name] ("Client"). This MSA governs all Statements of Work (SOW) executed between the parties for a term of 12 months with automatic annual renewal.'
    },
    {
      id: 'msa-sec-2',
      title: '2. SCOPE OF PLATFORM SERVICES',
      content:
        'iBUNIFY agrees to provide SaaS licensing, AI Calling agents, Cloud Telephony, WhatsApp Business API integrations, and ongoing technical support as set forth in applicable SOWs.'
    },
    {
      id: 'msa-sec-3',
      title: '3. INTELLECTUAL PROPERTY RIGHTS',
      content:
        '• Client Ownership: Client exclusively owns all customer records, prospect leads, call recordings, and corporate data stored within the platform.\n• Service Provider Ownership: iBUNIFY exclusively owns the software platform, source code, AI voice models, API connectors, and system enhancements.'
    },
    {
      id: 'msa-sec-4',
      title: '4. PAYMENT TERMS & INVOICING',
      content:
        'All invoices are payable within 30 calendar days (NET 30). Late payments shall incur interest at 1.5% per month or the maximum rate permitted by law.'
    },
    {
      id: 'msa-sec-5',
      title: '5. GOVERNING LAW & DISPUTE RESOLUTION',
      content:
        'This Agreement shall be governed by the laws of India with exclusive jurisdiction in Hyderabad, Telangana.'
    }
  ]
};

export const sampleCommercialProposalDoc = {
  id: 'sample-commercial-proposal-001',
  documentType: 'commercial_proposal',
  badge: 'STANDARD COMMERCIAL PROPOSAL & STATEMENT OF WORK',
  proposalTitle: 'Unified CRM, Communication & AI Sales Automation',
  subtitle: 'Built for High-Velocity Real Estate & Sales Enterprises',
  description:
    'One Platform. Every Connection. Endless Growth. Connecting Meta Ads, Google Ads, Portals, Cloud Telephony, WhatsApp Business, and Conversational AI into one cohesive operating rhythm.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Commercial Proposal & SOW',
  headerRight: 'Standard Master Template',
  proposalNumber: 'IGC-IBUNIFY-PROP-2026',
  sowNumber: 'IGC-IBUNIFY-SOW-2026',
  date: new Date().toISOString().slice(0, 10),
  effectiveDate: '[Effective Date]',
  preparedFor: '[Client Company Name]',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  engagement: 'iBUNIFY CRM & Automation Platform Deployment',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.)',
  companyAddress: 'Headquarters: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Digital Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390)',
  productLead: 'Product Lead: Ramyasree (+91 63005 61742)',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerContacts: 'Contacts: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390) | Ramyasree (+91 63005 61742)',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  metrics: [
    { value: '< 1 Min', label: 'FIRST RESPONSE SPEED' },
    { value: '100%', label: 'LEAD ATTRIBUTION' },
    { value: '3x', label: 'FOLLOW-UP VELOCITY' },
    { value: '24/7', label: 'AI VOICE & CHAT' }
  ],
  serviceBreakdown: [
    {
      key: 'A',
      title: 'Centralized Real Estate CRM & Pipeline Platform',
      features:
        '360-degree lead view, pipeline stage management (Inquiry → Site Visit → Negotiation → Booking), multi-project inventory mapping, automated round-robin lead assignment, Meta CAPI and Google Offline Conversions sync, real-time agent activity tracking, and executive dashboards.',
      costing: '₹2,500 / user / month (Platform License) | ₹50,000 One-Time Setup (Pipeline mapping, integrations & onboarding).'
    },
    {
      key: 'B',
      title: 'Conversational AI Agent Calling Service',
      features:
        'Natural human-like conversational voice agent, instant automated outbound dialer for new digital leads, budget and timeline qualification (2BHK/3BHK preferences), re-engagement dialer for unresponsive leads, live agent transfer, and automated conversation summaries synced directly to lead cards.',
      costing: '₹7 / connected conversational call (Voice Engine included in base setup).'
    },
    {
      key: 'C',
      title: 'Integrated Cloud Telephony & Virtual Numbers',
      features:
        'Intelligent Call-to-Lead automated CRM record generation upon answering, dedicated campaign tracking virtual numbers (Meta, Google, Portals, Hoardings), after-hours hybrid mobile forwarding, IVR routing, secure cloud call recordings, and comprehensive CDR analytics.',
      costing: '₹1,500 / virtual number / month (Call-to-Lead routing engine included in base setup).'
    },
    {
      key: 'D',
      title: 'Official WhatsApp Business Platform Automation',
      features:
        'Official Meta WhatsApp Business API integration, automated brochure and price-sheet dispatch on lead capture, site-visit reminder sequences, location pins, unified multi-agent shared team inbox, and interactive quick-reply FAQ bot.',
      costing: '₹15,000 for 6 Months (API Engine & Setup) | ₹10,000 Prepaid Message Wallet (Utility: ₹0.18/msg | Marketing: ₹0.87/msg).'
    }
  ],
  commercialScheduleItems: [
    {
      id: 'cs-1',
      component: 'One-Time Setup & Implementation',
      scope: 'System config, Meta CAPI, Google Ads, telephony & team training',
      investment: '₹50,000 (One-Time)'
    },
    {
      id: 'cs-2',
      component: 'iBUNIFY CRM User License',
      scope: 'Full CRM pipeline, task management, mobile access & dashboards',
      investment: '₹2,500 / user / month'
    },
    {
      id: 'cs-3',
      component: 'WhatsApp Business Platform',
      scope: 'Official Meta API integration & workflow routing (6 Months)',
      investment: '₹15,000 for 6 Months'
    },
    {
      id: 'cs-4',
      component: 'WhatsApp Message Wallet',
      scope: 'Prepaid consumption (Utility: ₹0.18 | Marketing: ₹0.87)',
      investment: '₹10,000 Prepaid'
    },
    {
      id: 'cs-5',
      component: 'Cloud Telephony Virtual Numbers',
      scope: 'Per dedicated virtual number with recording & CDR logging',
      investment: '₹1,500 / Number / mo'
    },
    {
      id: 'cs-6',
      component: 'AI Agent Calling',
      scope: 'Per connected conversational AI qualification call',
      investment: '₹7 / call'
    }
  ],
  basePackageTotal: '₹75,000 + Wallet / Lic.',
  sowPreamble:
    'THIS STATEMENT OF WORK ("SOW") is effective as of [Effective Date], by and between iGLOBUS Corporate Consulting Private Limited ("Service Provider") and [Client Company Name] ("Client"), and defines the delivery terms and execution milestones for the iBUNIFY platform.',
  sowScopeActivities: [
    'Requirement Discovery & Pipeline Architecture: Define project inventory structures, custom pipeline stages, lead scoring benchmarks, and sales role authorization tiers.',
    'Omnichannel Campaign Ingestion: Connect Meta Ads (CAPI API), Google Offline Conversion tracking, website webhooks, and portal lead connectors.',
    'Telephony & AI Calling Configuration: Provision dedicated virtual numbers, configure Call-to-Lead auto record triggers, and program conversational voice scripts.',
    'WhatsApp API Integration: Register official Business API templates, design automated brochure auto-responders, and configure multi-agent shared inboxes.',
    'UAT, Training & Rollout: Conduct sandbox functional testing, administrator runbook handover, and end-user sales executive onboarding sessions.'
  ],
  sowDeliverables: [
    'Deliverable 1: System Architecture Blueprint & Lead Flow Process Mapping Document.',
    'Deliverable 2: Fully configured iBUNIFY instance integrated with Meta CAPI, Google Ads, and WhatsApp API.',
    'Deliverable 3: Operational Cloud Telephony & AI Calling Engine with real-time CDR analytics.',
    'Deliverable 4: User Acceptance Testing (UAT) Sign-off Certificate & Admin Runbooks.'
  ],
  sowTimelineMilestones: [
    { activity: 'Discovery, Role Hierarchy & Lead Ingestion Setup', activeWeek: 1 },
    { activity: 'Cloud Telephony & WhatsApp Business API Deployment', activeWeek: 2 },
    { activity: 'AI Agent Calling Configuration & Integration Testing', activeWeek: 3 },
    { activity: 'User Acceptance Testing (UAT), Training & Production Go-Live', activeWeek: 4 }
  ],
  sowInvoicingMilestones: [
    {
      deliverable: 'Milestone 1: Contract Signing / Project Kick-off & Mobilization',
      percentage: '50%',
      amount: '₹25,000'
    },
    {
      deliverable: 'Milestone 2: Deployment, Integrations (Meta/WhatsApp/Telephony) & UAT Sign-off',
      percentage: '50%',
      amount: '₹25,000'
    }
  ],
  totalImplementationFee: '₹50,000',
  sowAssumptions: [
    'Client will designate a Project Manager to provide timely feedback/approvals within 48 hours.',
    'Client will provide necessary API access keys (Meta Business Manager, WhatsApp Business Account, Google Ads) before configuration commences.',
    'Standard support SLA guarantees Priority 1 response within < 30 minutes. Invoices are payable NET 30.'
  ],
  clientSignatoryHeader: 'FOR: [CLIENT COMPANY NAME]',
  clientSignatorySub: 'Client Authorized Signatory',
  clientSignatoryName: '',
  clientSignatoryTitle: '',
  providerSignatoryHeader: 'FOR: iBUNIFY (iGLOBUS)',
  providerSignatorySub: 'Service Provider Signatory',
  providerSignatoryName: 'Rama Krishna / Sohail',
  providerSignatoryTitle: 'Enterprise Practice Leads',
  sections: []
};

export const sampleSlaDoc = {
  id: 'sample-sla-001',
  documentType: 'sla',
  badge: 'SERVICE LEVEL AGREEMENT (SLA)',
  proposalTitle: 'Service Level Agreement (SLA)',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  description:
    'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  proposalNumber: 'IGC-IBUNIFY-06-2026',
  date: '[Date]',
  preparedFor: '[Client Company Name]',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  uptimeCommitment:
    'iBUNIFY guarantees a minimum of 99.9% Platform Availability for core cloud telephony, CRM databases, and AI routing endpoints, excluding scheduled maintenance windows.',
  incidentBenchmarks: [
    {
      id: 'inc-1',
      level: 'P1 - Critical',
      impact: 'Total platform outage, lead ingestion halted, telephony down',
      responseSla: '< 30 Minutes',
      resolutionTarget: '< 4 Hours'
    },
    {
      id: 'inc-2',
      level: 'P2 - High',
      impact: 'Core feature degraded (e.g., WhatsApp dispatch lag), workaround available',
      responseSla: '< 2 Hours',
      resolutionTarget: '< 8 Hours'
    },
    {
      id: 'inc-3',
      level: 'P3 - Medium',
      impact: 'Minor UI defect, non-critical report generation delay',
      responseSla: '< 4 Hours',
      resolutionTarget: '< 24 Hours'
    },
    {
      id: 'inc-4',
      level: 'P4 - Low',
      impact: 'General query, configuration assistance, user permission update',
      responseSla: '< 8 Hours',
      resolutionTarget: '< 48 Hours'
    }
  ],
  escalationMatrix: [
    'Level 1 (Helpdesk): support@ibunify.com | Ticket Portal',
    'Level 2 (Technical Lead): Sohail (+91 96032 70390 | sohail@iglobus.com)',
    'Level 3 (Practice Lead): Rama Krishna (+91 78420 97496 | ramakrishna@iglobuscc.com)'
  ],
  clientAcknowledgment: 'Client Acknowledgment: ___________________',
  leadSignatory: 'iBUNIFY Success Lead: Ramyasree',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: []
};

export const samplePoDoc = {
  id: 'sample-po-001',
  documentType: 'po',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  proposalTitle: 'Purchase Order (PO Template)',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  badge: 'PURCHASE ORDER (PO TEMPLATE)',
  description:
    'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  preparedFor: '[Client Company Name]',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  proposalNumber: 'IGC-IBUNIFY-07-2026',
  poNumber: 'PO-IBUNIFY-2026-001',
  date: new Date().toISOString().slice(0, 10),
  poDate: new Date().toISOString().slice(0, 10),
  paymentTerms: 'NET 30',
  currency: 'INR (₹)',
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  orderScheduleItems: [
    {
      id: 'po-item-1',
      description: 'One-Time Implementation & Setup Fee',
      qtyUnit: '1 Package',
      unitPrice: '₹50,000',
      totalAmount: '₹50,000'
    },
    {
      id: 'po-item-2',
      description: 'iBUNIFY CRM User Licenses (Quarterly)',
      qtyUnit: '[User Count]',
      unitPrice: '₹2,500 / user / mo',
      totalAmount: 'As Per Count'
    },
    {
      id: 'po-item-3',
      description: 'WhatsApp Business Platform Setup (6 Months)',
      qtyUnit: '1 Package',
      unitPrice: '₹15,000',
      totalAmount: '₹15,000'
    },
    {
      id: 'po-item-4',
      description: 'WhatsApp Prepaid Message Wallet',
      qtyUnit: '1 Wallet',
      unitPrice: '₹10,000',
      totalAmount: '₹10,000'
    },
    {
      id: 'po-item-5',
      description: 'Cloud Telephony Virtual Numbers',
      qtyUnit: '[Qty] Nos.',
      unitPrice: '₹1,500 / no / mo',
      totalAmount: 'As Per Qty'
    }
  ],
  totalInitialPoValue: '₹75,000 + Users',
  issuedByClient: '[CLIENT COMPANY NAME]',
  issuedByAuthorized: '__________________________',
  issuedByDesignation: '____________________________',
  issuedByDate: '[Date]',
  acceptedByCompany: 'iGLOBUS Corporate Consulting Pvt. Ltd.',
  acceptedByAuthorized: 'Rama Krishna / Sohail',
  acceptedByDesignation: 'Enterprise Practice Leads',
  acceptedByDate: '[Date]',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: []
};

export const sampleHandoverDoc = {
  id: 'sample-handover-001',
  documentType: 'handover',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  proposalTitle: 'Project Delivery & Handover Sign-off',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  badge: 'PROJECT DELIVERY & HANDOVER SIGN-OFF',
  description:
    'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  preparedFor: '[Client Company Name]',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  proposalNumber: 'IGC-IBUNIFY-08-2026',
  date: new Date().toISOString().slice(0, 10),
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  scopeVerificationText:
    'This Delivery & Handover Document certifies that the implementation of the iBUNIFY CRM Platform has been completed in accordance with the Statement of Work.',
  handoverChecklistItems: [
    {
      id: 'ho-item-1',
      component: 'CRM Pipeline',
      deliveredFeature: 'Custom stages, multi-project inventory, lead scoring',
      status: 'Verified & Active'
    },
    {
      id: 'ho-item-2',
      component: 'Omnichannel Ingestion',
      deliveredFeature: 'Meta CAPI, Google Ads, portal webhooks integrated',
      status: 'Verified & Active'
    },
    {
      id: 'ho-item-3',
      component: 'Cloud Telephony',
      deliveredFeature: 'Virtual numbers configured, Call-to-Lead auto record enabled',
      status: 'Verified & Active'
    },
    {
      id: 'ho-item-4',
      component: 'WhatsApp Business',
      deliveredFeature: 'Meta API live, brochure triggers, multi-agent inbox setup',
      status: 'Verified & Active'
    },
    {
      id: 'ho-item-5',
      component: 'AI Voice Agent',
      deliveredFeature: 'Outbound dialer configured, budget qualification active',
      status: 'Verified & Active'
    },
    {
      id: 'ho-item-6',
      component: 'Documentation',
      deliveredFeature: 'Admin runbooks and user guides handed over',
      status: 'Delivered'
    }
  ],
  acceptedByClientPm: '___________________',
  acceptedDate: '[Date]',
  deliveredByLead: 'Rama Krishna / Sohail',
  deliveredDate: '[Date]',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: []
};

export const sampleClosureDoc = {
  id: 'sample-closure-001',
  documentType: 'closure',
  company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
  proposalTitle: 'Project Closure & Hypercare Transition',
  subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
  badge: 'PROJECT CLOSURE & HYPERCARE TRANSITION',
  description:
    'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
  headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
  headerRight: 'Confidential Document Template',
  preparedFor: '[Client Company Name]',
  clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
  proposalNumber: 'IGC-IBUNIFY-09-2026',
  date: new Date().toISOString().slice(0, 10),
  companyAddress: 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad',
  portals: 'Portals: www.ibunify.com | www.iglobuscc.com',
  contacts: 'Contacts: Rama Krishna | Sohail | Ramyasree',
  formalClosureStatement:
    'This Project Closure Certificate formally confirms that the Phase-I deployment of the iBUNIFY CRM Platform for [Client Company Name] is complete and operational.',
  operationalMetrics: [
    { id: 'metric-1', value: '100%', label: 'REQUIREMENTS DELIVERED' },
    { id: 'metric-2', value: '100%', label: 'UAT SIGN-OFF' },
    { id: 'metric-3', value: '< 1 Min', label: 'AVG. RESPONSE TIME' },
    { id: 'metric-4', value: '24/7', label: 'SUPPORT ACTIVE' }
  ],
  supportTransitionText:
    'The project is transitioned from the Implementation Engineering Team to the Customer Success & Managed Support Practice under the SLA terms.',
  supportEmail: 'support@ibunify.com | Contact@iglobuscc.com',
  dedicatedSuccessManager: 'Ramyasree (+91 63005 61742 | ramyasree@iglobuscc.com)',
  clientSignatoryName: '______________________',
  clientSignatoryTitle: '______________________',
  clientSignDate: '[Date]',
  providerSignatoryName: 'Rama Krishna / Sohail',
  providerSignatoryTitle: 'Enterprise Practice Leads',
  footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
  footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
  footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
  pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
  sections: []
};

