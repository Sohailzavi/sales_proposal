import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { AUTH_STORAGE_KEY, LOGIN_EMAIL, LOGIN_PASSWORD, sampleProposal } from './data/defaults.js';
import { loadProposalsFromStorage, saveProposalsToStorage } from './services/proposalStorage.js';
import { OfficialProposalLibrary } from './components/official/OfficialProposalLibrary.jsx';
import { ProposalSelector } from './components/builder/ProposalSelector.jsx';
import { SectionSidebar } from './components/editor/SectionSidebar.jsx';
import { SectionEditor } from './components/editor/SectionEditor.jsx';
import { ProposalPreview } from './components/preview/ProposalPreview.jsx';
import { ExportActions } from './components/export/ExportActions.jsx';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="login-brand">Sales Proposal</div>

        <form onSubmit={handleSubmit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. sales@gmail.com"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label className="password-label">
            <div className="label-header">
              <span>Password</span>
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
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

  const [proposals, setProposals] = useState(() => loadProposalsFromStorage());
  const [activeProposalId, setActiveProposalId] = useState(() => proposals[0]?.id || sampleProposal.id);

  const activeProposal = useMemo(
    () => proposals.find((p) => p.id === activeProposalId) || proposals[0],
    [proposals, activeProposalId]
  );

  const [selectedId, setSelectedId] = useState(activeProposal?.sections?.[0]?.id ?? null);
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
    saveProposalsToStorage(proposals);
  }, [proposals]);

  useEffect(() => {
    if (activeProposal && !activeProposal.sections.some((s) => s.id === selectedId)) {
      setSelectedId(activeProposal.sections[0]?.id ?? null);
    }
  }, [activeProposalId, activeProposal, selectedId]);

  const selectedSection = useMemo(
    () => activeProposal?.sections?.find((section) => section.id === selectedId),
    [activeProposal?.sections, selectedId]
  );

  const updateActiveProposal = (updater) => {
    setProposals((prevList) =>
      prevList.map((p) => (p.id === activeProposalId ? updater(p) : p))
    );
  };

  const updateField = (field, value) => {
    updateActiveProposal((p) => ({ ...p, [field]: value }));
  };

  const updateSection = (id, patch) => {
    updateActiveProposal((p) => ({
      ...p,
      sections: p.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    }));
  };

  const updateCommercials = (patch) => {
    updateActiveProposal((p) => ({ ...p, ...patch }));
  };

  const addSection = () => {
    const section = {
      id: crypto.randomUUID(),
      title: 'New Section',
      content: 'Add section content here.'
    };
    updateActiveProposal((p) => ({ ...p, sections: [...p.sections, section] }));
    setSelectedId(section.id);
  };

  const duplicateSection = (id) => {
    const source = activeProposal.sections.find((section) => section.id === id);
    if (!source) return;
    const copy = { ...source, id: crypto.randomUUID(), title: `${source.title} Copy` };
    const index = activeProposal.sections.findIndex((section) => section.id === id);
    const sections = [...activeProposal.sections];
    sections.splice(index + 1, 0, copy);
    updateActiveProposal((p) => ({ ...p, sections }));
    setSelectedId(copy.id);
  };

  const deleteSection = (id) => {
    const sections = activeProposal.sections.filter((section) => section.id !== id);
    updateActiveProposal((p) => ({ ...p, sections }));
    if (selectedId === id) setSelectedId(sections[0]?.id ?? null);
  };

  const moveSection = (id, direction) => {
    const index = activeProposal.sections.findIndex((section) => section.id === id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= activeProposal.sections.length) return;
    const sections = [...activeProposal.sections];
    [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
    updateActiveProposal((p) => ({ ...p, sections }));
  };

  const resetSample = () => {
    if (!confirm('Reset the active proposal to default sample data?')) return;
    const fresh = {
      ...sampleProposal,
      id: activeProposalId,
      sections: sampleProposal.sections.map((s) => ({ ...s, id: crypto.randomUUID() }))
    };
    updateActiveProposal(() => fresh);
    setSelectedId(fresh.sections[0].id);
  };

  const handleCreateProposal = (newProposal) => {
    setProposals((prev) => [...prev, newProposal]);
    setActiveProposalId(newProposal.id);
    setSelectedId(newProposal.sections[0]?.id || null);
  };

  const handleDuplicateProposal = (proposalId) => {
    const source = proposals.find((p) => p.id === proposalId);
    if (!source) return;
    const copy = {
      ...source,
      id: `prop-${Date.now()}`,
      proposalTitle: `${source.proposalTitle} (Copy)`,
      proposalNumber: `${source.proposalNumber}-COPY`,
      sections: source.sections.map((s) => ({ ...s, id: crypto.randomUUID() }))
    };
    setProposals((prev) => [...prev, copy]);
    setActiveProposalId(copy.id);
  };

  const handleDeleteProposal = (proposalId) => {
    if (proposals.length <= 1) return;
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    const filtered = proposals.filter((p) => p.id !== proposalId);
    setProposals(filtered);
    setActiveProposalId(filtered[0].id);
  };

  const handleImportProposal = (importedProposal) => {
    setProposals((prev) => [...prev, importedProposal]);
    setActiveProposalId(importedProposal.id);
    setSelectedId(importedProposal.sections[0]?.id || null);
    setOfficialMode(false);
  };

  const handleSelectTemplate = (template) => {
    const newDoc = {
      ...template,
      id: `doc-${Date.now()}`,
      proposalNumber: template.proposalNumber || `INV-2026-${String(proposals.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      sections: Array.isArray(template.sections)
        ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
        : []
    };
    delete newDoc.name;
    delete newDoc.description;
    delete newDoc.category;

    setProposals((prev) => [...prev, newDoc]);
    setActiveProposalId(newDoc.id);
    setSelectedId(newDoc.sections[0]?.id || null);
    setOfficialMode(false);
    setPreviewMode(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-header">
          <div className="brand-logo-box">
            <span className="brand-logo-icon">📄</span>
          </div>
          <div>
            <div className="eyebrow">ibunify</div>
            <h1 className="brand-title">Sales proposal builder</h1>
          </div>
        </div>
        <ExportActions
          proposal={activeProposal}
          officialMode={officialMode}
          setOfficialMode={setOfficialMode}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          onImportProposal={handleImportProposal}
          onLogout={logout}
        />
      </header>

      {!officialMode && (
        <ProposalSelector
          proposals={proposals}
          activeProposalId={activeProposalId}
          onSelectProposal={setActiveProposalId}
          onCreateProposal={handleCreateProposal}
          onDuplicateProposal={handleDuplicateProposal}
          onDeleteProposal={handleDeleteProposal}
        />
      )}

      <main className={`workspace ${officialMode ? 'official-library' : previewMode ? 'preview-only' : ''}`}>
        {officialMode ? (
          <OfficialProposalLibrary
            activeDocumentFormat={activeDocumentFormat}
            setActiveDocumentFormat={setActiveDocumentFormat}
            onOpenBuilder={() => {
              setOfficialMode(false);
              setPreviewMode(false);
            }}
            onSelectTemplate={handleSelectTemplate}
          />
        ) : (
          <>
            {!previewMode && (
              <SectionSidebar
                sections={activeProposal.sections || []}
                selectedId={selectedId}
                onSelectSection={setSelectedId}
                onAddSection={addSection}
                onResetSample={resetSample}
              />
            )}

            {!previewMode && (
              <SectionEditor
                proposal={activeProposal}
                selectedSection={selectedSection}
                onUpdateField={updateField}
                onUpdateSection={updateSection}
                onMoveSection={moveSection}
                onDuplicateSection={duplicateSection}
                onDeleteSection={deleteSection}
                onUpdateCommercials={updateCommercials}
              />
            )}

            <ProposalPreview proposal={activeProposal} />
          </>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
