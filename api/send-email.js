import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let data = req.body;

    // Handle case where body might be a string or need parsing
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = {};
      }
    }

    if (!data) {
      let bodyStr = '';
      for await (const chunk of req) {
        bodyStr += chunk;
      }
      try {
        data = JSON.parse(bodyStr || '{}');
      } catch (e) {
        data = {};
      }
    }

    const { to, subject, message, attachmentBase64, attachmentFileName } = data || {};

    if (!to || !to.trim()) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const host = process.env.SMTP_HOST || 'smtpout.secureserver.net';
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const from = process.env.SMTP_FROM || user || 'iBunify Sales <sohail@iglobuscc.com>';

    let transporter;
    let isEthereal = false;

    if (user && pass && user !== 'your-email@gmail.com') {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // Fallback to Ethereal test account if SMTP env vars are not configured on Vercel
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isEthereal = true;
    }

    const attachments = [];
    if (attachmentBase64) {
      const cleanBase64 = attachmentBase64.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: attachmentFileName || 'Proposal.pdf',
        content: Buffer.from(cleanBase64, 'base64'),
        contentType: 'application/pdf'
      });
    }

    const mailOptions = {
      from,
      to: to.trim(),
      subject: subject || 'Proposal from iBunify',
      text: message || '',
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #666;">This email was sent automatically from <strong>iBunify DealDesk</strong>.</p>
      </div>`,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;

    console.log(`[Email API Vercel] Sent mail to ${to.trim()} via ${isEthereal ? 'Ethereal Sandbox' : `SMTP (${user})`}`);

    return res.status(200).json({
      success: true,
      method: isEthereal ? 'ethereal' : 'smtp',
      messageId: info.messageId,
      previewUrl,
      recipient: to.trim()
    });
  } catch (err) {
    console.error('Vercel Serverless Email Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
