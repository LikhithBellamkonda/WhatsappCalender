/**
 * Formats the final WhatsApp reply string.
 * @param {object} parsed   - { title, date, time, durationMinutes }
 * @param {string} meetLink - Google Meet URL
 * @returns {string}
 */
function format(parsed, meetLink) {
  const { title, date, time, durationMinutes = 60 } = parsed;

  // Format date: "2026-03-29" → "29 Mar 2026"
  const dateObj = new Date(`${date}T${time}:00`);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  // Format time: "15:00" → "3:00 PM"
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const lines = [
    `✅ *Meeting Scheduled!*`,
    ``,
    `📌 *${title}*`,
    `📅 ${formattedDate}`,
    `🕐 ${formattedTime} (${durationMinutes} min)`,
  ];

  if (meetLink) {
    lines.push(`🎥 Join: ${meetLink}`);
  }

  lines.push(``, `_(Auto-scheduled via AI Assistant)_`);

  return lines.join('\n');
}

module.exports = { format };
