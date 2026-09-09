import React, { useState } from 'react';
import { proposalTemplates } from '../../data/templates.js';

export function ProposalSelector({
  proposals,
  activeProposalId,
  onSelectProposal,
  onCreateProposal,
  onDuplicateProposal,
  onDeleteProposal
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(proposalTemplates[0].id);

  const activeProposal = proposals.find((p) => p.id === activeProposalId) || proposals[0];

  const handleCreateFromTemplate = () => {
    const template = proposalTemplates.find((t) => t.id === selectedTemplateId) || proposalTemplates[0];
    const newProposal = {
      ...template,
      id: `prop-${Date.now()}`,
      proposalNumber: `IBU-SP-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      sections: template.sections.map((sec) => ({ ...sec, id: crypto.randomUUID() }))
    };
    delete newProposal.name;
    delete newProposal.description;
    delete newProposal.category;

    onCreateProposal(newProposal);
    setShowModal(false);
  };

  return (
    <div className="proposal-selector-bar">
      <div className="selector-left">
        <span className="selector-label">Active Proposal:</span>
        <select
          className="proposal-dropdown"
          value={activeProposalId}
          onChange={(e) => onSelectProposal(e.target.value)}
        >
          {proposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.proposalTitle || 'Untitled Proposal'} ({p.preparedFor || 'No Client'})
            </option>
          ))}
        </select>
      </div>

      <div className="selector-actions">
        <button type="button" className="secondary sm" onClick={() => setShowModal(true)}>
          ＋ New from template
        </button>
        <button type="button" className="ghost sm" onClick={() => onDuplicateProposal(activeProposal.id)}>
          Duplicate
        </button>
        {proposals.length > 1 && (
          <button type="button" className="danger sm" onClick={() => onDeleteProposal(activeProposal.id)}>
            Delete
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select a Starter Template</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="template-grid">
              {proposalTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplateId === template.id ? 'active' : ''}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="template-badge">{template.category}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" onClick={handleCreateFromTemplate}>Create Proposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
