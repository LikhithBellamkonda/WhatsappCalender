const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// ── Tool schema for structured extraction ────────────────────────────────────
const TOOL_SCHEMA = {
  type: 'function',
  function: {
    name: 'extract_meeting',
    description: 'Extract meeting/scheduling details from a WhatsApp message. ' +
                 'Return isSchedulable=false if the message is not about a meeting, call, or event.',
    parameters: {
      type: 'object',
      properties: {
        isSchedulable: {
          type: 'boolean',
          description: 'True only if this message contains a clear scheduling intent (meeting, call, sync, interview, etc.)',
        },
        title: {
          type: 'string',
          description: 'Short event title, e.g. "Meeting with Rahul". Leave empty if not schedulable.',
        },
        date: {
          type: 'string',
          description: 'ISO date string YYYY-MM-DD. Resolve relative terms like "tomorrow" against today\'s date.',
        },
        time: {
          type: 'string',
          description: 'Start time in 24-hour HH:mm format, e.g. "15:00". Assume 09:00 if not stated.',
        },
        durationMinutes: {
          type: 'integer',
          description: 'Duration in minutes. Default to 60 if not mentioned.',
        },
        description: {
          type: 'string',
          description: 'Additional context from the message to add to the event description.',
        },
      },
      required: ['isSchedulable'],
    },
  },
};

/**
 * Parses a WhatsApp message and returns structured meeting data.
 * @param {string} message
 * @returns {Promise<object>}
 */
async function parse(message) {
  // Provide today's date so the model can resolve relative dates
  const today = new Date().toISOString().split('T')[0];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          `You are a scheduling assistant. Today's date is ${today}. ` +
          'Analyze the user\'s WhatsApp message and extract scheduling details if present. ' +
          'Always call the extract_meeting function.',
      },
      { role: 'user', content: message },
    ],
    tools: [TOOL_SCHEMA],
    tool_choice: { type: 'function', function: { name: 'extract_meeting' } },
    temperature: 0,
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    console.warn('[AI Parser] No tool call returned — treating as non-schedulable.');
    return { isSchedulable: false };
  }

  const args = JSON.parse(toolCall.function.arguments);
  return args;
}

module.exports = { parse };
