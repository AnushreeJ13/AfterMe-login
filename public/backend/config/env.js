import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve .env relative to this file so starting the server
// from a different CWD (e.g. project root) still loads variables.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../.env');

const result = dotenv.config({ path: envPath });
if (result.error) {
	// Fall back to default lookup and log a helpful warning
	const fallback = dotenv.config();
	if (fallback.error) {
		console.warn(`.env not found at ${envPath} and fallback lookup failed. ` +
			'Make sure environment variables are set or start the server from the backend folder.');
	}
}
