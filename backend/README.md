# WhatsApp-to-Calendar Backend

Node.js + Express backend that uses **OpenClaw Gateway** (personal AI assistant) to parse WhatsApp messages and creates **Google Calendar** events with Google Meet links.

---

## Prerequisites

- Node.js 18+
- [OpenClaw](https://github.com/openclaw/openclaw) installed globally (`npm install -g openclaw@latest`)
- OpenClaw Gateway running locally (`openclaw gateway --port 18789`)
- A Google Cloud project with **Google Calendar API** enabled

---

## 1. OpenClaw Gateway Setup

### Install OpenClaw

```powershell
# Install OpenClaw globally (Node.js 22+ or 24 recommended)
npm install -g openclaw@latest
```

### Configure OpenClaw

Run the onboarding setup (one-time):

```powershell
openclaw onboard --install-daemon
```

This sets up your workspace, models, and optional channels (WhatsApp, Telegram, etc.).

### Run OpenClaw Gateway

```powershell
# Start the Gateway (runs on ws://localhost:18789)
openclaw gateway --port 18789 --verbose
```

The Gateway is the control plane that the backend will call via `openclaw agent` CLI commands.

### Verify Installation

OpenClaw supports multiple models (Claude via Anthropic, ChatGPT via OpenAI, etc.). Verify setup:

```powershell
openclaw doctor
```

---

## 2. Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable **Google Calendar API** → _APIs & Services → Library_
4. Create **OAuth 2.0 credentials** → _APIs & Services → Credentials → Create Credentials → OAuth client ID_
   - Application type: **Desktop app**
5. Download the JSON file and save it as **`credentials.json`** in this folder

---

## 3. Installation

```powershell
# In d:\automate\backend\
npm install
```

---

## 4. Environment Setup

```powershell
copy .env.example .env
```

`.env` is mostly auto-configured. The backend will call `openclaw agent` commands to parse messages.

**Note:** The backend requires OpenClaw Gateway to be running. If it's not, you'll see:
```
[AI Parser] OpenClaw not found. Install with: npm install -g openclaw@latest
[AI Parser] Then start gateway: openclaw gateway --port 18789
```

---

## 5. Authorize Google Calendar (One-time)

```powershell
node server.js
```

Then open **http://localhost:3000/auth** in your browser and complete the Google sign-in. A `token.json` file will be saved automatically.  
You only need to do this once.

---

## 6. Run the Server

```powershell
npm start
# OR for development with auto-reload:
npm run dev
```

---

## 7. Test the API

```powershell
# Meeting message (should create event)
curl -X POST http://localhost:3000/process `
  -H "Content-Type: application/json" `
  -d "{\"sender\":\"Rahul\",\"message\":\"Meeting tomorrow at 3pm with Rahul to discuss project\",\"userId\":\"user123\"}"

# Non-meeting message (should return isSchedulable: false)
curl -X POST http://localhost:3000/process `
  -H "Content-Type: application/json" `
  -d "{\"sender\":\"Mom\",\"message\":\"Can you pick up groceries?\",\"userId\":\"user123\"}"
```

---

## API Reference

### `POST /process`

**Request:**
```json
{
  "sender": "Rahul",
  "message": "Meeting tomorrow at 3pm",
  "userId": "user123"
}
```

**Response (schedulable):**
```json
{
  "isSchedulable": true,
  "reply": "✅ *Meeting Scheduled!*\n📌 *Meeting with Rahul*\n📅 Sunday, 29 March 2026\n🕐 3:00 PM (60 min)\n🎥 Join: https://meet.google.com/xxx-yyyy-zzz",
  "meetLink": "https://meet.google.com/xxx-yyyy-zzz",
  "eventLink": "https://calendar.google.com/calendar/event?eid=...",
  "parsed": { "isSchedulable": true, "title": "Meeting with Rahul", "date": "2026-03-29", "time": "15:00", "durationMinutes": 60 }
}
```

**Response (not schedulable):**
```json
{
  "isSchedulable": false,
  "reply": null,
  "parsed": { "isSchedulable": false }
}
```

---

## Project Structure

```
backend/
├── server.js                  # Entry point
├── .env.example               # Environment variable template
├── credentials.json           # (You create this) Google OAuth credentials
├── token.json                 # (Auto-generated) Google access tokens
├── routes/
│   ├── auth.js                # GET /auth, GET /auth/callback
│   └── process.js             # POST /process
├── services/
│   ├── aiParser.js            # OpenClaw Gateway message parsing
│   ├── calendarService.js     # Google Calendar event creation
│   └── replyGenerator.js      # WhatsApp reply formatting
└── utils/
    └── oauth.js               # Shared OAuth2 client
```
