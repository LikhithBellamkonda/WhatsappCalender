const { google } = require('googleapis');
const { getOAuthClientForUser } = require('../utils/oauth');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

/**
 * Creates a Google Calendar event with a Google Meet link.
 * @param {object} parsed  - Output from aiParser: { title, date, time, durationMinutes, description }
 * @param {string} sender  - WhatsApp sender name (added to event description)
 * @param {string} userId  - The unique user making the request
 * @returns {Promise<{ eventLink: string, meetLink: string }>}
 */
async function createEvent(parsed, sender, userId) {
  const auth = getOAuthClientForUser(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const { title, date, time, durationMinutes = 60, description = '' } = parsed;

  // Build start/end DateTime strings
  const [hours, minutes] = time.split(':').map(Number);
  const startDt = new Date(`${date}T${time}:00`);
  const endDt = new Date(startDt.getTime() + durationMinutes * 60 * 1000);

  const isoStart = startDt.toISOString();
  const isoEnd   = endDt.toISOString();

  const eventBody = {
    summary: title,
    description: `📱 Scheduled from WhatsApp message from ${sender}.\n\n${description}`.trim(),
    start: { dateTime: isoStart, timeZone: 'Asia/Kolkata' },
    end:   { dateTime: isoEnd,   timeZone: 'Asia/Kolkata' },
    conferenceData: {
      createRequest: {
        requestId: `whatsapcal-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup',  minutes: 10 },
        { method: 'email',  minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: eventBody,
    conferenceDataVersion: 1, // Required to trigger Meet link generation
    sendNotifications: true,
  });

  const event = response.data;
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  )?.uri || null;

  return {
    eventLink: event.htmlLink,
    meetLink,
  };
}

module.exports = { createEvent };
