console.log('Generating URL...');
try {
  const { getOAuthClient, SCOPES } = require('./utils/oauth');
  const oAuth2Client = getOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  console.log('URL: ', authUrl);
} catch (e) {
  console.log('Error: ', e.message);
}
