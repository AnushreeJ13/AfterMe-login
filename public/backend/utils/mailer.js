import '../config/env.js';
import nodemailer from 'nodemailer';

// If SENDGRID_API_KEY is set we prefer using SendGrid Web API (HTTP),
// which avoids common SMTP egress/port blocking on some hosts.
let sgMail = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    // lazy import: @sendgrid/mail is added to backend/package.json
    // eslint-disable-next-line import/no-extraneous-dependencies
    sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.warn('SendGrid package not available; falling back to SMTP if configured');
    sgMail = null;
  }

}

// Build SMTP transporter with configurable host/port and timeouts.
const makeSmtpTransport = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: process.env.TLS_REJECT_UNAUTHORIZED !== 'false' },
    // nodemailer options - help with environments that are slow to respond
    connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT || '10000', 10),
    greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT || '10000', 10),
    socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT || '20000', 10)
  });
};

const smtpTransport = makeSmtpTransport();

const mailerInfo = {
  method: sgMail ? 'sendgrid-api' : (smtpTransport ? 'smtp' : 'none')
};

const verifySmtpWithRetries = async (transport, retries = 3) => {
  let attempt = 0;
  let lastErr = null;
  while (attempt < retries) {
    try {
      await transport.verify();
      return true;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const backoff = 500 * attempt;
      console.warn(`Mail verify attempt ${attempt} failed: ${err && err.message ? err.message : err}. Retrying in ${backoff}ms`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
};

const logTransportStatus = async () => {
  if (mailerInfo.method === 'none') {
    console.warn('⚠️ Mailer disabled: no SENDGRID_API_KEY and no EMAIL_USER/EMAIL_PASS configured');
    return;
  }

  if (process.env.MAIL_SKIP_VERIFY === 'true') {
    console.log('⚠️ Skipping mail transporter verify due to MAIL_SKIP_VERIFY=true');
    return;
  }

  try {
    if (mailerInfo.method === 'sendgrid-api') {
      // Send a lightweight test using SendGrid verify by fetching user profile is not available,
      // so we'll just log that SendGrid API key is present and attempt a dry-run send if requested.
      console.log('✅ SendGrid API key present — mailer configured to use SendGrid HTTP API');
    } else if (mailerInfo.method === 'smtp') {
      await verifySmtpWithRetries(smtpTransport, 3);
      console.log('✅ SMTP server ready');
    }
  } catch (err) {
    console.error('❌ Mail server verify failed:', err && err.message ? err.message : err);
  }
};

// Kick off verification (non-blocking)
logTransportStatus();

export const sendWelcomeMail = async (to, name) => {
  if (mailerInfo.method === 'none') {
    console.warn('Skipping sendWelcomeMail: mail transporter not configured');
    return null;
  }

  const fromAddress = process.env.EMAIL_FROM || (`After Me <${process.env.EMAIL_USER || 'no-reply@afterme.app'}>`);
  const subject = 'Welcome to After Me 🤍';
  const html = `
      <h2>Welcome ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>– Team After Me</p>
    `;

  try {
    if (mailerInfo.method === 'sendgrid-api') {
      const msg = {
        to,
        from: fromAddress,
        subject,
        html
      };
      const res = await sgMail.send(msg);
      console.log('✉️ sendWelcomeMail sent via SendGrid:', Array.isArray(res) ? res[0].statusCode : res.statusCode);
      return res;
    }

    const info = await smtpTransport.sendMail({ from: fromAddress, to, subject, html });
    console.log('✉️ sendWelcomeMail sent via SMTP:', info && info.messageId ? info.messageId : info);
    return info;
  } catch (err) {
    console.error('❌ sendWelcomeMail error:', err && err.message ? err.message : err);
    throw err;
  }
};

// Log which credential method is configured (do not log secrets)
console.log('MAIL: using', mailerInfo.method);
