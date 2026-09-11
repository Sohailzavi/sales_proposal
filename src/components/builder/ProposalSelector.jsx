import React from 'react';

export function ProposalSelector({
  proposals,
  activeProposalId,
  onSelectProposal,
  onBack,
  onDeleteProposal
}) {
  const activeProposal = proposals.find((p) => p.id === activeProposalId) || proposals[0];
  const isInvoice = activeProposal?.documentType === 'invoice';
  const isDiscovery = activeProposal?.documentType === 'discovery';
  const isNda = activeProposal?.documentType === 'nda';
  const isMsa = activeProposal?.documentType === 'msa';
  const isCommercialProposal = activeProposal?.documentType === 'commercial_proposal';
  const isSla = activeProposal?.documentType === 'sla';
  const isPo = activeProposal?.documentType === 'po';
  const isHandover = activeProposal?.documentType === 'handover';
  const isClosure = activeProposal?.documentType === 'closure';

  const filteredProposals = proposals.filter((p) => {
    if (isInvoice) return p.documentType === 'invoice';
    if (isDiscovery) return p.documentType === 'discovery';
    if (isNda) return p.documentType === 'nda';
    if (isMsa) return p.documentType === 'msa';
    if (isCommercialProposal) return p.documentType === 'commercial_proposal';
    if (isSla) return p.documentType === 'sla';
    if (isPo) return p.documentType === 'po';
    if (isHandover) return p.documentType === 'handover';
    if (isClosure) return p.documentType === 'closure';
    return (
      p.documentType !== 'invoice' &&
      p.documentType !== 'discovery' &&
      p.documentType !== 'nda' &&
      p.documentType !== 'msa' &&
      p.documentType !== 'commercial_proposal' &&
      p.documentType !== 'sla' &&
      p.documentType !== 'po' &&
      p.documentType !== 'handover' &&
      p.documentType !== 'closure'
    );
  });

  const selectorLabel = isInvoice
    ? 'Active Invoice:'
    : isDiscovery
    ? 'Active Discovery Doc:'
    : isNda
    ? 'Active Mutual NDA:'
    : isMsa
    ? 'Active Master Services Agreement:'
    : isCommercialProposal
    ? 'Active Statement of Work (SOW):'
    : isSla
    ? 'Active Service Level Agreement (SLA):'
    : isPo
    ? 'Active Purchase Order (PO):'
    : isHandover
    ? 'Active Delivery & Handover Sign-off:'
    : isClosure
    ? 'Active Project Closure & Hypercare:'
    : 'Active Proposal:';


  return (
    <div className="proposal-selector-bar">
      <div className="selector-left">
        <span className="selector-label">{selectorLabel}</span>
        <select
          className="proposal-dropdown"
          value={activeProposalId}
          onChange={(e) => onSelectProposal(e.target.value)}
        >
          {filteredProposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.proposalTitle ||
                (isInvoice
                  ? 'Untitled Invoice'
                  : isDiscovery
                  ? 'Untitled Discovery'
                  : isNda
                  ? 'Untitled NDA'
                  : isMsa
                  ? 'Untitled MSA'
                  : isCommercialProposal
                  ? 'Untitled SOW'
                  : isSla
                  ? 'Untitled SLA'
                  : isPo
                  ? 'Untitled PO'
                  : isHandover
                  ? 'Untitled Delivery Doc'
                  : isClosure
                  ? 'Untitled Closure Doc'
                  : 'Untitled Proposal')}{' '}
              ({p.preparedFor || 'No Client'})
            </option>
          ))}
        </select>
      </div>

      <div className="selector-actions">
        <button
          type="button"
          className="secondary sm selector-back-btn"
          onClick={onBack}
          title="Go back to workspace"
          aria-label="Go back to workspace"
        >
          ← Back
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

export default ProposalSelector;