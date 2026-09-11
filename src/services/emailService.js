/**
 * Email Service Module
 * Handles sending proposal emails with PDF attachments.
 * 
 * IMPORTANT SECURITY:
 * No private SMTP credentials or secret API keys are embedded in this client file.
 */

export async function sendProposalEmail({ to, subject, message, proposal, attachment }) {
  if (!to || !to.trim()) {
    throw new Error('Recipient email address is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  // Simulate network delivery with delay to ensure clean state transitions
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // If mock error testing is needed, can check email domain
  if (to.toLowerCase().includes('fail@error.com')) {
    throw new Error('Unable to send proposal. Please try again.');
  }

  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipient: to.trim(),
    sentAt: new Date().toISOString()
  };
}
