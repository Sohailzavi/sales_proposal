import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import {
  STORAGE_KEY_V2,
  AUTH_STORAGE_KEY,
  sampleProposal,
  sampleDiscoveryDoc,
  sampleNdaDoc,
  sampleMsaDoc,
  sampleCommercialProposalDoc,
  sampleSlaDoc,
  samplePoDoc,
  sampleHandoverDoc,
  sampleClosureDoc,
  documentFormats,
  LOGIN_EMAIL,
  LOGIN_PASSWORD
} from './data/defaults.js';
import { proposalTemplates } from './data/templates.js';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      if (email.trim().toLowerCase() !== LOGIN_EMAIL || password !== LOGIN_PASSWORD) {
        setError('Incorrect email or password.');
        setIsSubmitting(false);
        return;
      }
      onLogin();
    }, 150);
  };

  return (
    <main className="login-page">
      <div className="video-background-wrap" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="login-video-bg"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_051048_5ef213b5-26db-4da8-b604-7ef823760b6b.mp4"
            type="video/mp4"
          />
        </video>
        <div className="video-overlay" />
        <div className="earth-brand-backdrop" aria-hidden="true">
          <div className="earth-brand-lockup">
            <svg className="earth-logo-svg" viewBox="0 0 94 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="30" width="19" height="26" rx="1.5" fill="#38b6ff"/>
              <circle cx="14.5" cy="42" r="3.2" fill="#ffffff"/>
              <path d="M8.5 56 C8.5 50.5 11 47.8 14.5 47.8 C18 47.8 20.5 50.5 20.5 56 Z" fill="#ffffff"/>

              <rect x="30" y="15" width="19" height="41" rx="1.5" fill="#38b6ff"/>
              <circle cx="39.5" cy="42" r="3.2" fill="#ffffff"/>
              <path d="M33.5 56 C33.5 50.5 36 47.8 39.5 47.8 C43 47.8 45.5 50.5 45.5 56 Z" fill="#ffffff"/>

              <rect x="55" y="0" width="19" height="56" rx="1.5" fill="#38b6ff"/>
              <circle cx="64.5" cy="42" r="3.2" fill="#ffffff"/>
              <path d="M58.5 56 C58.5 50.5 61 47.8 64.5 47.8 C68 47.8 70.5 50.5 70.5 56 Z" fill="#ffffff"/>
            </svg>
            <span className="earth-brand-text">iGLOBUS</span>
          </div>
        </div>
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <form onSubmit={handleSubmit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
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
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
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

  const isInvoice = activeProposal?.documentType === 'invoice';
  const isDiscovery = activeProposal?.documentType === 'discovery';
  const isNda = activeProposal?.documentType === 'nda';
  const isMsa = activeProposal?.documentType === 'msa';
  const isCommercialProposal = activeProposal?.documentType === 'commercial_proposal';
  const isSla = activeProposal?.documentType === 'sla';
  const isPo = activeProposal?.documentType === 'po';
  const isHandover = activeProposal?.documentType === 'handover';
  const isClosure = activeProposal?.documentType === 'closure';

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
    if (
      activeProposal &&
      Array.isArray(activeProposal.sections) &&
      activeProposal.sections.length > 0 &&
      !activeProposal.sections.some((s) => s.id === selectedId)
    ) {
      setSelectedId(activeProposal.sections[0].id);
    } else if (
      activeProposal &&
      (!activeProposal.sections || activeProposal.sections.length === 0) &&
      selectedId !== null
    ) {
      setSelectedId(null);
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

  // History-aware state navigation helper
  const pushAppState = (newOfficialMode, newPreviewMode, newActiveProposalId = activeProposalId) => {
    setOfficialMode(newOfficialMode);
    setPreviewMode(newPreviewMode);
    setActiveProposalId(newActiveProposalId);

    const currentState = window.history.state;
    if (
      !currentState ||
      currentState.officialMode !== newOfficialMode ||
      currentState.previewMode !== newPreviewMode ||
      currentState.activeProposalId !== newActiveProposalId
    ) {
      window.history.pushState(
        { officialMode: newOfficialMode, previewMode: newPreviewMode, activeProposalId: newActiveProposalId },
        ''
      );
    }
  };

  useEffect(() => {
    // Set initial history state on load if not set
    if (!window.history.state) {
      window.history.replaceState(
        { officialMode, previewMode, activeProposalId },
        ''
      );
    }

    const handlePopState = (event) => {
      if (event.state) {
        setOfficialMode(event.state.officialMode);
        setPreviewMode(event.state.previewMode);
        if (event.state.activeProposalId) {
          setActiveProposalId(event.state.activeProposalId);
        }
      } else {
        setOfficialMode(true);
        setPreviewMode(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGoBack = () => {
    pushAppState(true, false, activeProposalId);
  };

  const handleCreateProposal = (newProposal) => {
    setProposals((prev) => [...prev, newProposal]);
    pushAppState(false, false, newProposal.id);
    setSelectedId(newProposal.sections[0]?.id || null);
  };

  const handleDuplicateProposal = (proposalId) => {
    const source = proposals.find((p) => p.id === proposalId);
    if (!source) return;
    const isDocInvoice = source.documentType === 'invoice';
    const copy = {
      ...source,
      id: `${isDocInvoice ? 'inv' : 'prop'}-${Date.now()}`,
      proposalTitle: `${source.proposalTitle} (Copy)`,
      proposalNumber: `${source.proposalNumber}-COPY`,
      sections: Array.isArray(source.sections)
        ? source.sections.map((s) => ({ ...s, id: crypto.randomUUID() }))
        : []
    };
    setProposals((prev) => [...prev, copy]);
    pushAppState(false, false, copy.id);
  };

  const handleDeleteProposal = (proposalId) => {
    const target = proposals.find((p) => p.id === proposalId);
    const isTargetInvoice = target?.documentType === 'invoice';
    const sameTypeList = proposals.filter((p) =>
      isTargetInvoice ? p.documentType === 'invoice' : p.documentType !== 'invoice'
    );
    if (sameTypeList.length <= 1) return;
    if (!confirm(`Are you sure you want to delete this ${isTargetInvoice ? 'invoice' : 'proposal'}?`)) return;
    const filtered = proposals.filter((p) => p.id !== proposalId);
    setProposals(filtered);
    const remainingSameType = filtered.filter((p) =>
      isTargetInvoice ? p.documentType === 'invoice' : p.documentType !== 'invoice'
    );
    const nextActive = remainingSameType[0]?.id || filtered[0]?.id;
    pushAppState(false, false, nextActive);
  };

  const handleImportProposal = (importedProposal) => {
    setProposals((prev) => [...prev, importedProposal]);
    pushAppState(false, false, importedProposal.id);
    setSelectedId(importedProposal.sections[0]?.id || null);
  };

  const handleSelectTemplate = (template) => {
    const existing = proposals.find((p) => p.documentType === 'invoice');
    if (existing) {
      setActiveProposalId(existing.id);
      setSelectedId(existing.sections?.[0]?.id || null);
      pushAppState(false, false, existing.id);
      return;
    }

    const newDoc = {
      ...template,
      id: `doc-${Date.now()}`,
      proposalNumber: template.proposalNumber || `INV-2026-0001`,
      date: '',
      sections: Array.isArray(template.sections)
        ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
        : []
    };
    delete newDoc.name;
    delete newDoc.description;
    delete newDoc.category;

    setProposals((prev) => [...prev, newDoc]);
    setSelectedId(newDoc.sections[0]?.id || null);
    pushAppState(false, false, newDoc.id);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  const handleOpenInvoice = () => {
    let target = proposals.find((p) => p.documentType === 'invoice');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-invoice-standard') || proposalTemplates[0];
      target = {
        ...template,
        id: `inv-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'INV-2026-0148',
        date: '',
        sections: []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenDiscovery = () => {
    let target = proposals.find((p) => p.documentType === 'discovery');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-discovery-standard') || sampleDiscoveryDoc;
      target = {
        ...template,
        id: `disc-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-01-2026',
        date: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenNda = () => {
    let target = proposals.find((p) => p.documentType === 'nda');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-nda-standard') || sampleNdaDoc;
      target = {
        ...template,
        id: `nda-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-02-2026',
        date: '',
        effectiveDate: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenMsa = () => {
    let target = proposals.find((p) => p.documentType === 'msa');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-msa-standard') || sampleMsaDoc;
      target = {
        ...template,
        id: `msa-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-04-2026',
        date: '',
        effectiveDate: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenCommercialProposal = () => {
    let target = proposals.find((p) => p.documentType === 'commercial_proposal');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-commercial-proposal-standard') || sampleCommercialProposalDoc;
      target = {
        ...template,
        id: `ctp-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-05-2026',
        date: '',
        effectiveDate: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenSla = () => {
    let target = proposals.find((p) => p.documentType === 'sla');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-sla-standard') || sampleSlaDoc;
      target = {
        ...template,
        id: `sla-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-06-2026',
        date: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenPo = () => {
    let target = proposals.find((p) => p.documentType === 'po');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-po-standard') || samplePoDoc;
      target = {
        ...template,
        id: `po-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-07-2026',
        date: '',
        poDate: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenHandover = () => {
    let target = proposals.find((p) => p.documentType === 'handover');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-handover-standard') || sampleHandoverDoc;
      target = {
        ...template,
        id: `ho-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-08-2026',
        date: '',
        handoverDate: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenClosure = () => {
    let target = proposals.find((p) => p.documentType === 'closure');
    if (!target) {
      const template = proposalTemplates.find((t) => t.id === 'template-closure-standard') || sampleClosureDoc;
      target = {
        ...template,
        id: `cls-${Date.now()}`,
        proposalNumber: template.proposalNumber || 'IGC-ibunify-09-2026',
        date: '',
        sections: Array.isArray(template.sections)
          ? template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
          : []
      };
      delete target.name;
      delete target.description;
      delete target.category;
      setProposals((prev) => [...prev, target]);
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  const handleOpenBuilder = () => {
    let target = proposals.find(
      (p) => p.documentType === 'proposal' || p.id === 'sample-ibunify-proposal-001' || p.id === 'sample-custom-proposal-001'
    );
    if (!target) {
      target = { ...sampleProposal, id: 'sample-ibunify-proposal-001', documentType: 'proposal' };
      setProposals((prev) => [target, ...prev]);
    } else {
      target = { ...sampleProposal, id: target.id, documentType: 'proposal' };
      setProposals((prev) => prev.map((p) => (p.id === target.id ? target : p)));
    }
    setActiveProposalId(target.id);
    setSelectedId(target.sections?.[0]?.id || null);
    pushAppState(false, false, target.id);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-header">
          <div
            className={`brand-title-group ${!officialMode ? 'clickable' : ''}`}
            onClick={!officialMode ? handleGoBack : undefined}
            title={!officialMode ? 'Go back to workspace' : undefined}
          >
            <div className="brand-logo-full" aria-hidden="true">
              <svg className="iglobus-logo-svg" viewBox="0 0 94 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 1st Bar (Left - Shortest) */}
                <rect x="5" y="30" width="19" height="26" rx="1.5" fill="#38b6ff"/>
                <circle cx="14.5" cy="42" r="3.2" fill="#ffffff"/>
                <path d="M8.5 56 C8.5 50.5 11 47.8 14.5 47.8 C18 47.8 20.5 50.5 20.5 56 Z" fill="#ffffff"/>

                {/* 2nd Bar (Middle - Medium) */}
                <rect x="30" y="15" width="19" height="41" rx="1.5" fill="#38b6ff"/>
                <circle cx="39.5" cy="42" r="3.2" fill="#ffffff"/>
                <path d="M33.5 56 C33.5 50.5 36 47.8 39.5 47.8 C43 47.8 45.5 50.5 45.5 56 Z" fill="#ffffff"/>

                {/* 3rd Bar (Right - Tallest) */}
                <rect x="55" y="0" width="19" height="56" rx="1.5" fill="#38b6ff"/>
                <circle cx="64.5" cy="42" r="3.2" fill="#ffffff"/>
                <path d="M58.5 56 C58.5 50.5 61 47.8 64.5 47.8 C68 47.8 70.5 50.5 70.5 56 Z" fill="#ffffff"/>

                {/* iGLOBUS Wordmark text */}
                <text x="39.5" y="74" textAnchor="middle" fill="#64748b" fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontSize="15" fontWeight="500" letterSpacing="0.6">iGLOBUS</text>
              </svg>
            </div>
            <div className="brand-divider" aria-hidden="true"></div>
            <div>
              <h1 className="brand-title">DealDesk</h1>
            </div>
          </div>
        </div>
        <ExportActions
          proposal={activeProposal}
          officialMode={officialMode}
          setOfficialMode={(val) => {
            const nextMode = typeof val === 'function' ? val(officialMode) : val;
            pushAppState(nextMode, false, activeProposalId);
          }}
          previewMode={previewMode}
          setPreviewMode={(val) => {
            const nextPreview = typeof val === 'function' ? val(previewMode) : val;
            pushAppState(false, nextPreview, activeProposalId);
          }}
          onImportProposal={handleImportProposal}
          onLogout={logout}
        />
      </header>

      {!officialMode && (
        <ProposalSelector
          proposals={proposals}
          activeProposalId={activeProposalId}
          onSelectProposal={setActiveProposalId}
          onBack={handleGoBack}
          onDeleteProposal={handleDeleteProposal}
        />
      )}

      <main
        className={`workspace ${
          officialMode
            ? 'official-library'
            : isInvoice
            ? 'invoice-workspace'
            : isDiscovery
            ? 'discovery-workspace'
            : isNda
            ? 'nda-workspace'
            : isMsa
            ? 'msa-workspace'
            : isCommercialProposal
            ? 'commercial-proposal-workspace'
            : isSla
            ? 'sla-workspace'
            : isPo
            ? 'po-workspace'
            : isHandover
            ? 'handover-workspace'
            : isClosure
            ? 'closure-workspace'
            : ''
        } ${previewMode ? 'preview-only' : ''}`}
      >
        {officialMode ? (
          <OfficialProposalLibrary
            activeDocumentFormat={activeDocumentFormat}
            setActiveDocumentFormat={setActiveDocumentFormat}
            onOpenBuilder={handleOpenBuilder}
            onOpenInvoice={handleOpenInvoice}
            onOpenDiscovery={handleOpenDiscovery}
            onOpenNda={handleOpenNda}
            onOpenMsa={handleOpenMsa}
            onOpenCommercialProposal={handleOpenCommercialProposal}
            onOpenSla={handleOpenSla}
            onOpenPo={handleOpenPo}
            onOpenHandover={handleOpenHandover}
            onOpenClosure={handleOpenClosure}
            onSelectTemplate={handleSelectTemplate}
          />
        ) : (
          <>
            {!previewMode && !isInvoice && !isDiscovery && !isNda && !isMsa && !isCommercialProposal && !isSla && !isPo && !isHandover && !isClosure && (
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
