# WhatsApp-to-Calendar Backend

Node.js + Express backend that uses **Ollama** (local LLM) to parse WhatsApp messages and creates **Google Calendar** events with Google Meet links.

---

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally (`ollama serve`)
- A Google Cloud project with **Google Calendar API** enabled

---

## 1. Ollama Setup

### Install Ollama

Download from [ollama.ai](https://ollama.ai) for Windows, Mac, or Linux.

### Run Ollama

```powershell
# Start Ollama server (it will run on http://localhost:11434)
ollama serve
```

### Download a Model

In another terminal:

```powershell
# Download Mistral (recommended, ~7.3GB)
ollama pull mistral

# OR other options:
# ollama pull neural-chat  (smaller, faster)
# ollama pull llama2        (larger, more powerful)
# ollama pull openchat      (balanced)
```

Verify installation:

```powershell
ollama list
```

You should see your model listed.

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

Edit `.env` and set your `OLLAMA_MODEL` (default: `mistral`). Make sure `OLLAMA_API_URL` points to your running Ollama instance.

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
