const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';

// Ensure the database folder exists for tokens
const DB_DIR = path.join(__dirname, '..', 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

/**
 * Returns an authenticated OAuth2 client for the specific user.
 */
function getOAuthClientForUser(userId) {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `credentials.json not found at ${CREDENTIALS_PATH}. ` +
      'Download it from Google Cloud Console → APIs & Services → Credentials.'
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  // Since we are moving to a multi-tenant Web Application paradigm, let's explicitly 
  // set the callback URI for developer environments to standard localhost:3000 callback.
  const redirectUri = (redirect_uris && redirect_uris.includes('http://localhost:3000/auth/callback')) 
    ? 'http://localhost:3000/auth/callback' 
    : redirect_uris[0];

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  if (userId) {
    const tokenPath = path.join(DB_DIR, `${userId}.json`);
    if (fs.existsSync(tokenPath)) {
      const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      oAuth2Client.setCredentials(token);
    }
  }

  return oAuth2Client;
}

function saveTokenForUser(userId, tokens) {
  const tokenPath = path.join(DB_DIR, `${userId}.json`);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
}

module.exports = { getOAuthClientForUser, saveTokenForUser, SCOPES, DB_DIR };
