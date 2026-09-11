import React, { useState } from 'react';
import { generatePdfBlob } from '../../services/exportService.js';
import { sendProposalEmail } from '../../services/emailService.js';
import { IconCheck } from '../common/Icons.jsx';

export function SendEmailModal({ proposal, isOpen, onClose }) {
  if (!isOpen || !proposal) return null;

  const defaultCompany = proposal.company || proposal.proposalTitle || 'Client';
  const defaultSubject = `Proposal – ${defaultCompany}`;
  const defaultMessage = `Dear Client,\n\nPlease find our proposal attached for your consideration.\n\nRegards,\niBunify Sales Team`;
  const attachmentFileName = `${proposal.proposalNumber || proposal.proposalTitle || 'Proposal'}.pdf`;

  const [toEmail, setToEmail] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim());
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (status === 'SENDING') return;

    if (!toEmail.trim()) {
      setStatus('ERROR');
      setErrorMessage('Recipient email address is required.');
      return;
    }

    if (!validateEmail(toEmail)) {
      setStatus('ERROR');
      setErrorMessage('Please enter a valid email address (e.g. client@gmail.com).');
      return;
    }

    setStatus('SENDING');
    setErrorMessage('');

    try {
      // Generate PDF attachment from current editable proposal
      const pdfBlob = await generatePdfBlob(proposal);

      await sendProposalEmail({
        to: toEmail.trim(),
        subject: defaultSubject,
        message,
        proposal,
        attachment: pdfBlob
      });

      setSuccessEmail(toEmail.trim());
      setStatus('SUCCESS');
    } catch (err) {
      console.error('Send Email Error:', err);
      setStatus('ERROR');
      setErrorMessage(err.message || 'Unable to send proposal. Please try again.');
    }
  };

  const handleClose = () => {
    if (status === 'SENDING') return;
    setStatus('IDLE');
    setErrorMessage('');
    setToEmail('');
    setMessage(defaultMessage);
    onClose();
  };

  return (
    <div className="email-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="send-proposal-title">
      <div className="email-modal-card">
        <header className="email-modal-header">
          <h2 id="send-proposal-title">Send Proposal</h2>
          <button
            type="button"
            className="email-modal-close-btn"
            onClick={handleClose}
            disabled={status === 'SENDING'}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        {status === 'SUCCESS' ? (
          <div className="email-modal-body">
            <div className="email-success-banner" role="status">
              <div className="email-success-icon">
                <IconCheck size={20} />
              </div>
              <p>Proposal sent successfully to <strong>{successEmail}</strong></p>
            </div>
            <div className="email-modal-footer">
              <button
                type="button"
                className="primary-blue-btn"
                onClick={handleClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="email-modal-body">
            {status === 'ERROR' && (
              <div className="email-error-banner" role="alert">
                <span>⚠️ {errorMessage || 'Unable to send proposal. Please try again.'}</span>
              </div>
            )}

            <label className="email-field-label">
              <span>To <strong className="required-star">*</strong></span>
              <input
                type="email"
                className="email-input"
                value={toEmail}
                onChange={(e) => {
                  setToEmail(e.target.value);
                  if (status === 'ERROR') setStatus('IDLE');
                }}
                placeholder="client@gmail.com"
                disabled={status === 'SENDING'}
                required
                autoFocus
              />
            </label>

            <label className="email-field-label">
              <span>Subject</span>
              <input
                type="text"
                className="email-input readonly-subject"
                value={defaultSubject}
                readOnly
                disabled
              />
            </label>

            <label className="email-field-label">
              <span>Message</span>
              <textarea
                className="email-textarea"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === 'SENDING'}
              />
            </label>

            <div className="email-attachment-box">
              <span className="attachment-icon">📎</span>
              <span className="attachment-name">{attachmentFileName}</span>
            </div>

            <footer className="email-modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={handleClose}
                disabled={status === 'SENDING'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-blue-btn send-btn"
                disabled={status === 'SENDING'}
              >
                {status === 'SENDING' ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true"></span>
                    <span>Sending Email...</span>
                  </>
                ) : (
                  <span>Send Email</span>
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
