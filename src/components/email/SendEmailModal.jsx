import React, { useState } from 'react';
import { generatePdfBlob, getExportFileName } from '../../services/exportService.js';
import { sendProposalEmail } from '../../services/emailService.js';
import { IconCheck } from '../common/Icons.jsx';

export function SendEmailModal({ proposal, isOpen, onClose }) {
  if (!isOpen || !proposal) return null;

  const defaultCompany = proposal.company || proposal.proposalTitle || 'Client';
  const defaultSubject = `Proposal – ${defaultCompany}`;
  const defaultMessage = `Dear Client,\n\nPlease find our proposal attached for your consideration.\n\nRegards,\nibunify Sales Team`;
  const attachmentFileName = getExportFileName(proposal, 'pdf');

  const [toEmail, setToEmail] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [sendResult, setSendResult] = useState(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim());
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      const pdfBlob = await generatePdfBlob(proposal);

      const result = await sendProposalEmail({
        to: toEmail.trim(),
        subject: defaultSubject,
        message,
        proposal,
        attachment: pdfBlob
      });

      setSuccessEmail(toEmail.trim());
      setSendResult(result);
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
    setSendResult(null);
    onClose();
  };

  return (
    <div className="email-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="send-proposal-title">
      <div className="email-modal-card">
        <header className="email-modal-header">
          <h2 id="send-proposal-title">Send Proposal via Email</h2>
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
              <p style={{ fontWeight: '700', fontSize: '15px', margin: 0 }}>
                Proposal Delivered Successfully!
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#166534' }}>
                Sent to <strong>{successEmail}</strong>
              </p>

              {sendResult?.method === 'ethereal' && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fffbebf0', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e', textAlign: 'left', width: '100%' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '800' }}>⚠️ Google SMTP Setup Needed</p>
                  <p style={{ margin: 0, lineHeight: '1.4' }}>
                    Please configure <code>SMTP_USER</code> and <code>SMTP_PASS</code> in your <code>.env</code> file to deliver directly to real recipient inboxes.
                  </p>
                </div>
              )}
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
                rows={5}
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
