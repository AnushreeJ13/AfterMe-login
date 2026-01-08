import '../config/env.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,           // ✅ REQUIRED
  secure: false,       // ✅ REQUIRED
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Mail server error:', err);
  } else {
    console.log('✅ Mail server ready');
  }
});

export const sendWelcomeMail = async (to, name) => {
  return transporter.sendMail({
    from: `"After Me" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to After Me 🤍',
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>– Team After Me</p>
    `
  });
};

console.log('MAIL USER:', process.env.EMAIL_USER);
console.log('MAIL PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
