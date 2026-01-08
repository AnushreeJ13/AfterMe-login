import serverless from 'serverless-http';
import app from '../public/backend/app.js';
import connectDB from '../public/backend/config/db.js';

const handler = serverless(app);

export default async function (req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Error connecting to DB in serverless handler:', err.message || err);
    // proceed — requests may still fail but we want to surface errors in logs
  }
  return handler(req, res);
}
