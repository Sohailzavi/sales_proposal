import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'ibunify-sales-proposal-v1';
const AUTH_STORAGE_KEY = 'ibunify-sales-auth-v1';
const LOGIN_EMAIL = 'sales@gmail.com';
const LOGIN_PASSWORD = 'Sales@2026';
const OFFICIAL_PROPOSAL_FILE = '/iBunify-Overall-Proposal.pdf';

const documentFormats = [
  { id: 'all', label: 'All documents', extension: 'ALL', count: 1 },
  { id: 'pdf', label: 'PDF documents', extension: 'PDF', count: 1 },
  { id: 'word', label: 'Word documents', extension: 'DOC', count: 0 },
  { id: 'html', label: 'Web documents', extension: 'HTML', count: 0 },
  { id: 'json', label: 'Data backups', extension: 'JSON', count: 0 }
];

const sampleProposal = {
  company: 'iBunify',
  proposalTitle: 'Digital Workspace Transformation Proposal',
  proposalNumber: 'IBU-SP-2026-001',
  preparedFor: 'Acme Enterprises Pvt. Ltd.',
  preparedBy: 'iBunify Sales Team',
  date: new Date().toISOString().slice(0, 10),
  validUntil: '',
  currency: 'INR',
  sections: [
    {
      id: crypto.randomUUID(),
      title: 'Executive Summary',
      content:
        'iBunify proposes a secure, scalable, and user-friendly digital workspace solution for Acme Enterprises. The solution will centralize collaboration, automate routine workflows, and improve visibility across teams while reducing operational overhead.'
    },
    {
      id: crypto.randomUUID(),
      title: 'Client Objectives',
      content:
        '• Create a unified workspace for employees and partners\n• Reduce manual follow-ups and scattered communication\n• Improve document accessibility and approval tracking\n• Provide management with real-time visibility into work progress'
    },
    {
      id: crypto.randomUUID(),
      title: 'Proposed Solution',
      content:
        'iBunify will configure a modular digital workspace consisting of team spaces, document repositories, automated approval flows, dashboards, notifications, access controls, and onboarding support. The implementation will be tailored to the client’s operating model and branding.'
    },
    {
      id: crypto.randomUUID(),
      title: 'Scope of Work',
      content:
        '1. Discovery and requirements workshop\n2. Workspace architecture and configuration\n3. User roles and permission setup\n4. Workflow and approval automation\n5. Dashboard and reporting setup\n6. User acceptance testing\n7. Admin training and go-live support'
    },
    {
      id: crypto.randomUUID(),
      title: 'Implementation Timeline',
      content:
        'Week 1: Discovery and solution design\nWeek 2–3: Configuration and workflow setup\nWeek 4: Testing and refinements\nWeek 5: Training, go-live, and handover'
    },
    {
      id: crypto.randomUUID(),
      title: 'Commercial Proposal',
      content:
        'Implementation fee: ₹2,50,000\nAnnual platform subscription: ₹4,80,000\nOptional managed support: ₹25,000 per month\nTaxes will be charged as applicable.'
    },
    {
      id: crypto.randomUUID(),
      title: 'Terms and Conditions',
      content:
        '• Proposal validity: 30 days\n• Payment terms: 50% advance, 40% before go-live, 10% after handover\n• Client will provide required content, approvals, and system access on time\n• Any material scope change may require a revised estimate'
    },
    {
      id: crypto.randomUUID(),
      title: 'Acceptance',
      content:
        'By signing below, both parties confirm their intent to proceed with the scope, commercials, and terms described in this proposal.\n\nClient Name:\nDesignation:\nSignature:\nDate:'
    }
  ]
};

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function proposalToHtml(proposal, forWord = false) {
  const sectionHtml = proposal.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <div class="section-content">${escapeHtml(section.content).replaceAll('\n', '<br/>')}</div>
        </section>`
    )
    .join('');

  const styles = `
    body{font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;margin:0;padding:40px;background:#fff}
    .cover{border-bottom:4px solid #5b4bdb;padding-bottom:28px;margin-bottom:28px}
    .brand{font-size:18px;font-weight:700;color:#5b4bdb;letter-spacing:.08em;text-transform:uppercase}
    h1{font-size:34px;line-height:1.2;margin:12px 0}
    h2{font-size:20px;color:#2d2a6e;border-bottom:1px solid #ddd;padding-bottom:8px;margin-top:30px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px 30px;margin-top:20px;font-size:14px}
    .meta strong{display:inline-block;min-width:120px}
    section{page-break-inside:avoid;margin-bottom:24px}
    .section-content{white-space:normal}
    .footer{margin-top:50px;padding-top:14px;border-top:1px solid #ddd;font-size:12px;color:#687086}
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
    proposal.proposalTitle
  )}</title><style>${styles}</style></head><body>
  <div class="cover">
    <div class="brand">${escapeHtml(proposal.company)}</div>
    <h1>${escapeHtml(proposal.proposalTitle)}</h1>
    <div class="meta">
      <div><strong>Proposal No.</strong> ${escapeHtml(proposal.proposalNumber)}</div>
      <div><strong>Date</strong> ${escapeHtml(proposal.date)}</div>
      <div><strong>Prepared for</strong> ${escapeHtml(proposal.preparedFor)}</div>
      <div><strong>Prepared by</strong> ${escapeHtml(proposal.preparedBy)}</div>
      <div><strong>Valid until</strong> ${escapeHtml(proposal.validUntil || '30 days from issue')}</div>
      <div><strong>Currency</strong> ${escapeHtml(proposal.currency)}</div>
    </div>
  </div>
  ${sectionHtml}
  <div class="footer">Confidential sales proposal prepared by ${escapeHtml(proposal.company)}.</div>
  ${forWord ? '<p style="font-size:10px;color:#999">Generated from the iBunify Sales Proposal Editor.</p>' : ''}
  </body></html>`;
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (email.trim().toLowerCase() !== LOGIN_EMAIL || password !== LOGIN_PASSWORD) {
      setError('Incorrect email or password.');
      return;
    }

    setError('');
    onLogin();
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">iBunify</div>
        <h1 id="login-title">Sales Proposal Builder</h1>
        <p>Sign in to create and manage sales proposals.</p>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" className="login-button">Sign in</button>
        </form>
      </section>
    </main>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated'
  );
  const [proposal, setProposal] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : sampleProposal;
    } catch {
      return sampleProposal;
    }
  });
  const [selectedId, setSelectedId] = useState(proposal.sections[0]?.id ?? null);
  const [previewMode, setPreviewMode] = useState(false);
  const [officialMode, setOfficialMode] = useState(true);
  const [activeDocumentFormat, setActiveDocumentFormat] = useState('all');

  const login = () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposal));
  }, [proposal]);

  const selectedSection = useMemo(
    () => proposal.sections.find((section) => section.id === selectedId),
    [proposal.sections, selectedId]
  );

  const updateField = (field, value) => setProposal((p) => ({ ...p, [field]: value }));

  const updateSection = (id, patch) => {
    setProposal((p) => ({
      ...p,
      sections: p.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    }));
  };

  const addSection = () => {
    const section = {
      id: crypto.randomUUID(),
      title: 'New Section',
      content: 'Add section content here.'
    };
    setProposal((p) => ({ ...p, sections: [...p.sections, section] }));
    setSelectedId(section.id);
  };

  const duplicateSection = (id) => {
    const source = proposal.sections.find((section) => section.id === id);
    if (!source) return;
    const copy = { ...source, id: crypto.randomUUID(), title: `${source.title} Copy` };
    const index = proposal.sections.findIndex((section) => section.id === id);
    const sections = [...proposal.sections];
    sections.splice(index + 1, 0, copy);
    setProposal((p) => ({ ...p, sections }));
    setSelectedId(copy.id);
  };

  const deleteSection = (id) => {
    const sections = proposal.sections.filter((section) => section.id !== id);
    setProposal((p) => ({ ...p, sections }));
    if (selectedId === id) setSelectedId(sections[0]?.id ?? null);
  };

  const moveSection = (id, direction) => {
    const index = proposal.sections.findIndex((section) => section.id === id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= proposal.sections.length) return;
    const sections = [...proposal.sections];
    [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
    setProposal((p) => ({ ...p, sections }));
  };

  const exportPdf = () => {
    const popup = window.open('', '_blank');
    if (!popup) {
      alert('Please allow pop-ups to export PDF.');
      return;
    }
    popup.document.open();
    popup.document.write(proposalToHtml(proposal));
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 300);
  };

  const exportWord = () => {
    const html = proposalToHtml(proposal, true);
    downloadBlob(html, `${proposal.proposalNumber || 'sales-proposal'}.doc`, 'application/msword');
  };

  const exportHtml = () => {
    downloadBlob(
      proposalToHtml(proposal),
      `${proposal.proposalNumber || 'sales-proposal'}.html`,
      'text/html;charset=utf-8'
    );
  };

  const exportJson = () => {
    downloadBlob(
      JSON.stringify(proposal, null, 2),
      `${proposal.proposalNumber || 'sales-proposal'}.json`,
      'application/json'
    );
  };

  const resetSample = () => {
    if (!confirm('Reset the proposal to the iBunify sample data?')) return;
    const fresh = {
      ...sampleProposal,
      sections: sampleProposal.sections.map((s) => ({ ...s, id: crypto.randomUUID() }))
    };
    setProposal(fresh);
    setSelectedId(fresh.sections[0].id);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">iBunify</div>
          <h1>Sales Proposal Builder</h1>
        </div>
        <div className="top-actions">
          <button
            className="secondary"
            onClick={() => {
              setOfficialMode((value) => !value);
              setPreviewMode(false);
            }}
          >
            {officialMode ? 'Open editable builder' : 'Use official proposal'}
          </button>
          {officialMode ? (
            <a className="button-link" href={OFFICIAL_PROPOSAL_FILE} download>
              Download PDF
            </a>
          ) : (
            <>
              <button className="secondary" onClick={() => setPreviewMode((v) => !v)}>
                {previewMode ? 'Edit mode' : 'Preview'}
              </button>
              <button onClick={exportPdf}>Download PDF</button>
              <div className="dropdown">
                <button className="secondary">More exports ▾</button>
                <div className="dropdown-menu">
                  <button onClick={exportWord}>Word document (.doc)</button>
                  <button onClick={exportHtml}>HTML</button>
                  <button onClick={exportJson}>JSON backup</button>
                </div>
              </div>
            </>
          )}
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className={`workspace ${officialMode ? 'official-library' : previewMode ? 'preview-only' : ''}`}>
        {officialMode && (
          <aside className="document-sidebar panel" aria-label="Document library">
            <div className="document-sidebar-title">
              <div>
                <div className="eyebrow blue">Library</div>
                <h2>Documents</h2>
              </div>
              <span className="document-total">1</span>
            </div>

            <nav className="format-list" aria-label="Filter documents by format">
              {documentFormats.map((format) => (
                <button
                  key={format.id}
                  className={`format-item ${activeDocumentFormat === format.id ? 'active' : ''}`}
                  onClick={() => setActiveDocumentFormat(format.id)}
                  aria-pressed={activeDocumentFormat === format.id}
                >
                  <span className={`format-badge ${format.id}`}>{format.extension}</span>
                  <span className="format-name">{format.label}</span>
                  <span className="format-count">{format.count}</span>
                </button>
              ))}
            </nav>

            {(activeDocumentFormat === 'all' || activeDocumentFormat === 'pdf') && (
              <div className="document-list">
                <div className="document-list-label">Files</div>
                <a
                  className="document-card active"
                  href={OFFICIAL_PROPOSAL_FILE}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="file-icon">PDF</span>
                  <span>
                    <strong>iBunify Overall Proposal</strong>
                    <small>Official proposal · 15.3 MB</small>
                  </span>
                </a>
              </div>
            )}
          </aside>
        )}

        {!officialMode && !previewMode && (
          <aside className="sidebar panel">
            <div className="sidebar-head">
              <h2>Sections</h2>
              <button className="icon-button" onClick={addSection} title="Add section">＋</button>
            </div>
            <div className="section-list">
              {proposal.sections.map((section, index) => (
                <button
                  key={section.id}
                  className={`section-item ${selectedId === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(section.id)}
                >
                  <span>{index + 1}</span>
                  <strong>{section.title || 'Untitled section'}</strong>
                </button>
              ))}
            </div>
            <button className="secondary full" onClick={addSection}>Add section</button>
            <button className="ghost full" onClick={resetSample}>Restore sample data</button>
          </aside>
        )}

        {!officialMode && !previewMode && (
          <section className="editor panel">
            <h2>Proposal details</h2>
            <div className="form-grid">
              {[
                ['company', 'Company'],
                ['proposalTitle', 'Proposal title'],
                ['proposalNumber', 'Proposal number'],
                ['preparedFor', 'Prepared for'],
                ['preparedBy', 'Prepared by'],
                ['date', 'Date'],
                ['validUntil', 'Valid until'],
                ['currency', 'Currency']
              ].map(([field, label]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    type={field === 'date' || field === 'validUntil' ? 'date' : 'text'}
                    value={proposal[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                  />
                </label>
              ))}
            </div>

            {selectedSection ? (
              <div className="section-editor">
                <div className="section-editor-head">
                  <h2>Edit section</h2>
                  <div className="small-actions">
                    <button className="ghost" onClick={() => moveSection(selectedSection.id, 'up')}>↑</button>
                    <button className="ghost" onClick={() => moveSection(selectedSection.id, 'down')}>↓</button>
                    <button className="ghost" onClick={() => duplicateSection(selectedSection.id)}>Duplicate</button>
                    <button className="danger" onClick={() => deleteSection(selectedSection.id)}>Delete</button>
                  </div>
                </div>
                <label>
                  <span>Section title</span>
                  <input
                    value={selectedSection.title}
                    onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                  />
                </label>
                <label>
                  <span>Section content</span>
                  <textarea
                    rows="14"
                    value={selectedSection.content}
                    onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                  />
                </label>
              </div>
            ) : (
              <div className="empty-state">Add a section to begin editing.</div>
            )}
          </section>
        )}

        {officialMode && (activeDocumentFormat === 'all' || activeDocumentFormat === 'pdf') ? (
          <section className="official-proposal panel">
            <div className="official-proposal-head">
              <div>
                <div className="eyebrow blue">Official iBunify proposal</div>
                <h2>AI-Powered Unified Customer Engagement Platform</h2>
                <p>Seven-page product proposal · CRM by iGlobus</p>
              </div>
              <a className="button-link" href={OFFICIAL_PROPOSAL_FILE} target="_blank" rel="noreferrer">
                Open full screen
              </a>
            </div>
            <object
              className="official-pdf"
              data={`${OFFICIAL_PROPOSAL_FILE}#view=FitH&toolbar=1`}
              type="application/pdf"
              aria-label="iBunify product proposal"
            >
              <div className="pdf-fallback">
                <p>Your browser cannot display the proposal inline.</p>
                <a className="button-link" href={OFFICIAL_PROPOSAL_FILE} target="_blank" rel="noreferrer">
                  Open the proposal
                </a>
              </div>
            </object>
          </section>
        ) : officialMode ? (
          <section className="format-empty panel">
            <div className="empty-file-icon">
              {documentFormats.find((format) => format.id === activeDocumentFormat)?.extension}
            </div>
            <h2>No {documentFormats.find((format) => format.id === activeDocumentFormat)?.label.toLowerCase()} yet</h2>
            <p>Open the editable builder to create and export this proposal in that format.</p>
            <button
              onClick={() => {
                setOfficialMode(false);
                setPreviewMode(false);
              }}
            >
              Open editable builder
            </button>
          </section>
        ) : (
        <section className="proposal-paper">
          <div className="cover-block">
            <div className="brand-mark">{proposal.company}</div>
            <h1>{proposal.proposalTitle}</h1>
            <div className="proposal-meta">
              <div><span>Proposal No.</span><strong>{proposal.proposalNumber}</strong></div>
              <div><span>Date</span><strong>{proposal.date}</strong></div>
              <div><span>Prepared for</span><strong>{proposal.preparedFor}</strong></div>
              <div><span>Prepared by</span><strong>{proposal.preparedBy}</strong></div>
              <div><span>Valid until</span><strong>{proposal.validUntil || '30 days from issue'}</strong></div>
              <div><span>Currency</span><strong>{proposal.currency}</strong></div>
            </div>
          </div>
          {proposal.sections.map((section) => (
            <article key={section.id}>
              <h2>{section.title}</h2>
              <div className="proposal-content">{section.content}</div>
            </article>
          ))}
          <footer>Confidential sales proposal prepared by {proposal.company}.</footer>
        </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
