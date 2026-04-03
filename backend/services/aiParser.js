const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat';
const MODEL = process.env.OLLAMA_MODEL || 'llama2';

/**
 * Calls Ollama API to get structured meeting data.
 * @param {string} message
 * @returns {Promise<object>}
 */
async function callOllama(message) {
  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `You are a scheduling assistant. Today's date is ${today}.
Analyze the WhatsApp message and extract scheduling details if present.
Respond ONLY with a valid JSON object, no other text.
Use this exact structure:
{
  "isSchedulable": boolean,
  "title": "string or empty",
  "date": "YYYY-MM-DD or empty",
  "time": "HH:mm or empty (default 09:00)",
  "durationMinutes": number (default 60),
  "description": "string or empty"
}

Rules:
- isSchedulable=true only if message mentions meeting, call, sync, interview, or scheduling intent
- For dates, resolve relative terms like "tomorrow", "next Monday" against today (${today})
- For time, assume 09:00 if not specified
- Return valid JSON only.`;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content;

    if (!content) {
      console.warn('[AI Parser] No content from Ollama');
      return { isSchedulable: false };
    }

    // Extract JSON from response (handle cases where model adds extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[AI Parser] No JSON found in response:', content);
      return { isSchedulable: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    console.error('[AI Parser] Ollama call failed:', err.message);
    throw err;
  }
}

/**
 * Parses a WhatsApp message and returns structured meeting data.
 * @param {string} message
 * @returns {Promise<object>}
 */
async function parse(message) {
  const parsed = await callOllama(message);
  return parsed;
}

module.exports = { parse };
