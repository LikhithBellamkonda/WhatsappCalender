const express = require('express');
const { getOAuthClientForUser, saveTokenForUser, SCOPES } = require('../utils/oauth');

const router = express.Router();

// ─── Step 1: Redirect user to Google consent page ────────────────────────────
router.get('/', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).send('<h2>❌ Missing userId. Open this from the Android app!</h2>');
  }

  const oAuth2Client = getOAuthClientForUser(null);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force refresh_token to be returned
    state: userId, // Pass userId through to the callback
  });
  
  res.redirect(authUrl);
});

// ─── Step 2: Handle OAuth callback, save tokens ──────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.status(400).send(`<h2>❌ Authorization denied: ${error}</h2>`);
  }
  if (!code || !userId) {
    return res.status(400).send('<h2>❌ Missing authorization code or userId.</h2>');
  }

  try {
    const oAuth2Client = getOAuthClientForUser(null);
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Save tokens specifically for this Android user
    saveTokenForUser(userId, tokens);
    console.log(`✅ Google token saved for user ${userId}`);

    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2>✅ Authorization successful!</h2>
        <p>Your Google Calendar is now permanently connected to your phone.</p>
        <p>You can close this tab and return to the Android App.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('[AUTH] Token exchange failed:', err.message);
    res.status(500).send(`<h2>❌ Token exchange failed: ${err.message}</h2>`);
  }
});

module.exports = router;
