# WhatsApp Calendar — Android App

Kotlin Android app that reads WhatsApp notifications, sends them to the backend for AI processing, and pre-fills a WhatsApp reply with the Google Meet link.

---

## Prerequisites

- Android Studio **Hedgehog (2023.1.1)** or newer
- Android device or emulator running **Android 8.0 (API 26)** or higher
- WhatsApp installed on the same device
- Backend server running (see `d:/automate/backend/README.md`)

---

## 1. Open Project in Android Studio

1. Launch Android Studio
2. **File → Open** → navigate to `d:\automate\android\`
3. Wait for Gradle sync to complete (downloads dependencies automatically)

---

## 2. Configure Backend URL

The backend URL is configured inside the app's **Settings screen** after installing.  
Default placeholder: `http://192.168.1.100:3000`

Update this to:
- `http://<your-PC-local-IP>:3000` — when testing on the same Wi-Fi network
- Your deployed Render/Railway URL — for production use

> **Tip:** On Windows, find your local IP with: `ipconfig` → look for "IPv4 Address"

---

## 3. Build & Install

```
Run > Run 'app'   (or press Shift+F10)
```

Connect a physical Android device (recommended) or use an emulator.

---

## 4. Grant Notification Access (Required)

1. Open the app on your device
2. Tap **"Grant Notification Access"**
3. In the system screen, find **"WhatsApp Calendar"** and enable it
4. Confirm the warning dialog

> Without this, the app cannot read WhatsApp messages.

---

## 5. Enable Automation

1. Enter your backend URL in the text field and tap **Save URL**
2. Toggle **"Automation Enabled"** to ON
3. The app is now running — send yourself a WhatsApp message like:
   > "Meeting tomorrow at 3pm with John to discuss the project"
4. The app will:
   - Detect the meeting intent
   - Call your backend
   - Open WhatsApp with the Meet link pre-filled

---

## Project Structure

```
android/
├── build.gradle           # Top-level Gradle config
├── settings.gradle        # Module includes
└── app/
    ├── build.gradle       # App dependencies
    └── src/main/
        ├── AndroidManifest.xml
        ├── kotlin/com/whatsapcal/
        │   ├── MainActivity.kt           # UI: toggle, URL settings, log
        │   ├── WhatsAppListenerService.kt # Notification capture
        │   ├── BackendApiService.kt      # HTTP POST to backend (OkHttp)
        │   ├── WhatsAppReplyHelper.kt    # Open WhatsApp with pre-filled text
        │   └── MessageLog.kt            # Persistent log (SharedPreferences)
        └── res/
            ├── layout/
            │   ├── activity_main.xml    # Main screen layout
            │   └── item_log.xml        # Log entry row layout
            ├── values/
            │   ├── colors.xml          # Dark theme + WhatsApp green palette
            │   ├── strings.xml
            │   └── themes.xml
            └── drawable/
                └── log_item_bg.xml
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| App doesn't detect notifications | Re-grant Notification Access in Settings |
| Backend connection failed | Check IP address, ensure PC firewall allows port 3000 |
| WhatsApp doesn't open | Ensure WhatsApp is installed; try reinstalling app |
| "Not a meeting message" | Rephrase to clearly mention time/date/meeting |
