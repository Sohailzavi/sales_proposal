import React from 'react';

export function ProposalSelector({
  proposals,
  activeProposalId,
  onSelectProposal,
  onDuplicateProposal,
  onDeleteProposal
}) {
  const activeProposal = proposals.find((p) => p.id === activeProposalId) || proposals[0];
  const isInvoice = activeProposal?.documentType === 'invoice';

  const filteredProposals = proposals.filter((p) =>
    isInvoice ? p.documentType === 'invoice' : p.documentType !== 'invoice'
  );

  return (
    <div className="proposal-selector-bar">
      <div className="selector-left">
        <span className="selector-label">{isInvoice ? 'Active Invoice:' : 'Active Proposal:'}</span>
        <select
          className="proposal-dropdown"
          value={activeProposalId}
          onChange={(e) => onSelectProposal(e.target.value)}
        >
          {filteredProposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.proposalTitle || (isInvoice ? 'Untitled Invoice' : 'Untitled Proposal')} ({p.preparedFor || 'No Client'})
            </option>
          ))}
        </select>
      </div>

      <div className="selector-actions">
        <button type="button" className="ghost sm" onClick={() => onDuplicateProposal(activeProposal.id)}>
          Duplicate
        </button>
        {filteredProposals.length > 1 && (
          <button type="button" className="danger sm" onClick={() => onDeleteProposal(activeProposal.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
