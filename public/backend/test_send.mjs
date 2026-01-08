import './config/env.js';
import { sendWelcomeMail } from './utils/mailer.js';

(async () => {
  const to = process.env.TEST_TO || process.env.EMAIL_USER || 'no-reply@example.com';
  try {
    console.log('Testing sendWelcomeMail to', to);
    const res = await sendWelcomeMail(to, 'Test User');
    console.log('Result:', res);
  } catch (err) {
    console.error('Test send failed:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
})();
