import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const emailApiPlugin = () => ({
    name: 'email-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(bodyStr || '{}');
            const { to, subject, message, attachmentBase64, attachmentFileName } = data;

            if (!to || !to.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Recipient email is required' }));
              return;
            }

            const host = env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
            const port = Number(env.SMTP_PORT || process.env.SMTP_PORT || 587);
            const user = env.SMTP_USER || process.env.SMTP_USER || '';
            const pass = env.SMTP_PASS || process.env.SMTP_PASS || '';
            const from = env.SMTP_FROM || process.env.SMTP_FROM || user || 'iBunify Sales Team <sales@ibunify.com>';

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
              // Fallback to Ethereal test account if .env user/pass is not set yet
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
              from: from,
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

            console.log(`[Email API] Sent mail to ${to.trim()} via ${isEthereal ? 'Ethereal Test Sandbox' : `Google SMTP (${user})`}`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                method: isEthereal ? 'ethereal' : 'smtp',
                messageId: info.messageId,
                previewUrl,
                recipient: to.trim()
              })
            );
          } catch (err) {
            console.error('Email API Server Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Failed to send email' }));
          }
        });
      });
    },
    configurePreviewServer(server) {
      // preview server handler
    }
  });

  return {
    plugins: [react(), emailApiPlugin()]
  };
});
