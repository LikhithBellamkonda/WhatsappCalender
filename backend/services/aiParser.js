const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const OPENCLAW_PORT = process.env.OPENCLAW_PORT || '18789';

/**
 * Calls OpenClaw Gateway agent to parse message and extract meeting data.
 * Requires: openclaw installed globally (npm install -g openclaw@latest)
 * Requires: openclaw gateway running (openclaw gateway --port 18789)
 * @param {string} message
 * @returns {Promise<object>}
 */
async function callOpenClaw(message) {
  const today = new Date().toISOString().split('T')[0];

  const systemContext = `Today's date is ${today}. You are a scheduling assistant.
Analyze this WhatsApp message and extract scheduling details if present.
Provide a response in this JSON format only (no other text):
{
  "isSchedulable": boolean,
  "title": "string or empty",
  "date": "YYYY-MM-DD or empty",
  "time": "HH:mm 24-hour or empty (default 09:00)",
  "durationMinutes": number (default 60),
  "description": "string or empty"
}

Rules:
- isSchedulable=true ONLY if message clearly mentions: meeting, call, sync, interview, appointment, conference, or scheduling intent
- For dates, resolve "tomorrow", "next Monday", etc. relative to today (${today})
- For time, assume 09:00 if not specified
- Return ONLY valid JSON, no markdown, no extra text`;

  try {
    // Call openclaw agent command via CLI
    // The agent will use the configured model in openclaw config
    const { stdout, stderr } = await execFileAsync('openclaw', [
      'agent',
      '--message',
      `${systemContext}\n\nMessage to analyze: "${message}"`,
      '--json',
      '--thinking',
      'minimal',
    ]);

    if (stderr) {
      console.warn('[AI Parser] OpenClaw stderr:', stderr);
    }

    if (!stdout) {
      console.warn('[AI Parser] No output from OpenClaw agent');
      return { isSchedulable: false };
    }

    // Try to extract JSON from the output
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[AI Parser] No JSON found in response:', stdout.substring(0, 200));
      return { isSchedulable: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error('[AI Parser] OpenClaw call failed:', err.message);
    // Check if openclaw is installed
    if (err.code === 'ENOENT') {
      console.error('[AI Parser] OpenClaw not found. Install with: npm install -g openclaw@latest');
      console.error('[AI Parser] Then start gateway: openclaw gateway --port 18789');
    }
    throw err;
  }
}

/**
 * Parses a WhatsApp message and returns structured meeting data.
 * @param {string} message
 * @returns {Promise<object>}
 */
async function parse(message) {
  const parsed = await callOpenClaw(message);
  return parsed;
}

module.exports = { parse };
