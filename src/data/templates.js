export const proposalTemplates = [
  {
    id: 'template-invoice-standard',
    name: 'Standard Invoice',
    description: 'Executive invoice layout with corporate logo, terms, line item details, CGST/SGST & bank transfer details.',
    category: 'Invoice',
    documentType: 'invoice',
    invoiceStyle: 'standard',
    company: 'iGlobus Corporate Consulting',
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
    id: 'template-discovery-standard',
    name: 'Discovery & Scoping Document',
    description: 'Official enterprise discovery documentation for platform deployment, legal governance, lead architecture, pipeline stages & baseline sign-off.',
    category: 'Discovery',
    documentType: 'discovery',
    badge: 'DISCOVERY — REQUIREMENT GATHERING & SCOPING',
    proposalTitle: 'Discovery — Requirement Gathering & Scoping',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    proposalNumber: 'IGC-IBUNIFY-01-2026',
    date: '2026-09-11',
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
  },
  {
    id: 'template-nda-standard',
    name: 'Mutual NDA Document',
    description: 'Official enterprise mutual non-disclosure agreement for intellectual property, customer data protection, and DPDPA compliance.',
    category: 'NDA',
    documentType: 'nda',
    badge: 'MUTUAL NON-DISCLOSURE AGREEMENT (NDA)',
    proposalTitle: 'Mutual Non-Disclosure Agreement',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    proposalNumber: 'IGC-IBUNIFY-02-2026',
    date: '2026-09-11',
    effectiveDate: '2026-09-11',
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
  },
  {
    id: 'template-msa-standard',
    name: 'Master Services Agreement (MSA)',
    description: 'Official enterprise master services agreement for platform deployment, SOW governance, IP ownership, and legal dispute resolution.',
    category: 'Legal',
    documentType: 'msa',
    badge: 'MASTER SERVICES AGREEMENT (MSA)',
    proposalTitle: 'Master Services Agreement (MSA)',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    proposalNumber: 'IGC-IBUNIFY-04-2026',
    date: '2026-09-11',
    effectiveDate: '2026-09-11',
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
  },
  {
    id: 'template-commercial-proposal-standard',
    name: 'Statement of Work (SOW)',
    description: 'Enterprise 5-page Statement of Work & Commercial Proposal for Unified CRM, WhatsApp API, AI Calling Agents, and Cloud Telephony.',
    category: 'SOW',
    documentType: 'commercial_proposal',
    badge: 'COMMERCIAL & TECHNICAL PROPOSAL',
    proposalTitle: 'Unified CRM, Communication & AI Sales Automation',
    subtitle: 'Built for High-Velocity Real Estate & Sales Enterprises',
    descriptionText:
      'One Platform. Every Connection. Endless Growth. Connecting Meta Ads, Google Ads, Portals, Cloud Telephony, WhatsApp Business, and Conversational AI into one cohesive operating rhythm.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    proposalNumber: 'IGC-IBUNIFY-PROP-2026',
    date: '2026-09-11',
    executionDate: '2026-09-11',
    preparedFor: 'Client Company Name',
    clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
    engagement: 'iBUNIFY Platform & Integrated Services',
    company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
    companyAddress: 'Headquarters: Madhapur, Opp. Raheja Mindspace, Hyderabad',
    portals: 'Digital Portals: www.ibunify.com | www.iglobuscc.com',
    contacts: 'Contacts: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390)',
    productLead: 'Product Lead: Ramyasree (+91 63005 61742)',
    footerCompany: 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.',
    footerAddress: 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081',
    footerContacts: 'Contact: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390) | Ramyasree (+91 63005 61742)',
    footerWebsites: 'Websites: www.ibunify.com | www.iglobuscc.com',
    pageFootnote: 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com',
    metrics: [
      { value: '< 1 Min', label: 'FIRST RESPONSE SPEED' },
      { value: '100%', label: 'LEAD ATTRIBUTION' },
      { value: '3x', label: 'FOLLOW-UP VELOCITY' },
      { value: '24/7', label: 'AI VOICE & CHAT' }
    ],
    servicePillars: [
      { key: 'A', title: 'Centralized Real Estate CRM', desc: 'Complete lead lifecycle tracking from Inquiry → Qualification → Site Visit → Negotiation → Booking & Closure.' },
      { key: 'B', title: 'Omnichannel Lead Ingestion', desc: 'Direct API ingestion from Meta Ads (CAPI), Google Ads, property portals (99acres/Housing), website forms, and walk-ins.' },
      { key: 'C', title: 'Closed-Loop Marketing Attribution', desc: 'Syncs qualified offline leads and site visits back to Google & Meta to continuously optimize ad spend and lower acquisition costs.' },
      { key: 'D', title: 'Executive CDR & Conversion Analytics', desc: 'Real-time team dashboards, call recordings, agent talk-time metrics, and pipeline conversion velocity reports.' }
    ],
    aiCallingItems: [
      { id: 'ai-1', component: 'AI Voice Agent Engine', scope: 'Natural conversational voice agent, intent detection & CRM transcript sync', investment: 'Included in Setup' },
      { id: 'ai-2', component: 'AI Calling Usage', scope: 'Per completed incoming or outgoing conversational call', investment: '₹7 / call' }
    ],
    telephonyItems: [
      { id: 'tel-1', component: 'Virtual Cloud Telephony Numbers', scope: 'Dedicated inbound/outbound virtual number with IVR and call recording', investment: '₹1,500 / Number / month' },
      { id: 'tel-2', component: 'Call-to-Lead Auto Ingestion Engine', scope: 'Real-time automatic lead record creation upon call connection', investment: 'Included in Setup' }
    ],
    whatsappItems: [
      { id: 'wa-1', component: 'WhatsApp Business Platform (API Engine)', scope: 'Official Meta Business API setup, template approvals & workflow engine', investment: '₹15,000 for 6 Months' },
      { id: 'wa-2', component: 'WhatsApp Message Wallet (Prepaid)', scope: 'Utility Message: ₹0.18 / msg | Marketing Message: ₹0.87 / msg', investment: '₹10,000 Prepaid (Usage-based)' }
    ],
    commercialScheduleItems: [
      { id: 'cs-1', component: 'One-Time Setup & Onboarding', model: 'System config, Meta CAPI, Google Ads, telephony & team training', investment: '₹50,000 (One-Time)' },
      { id: 'cs-2', component: 'iBUNIFY CRM User License', model: 'Full CRM pipeline, task management, mobile access & dashboards', investment: '₹2,500 / user / month' },
      { id: 'cs-3', component: 'WhatsApp Business Platform', model: 'Official Meta API integration & workflow routing (6 Months)', investment: '₹15,000 for 6 Months' },
      { id: 'cs-4', component: 'WhatsApp Message Wallet', model: 'Prepaid consumption (Utility: ₹0.18 | Marketing: ₹0.87)', investment: '₹10,000 Prepaid' },
      { id: 'cs-5', component: 'Cloud Telephony Virtual Numbers', model: 'Per dedicated virtual number with recording & CDR logging', investment: '₹1,500 / Number / mo' },
      { id: 'cs-6', component: 'AI Agent Calling', model: 'Per connected conversational AI qualification call', investment: '₹7 / call' }
    ],
    basePackageTotal: '₹75,000 + Wallet / Lic.',
    roadmap: [
      '• Week 1 (Discovery & Ingestion): Account creation, role hierarchy setup, Meta CAPI & Google Ads integration.',
      '• Week 2 (Telephony & WhatsApp): Virtual numbers provisioning, WhatsApp Business API templates, and routing logic.',
      '• Week 3 (AI Voice & Testing): AI conversational script configuration, call-to-lead testing, and sandbox validation.',
      '• Week 4 (Training & Go-Live): Sales team enablement, admin runbooks, UAT sign-off, and live production rollout.',
      '• Support Commitment: Priority 1 (Critical) incidents resolved in < 30 minutes; dedicated Customer Success Lead.'
    ],
    terms: [
      '• All prices are exclusive of statutory GST / taxes (18%).',
      '• Third-party usage (telephony minutes, WhatsApp message costs, AI calling) billed against actual wallet consumption.',
      '• Invoices are payable within 30 days from date of submission (NET 30).'
    ],
    clientSignatoryName: '',
    clientSignatoryTitle: '',
    leadSignatoryName: 'Rama Krishna / Sohail',
    leadSignatoryTitle: 'Enterprise Practice Leads',
    sections: [
      {
        id: 'ctp-sec-1',
        title: '1. ABOUT PRODUCT & SERVICES: THE POWER OF UNIFICATION',
        content:
          'iBUNIFY is an enterprise-grade CRM, communication, and sales automation platform engineered by iGLOBUS Corporate Consulting. Built specifically for high-velocity sales and real estate operations, iBUNIFY solves the fragmentation between disparate marketing channels, delayed lead responses, and lack of follow-up ownership.\n\nDesign Principle: Connect the core before adding complexity. Ingest every lead, route every conversation instantly, automate follow-ups, and track conversions end-to-end.'
      },
      {
        id: 'ctp-sec-2',
        title: '2. AI CALLING SERVICES & COSTING',
        content:
          'iBUNIFY AI Agent Calling delivers automated, natural human-like voice conversations to qualify prospects, re-engage cold leads, and eliminate call latency:\n• Instant Inbound & Outbound Follow-up: Automatically dials new digital inquiries within seconds or follows up on missed calls.\n• Lead Qualification & Budget Mapping: Identifies project preferences, purchase timelines, unit configurations (2BHK/3BHK), and budget ranges.\n• Intelligent Agent Handoff: Transfers hot, qualified prospects directly to human sales executives with full conversation transcripts.\n• 24/7 Availability & Multi-lingual Support: Ensures no inquiry goes unattended during late evenings, weekends, or holidays.'
      },
      {
        id: 'ctp-sec-3',
        title: '3. CLOUD TELEPHONY SERVICES & COSTING',
        content:
          'Enterprise cloud telephony infrastructure integrated directly into the CRM to give complete control over lead communication:\n• Intelligent Call-to-Lead System: Inbound calls route to available agents first. Answering instantly triggers a lead profile in CRM.\n• Dedicated Project Virtual Numbers: Assign unique tracking numbers for Meta Ads, Google Ads, hoardings, and portals.\n• Hybrid After-Hours Routing: Automatically switches calls from the web system to sales agents\' mobile phones during non-office hours.\n• Call Recording & CDR Analytics: Complete audit trail with secure storage, agent talk-time analytics, and disposition tagging.'
      },
      {
        id: 'ctp-sec-4',
        title: '4. WHATSAPP AUTOMATION SERVICES & COSTING',
        content:
          'Official Meta WhatsApp Business Platform integration turning chat conversations into high-converting customer journeys:\n• Instant Brochure & Price Sheet Dispatch: Automatically triggers WhatsApp brochures when leads submit inquiry forms.\n• Automated Nurture Sequences: Triggers site-visit reminders, location pins, video walkthroughs, and payment milestone alerts.\n• Unified Multi-Agent Inbox: Enables sales teams to chat with prospects from a single verified business number with full audit logs.\n• Interactive Chatbot & Quick Replies: Pre-configured menus for instant responses to common buyer FAQs and project details.'
      },
      {
        id: 'ctp-sec-5',
        title: '5. OVERALL COSTING & COMMERCIAL SCHEDULE',
        content: 'Consolidated commercial schedule covering one-time setup, recurring licensing, and usage-based wallets.'
      },
      {
        id: 'ctp-sec-6',
        title: '6. IMPLEMENTATION ROADMAP & SUPPORT SLA',
        content: '4-week phased implementation plan and enterprise support resolution commitments.'
      },
      {
        id: 'ctp-sec-7',
        title: '7. TERMS AND CONDITIONS',
        content: 'Statutory commercial terms, tax applicability, wallet billing, and payment cycle definitions.'
      },
      {
        id: 'ctp-sec-8',
        title: '8. PROPOSAL ACCEPTANCE & SIGN-OFF',
        content: 'By signing below, the authorized representatives acknowledge and accept the scope, deliverables, and commercial terms set forth in this proposal.'
      }
    ]
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
    id: 'template-sla-standard',
    name: 'Service Level Agreement (SLA)',
    description: 'Official enterprise SLA defining platform availability (99.9%), incident turnaround matrix, and escalation tiers.',
    category: 'SLA',
    documentType: 'sla',
    badge: 'SERVICE LEVEL AGREEMENT (SLA)',
    proposalTitle: 'Service Level Agreement (SLA)',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText:
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
  },
  {
    id: 'template-po-standard',
    name: 'Purchase Order (PO Template)',
    description: 'Official enterprise purchase order template with itemized order schedule, PO summary, and dual authorization approval blocks.',
    category: 'PO',
    documentType: 'po',
    badge: 'PURCHASE ORDER (PO TEMPLATE)',
    proposalTitle: 'Purchase Order (PO Template)',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    preparedFor: '[Client Company Name]',
    clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
    proposalNumber: 'IGC-IBUNIFY-07-2026',
    poNumber: 'PO-IBUNIFY-2026-001',
    date: '2026-09-11',
    poDate: '2026-09-11',
    paymentTerms: 'NET 30',
    currency: 'INR (₹)',
    company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
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
  },
  {
    id: 'template-handover-standard',
    name: 'Project Delivery & Handover Sign-off',
    description: 'Official enterprise project delivery and operational handover certificate with feature verification checklist and acceptance blocks.',
    category: 'Handover',
    documentType: 'handover',
    badge: 'PROJECT DELIVERY & HANDOVER SIGN-OFF',
    proposalTitle: 'Project Delivery & Handover Sign-off',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    descriptionText: 'Official enterprise documentation for platform deployment, legal governance, and operational handover.',
    headerLeft: 'iBUNIFY CRM by iGLOBUS | Enterprise Suite',
    headerRight: 'Confidential Document Template',
    preparedFor: '[Client Company Name]',
    clientAttention: 'Attn: [Project Sponsor / Sales Leadership]',
    proposalNumber: 'IGC-IBUNIFY-08-2026',
    date: '2026-09-11',
    company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
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
  },
  {
    id: 'template-closure-standard',
    name: 'Project Closure & Hypercare Transition',
    description: 'Official 2-page Project Closure statement, operational metrics achieved, support handover, and dual final sign-off.',
    category: 'Operations',
    documentType: 'closure',
    company: 'iBUNIFY (iGLOBUS Corporate Consulting)',
    proposalTitle: 'Project Closure & Hypercare Transition',
    subtitle: 'iBUNIFY CRM by iGLOBUS Corporate Consulting',
    badge: 'PROJECT CLOSURE & HYPERCARE TRANSITION',
    descriptionText:
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
