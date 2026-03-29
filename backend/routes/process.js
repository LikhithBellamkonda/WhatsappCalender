const express = require('express');
const aiParser = require('../services/aiParser');
const calendarService = require('../services/calendarService');
const replyGenerator = require('../services/replyGenerator');

const router = express.Router();

/**
 * POST /process
 * Body: { sender: string, message: string, userId: string }
 * Returns: { isSchedulable, reply, meetLink, eventLink, parsed }
 */
router.post('/', async (req, res, next) => {
  try {
    const { sender = 'Unknown', message, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '`userId` field is required. Authenticate via Android App first.' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '`message` field is required and must be a string.' });
    }

    console.log(`\n📩 Incoming from [${sender}] for User [${userId}]: ${message}`);

    // ── Step 1: AI Parsing ──────────────────────────────────────────────────
    const parsed = await aiParser.parse(message);
    console.log('🤖 Parsed:', parsed);

    if (!parsed.isSchedulable) {
      console.log('⏭️  Not a schedulable message. Skipping calendar creation.');
      return res.json({ isSchedulable: false, reply: null, parsed });
    }

    // ── Step 2: Create Calendar Event ───────────────────────────────────────
    const { eventLink, meetLink } = await calendarService.createEvent(parsed, sender, userId);
    console.log('📅 Event created:', eventLink);
    console.log('🎥 Meet link:', meetLink);

    // ── Step 3: Generate Reply ──────────────────────────────────────────────
    const reply = replyGenerator.format(parsed, meetLink);
    console.log('💬 Reply ready:', reply);

    res.json({ isSchedulable: true, reply, meetLink, eventLink, parsed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
