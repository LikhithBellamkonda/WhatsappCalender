# WhatsApp-to-Calendar Backend

Node.js + Express backend that uses **OpenClaw** (local LLM inference) to parse WhatsApp messages and creates **Google Calendar** events with Google Meet links.

---

## Prerequisites

- Node.js 18+
- [OpenClaw](https://github.com/clawai/openclaw) installed and running locally (`openclaw serve`)
- A Google Cloud project with **Google Calendar API** enabled

---

## 1. OpenClaw Setup

### Install OpenClaw

Clone and install from [GitHub](https://github.com/clawai/openclaw):

```powershell
git clone https://github.com/clawai/openclaw.git
cd openclaw
pip install -r requirements.txt
```

### Run OpenClaw

```powershell
# Start OpenClaw server (it will run on http://localhost:8000)
openclaw serve
```

The API will be available at `http://localhost:8000/api/v1/chat/completions`

### Verify Installation

OpenClaw comes with built-in models. Check available models:

```powershell
openclaw models list
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

Edit `.env` and set your `OPENCLAW_MODEL` (default: `default`). Make sure `OPENCLAW_API_URL` points to your running OpenClaw instance.

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
│   ├── aiParser.js            # OpenAI message parsing
│   ├── calendarService.js     # Google Calendar event creation
│   └── replyGenerator.js      # WhatsApp reply formatting
└── utils/
    └── oauth.js               # Shared OAuth2 client
```
