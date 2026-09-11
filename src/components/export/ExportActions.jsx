import React, { useState } from 'react';
import { exportPdf } from '../../services/exportService.js';
import { IconDownload, IconCheck } from '../common/Icons.jsx';
import { SendEmailModal } from '../email/SendEmailModal.jsx';

export function ExportActions({
  proposal,
  officialMode,
  setOfficialMode,
  previewMode,
  setPreviewMode,
  onLogout
}) {
  const [pdfStatus, setPdfStatus] = useState('idle'); // 'idle' | 'loading' | 'success'
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handlePdfExport = async (e) => {
    e.preventDefault();
    if (pdfStatus === 'loading') return;
    setPdfStatus('loading');
    try {
      await exportPdf(proposal);
      setPdfStatus('success');
      setTimeout(() => setPdfStatus('idle'), 1600);
    } catch (err) {
      console.error(err);
      setPdfStatus('idle');
    }
  };

  return (
    <>
      <div className="top-actions">
        {!officialMode && (
          <>
            <button
              type="button"
              className="secondary"
              onClick={(e) => {
                e.preventDefault();
                setPreviewMode((v) => !v);
              }}
            >
              {previewMode ? 'Edit mode' : 'Preview'}
            </button>

            <button
              type="button"
              className={`primary-blue-btn ${pdfStatus !== 'idle' ? 'btn-status-active' : ''}`}
              disabled={pdfStatus === 'loading'}
              onClick={handlePdfExport}
            >
              {pdfStatus === 'loading' ? (
                <>
                  <span className="btn-spinner" aria-hidden="true"></span>
                  <span>Generating PDF...</span>
                </>
              ) : pdfStatus === 'success' ? (
                <>
                  <span className="btn-icon"><IconCheck size={14} /></span>
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <span className="btn-icon"><IconDownload size={14} /></span>
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="secondary send-email-action-btn"
              onClick={(e) => {
                e.preventDefault();
                setIsEmailModalOpen(true);
              }}
            >
              <span className="btn-icon">✉️</span>
              <span>Send Email</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="secondary logout-btn"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
        >
          Log out
        </button>
      </div>

      <SendEmailModal
        proposal={proposal}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </>
  );
}
