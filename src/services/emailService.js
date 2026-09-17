import { getExportFileName } from './exportService.js';

export async function sendProposalEmail({ to, subject, message, proposal, attachment }) {
  if (!to || !to.trim()) {
    throw new Error('Recipient email address is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  const recipient = to.trim();
  const fileName = getExportFileName(proposal, 'pdf');
  
  let attachmentBase64 = '';
  if (attachment) {
    attachmentBase64 = await blobToBase64(attachment);
  }

  const apiRes = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipient,
      subject,
      message,
      attachmentBase64,
      attachmentFileName: fileName
    })
  });

  if (!apiRes.ok) {
    const errorData = await apiRes.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send email.');
  }

  const data = await apiRes.json();
  return {
    success: true,
    method: data.method, // 'smtp' | 'ethereal'
    recipient,
    previewUrl: data.previewUrl,
    sentAt: new Date().toISOString()
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
