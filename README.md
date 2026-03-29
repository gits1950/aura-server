# Aura Dental Care — Real-time Socket Server

## Deploy on Railway (Free — Recommended)

### Step 1 — Upload this folder to GitHub
1. Go to https://github.com/new
2. Create a new repo called `aura-dental-server`
3. Upload all files in this folder

### Step 2 — Deploy on Railway
1. Go to https://railway.app and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select `aura-dental-server`
4. Railway auto-detects Node.js and deploys it
5. Click **Settings → Generate Domain**
6. Copy your URL — it looks like:
   `https://aura-dental-server-production.up.railway.app`

### Step 3 — Update index.html
In your `index.html`, find this line near the bottom (~line 16946):
```
window.io = window.io || function(){console.log("Socket skipped");};
```
Replace it with:
```html
<script src="https://YOUR-RAILWAY-URL/socket.io/socket.io.js"></script>
```
And find `socket = io();` and change it to:
```js
socket = io('https://YOUR-RAILWAY-URL', {
  query: {
    role: state.currentUser?.role || 'unknown',
    userName: state.currentUser?.name || 'Unknown'
  }
});
```

### Step 4 — Set Environment Variable (optional)
In Railway → Variables, add:
```
ALLOWED_ORIGINS=https://auradentalendo.com,https://www.auradentalendo.com
```

---

## What becomes real-time after this:

| Event | From | To |
|---|---|---|
| 📋 New Prescription | Doctor | Reception (popup + sound) |
| 💰 Payment Confirmed | Reception | Doctor |
| 🖨️ Prescription Printed | Reception | Doctor |
| 👨‍⚕️ Doctor Started Consultation | Doctor | Reception |
| 🔄 Queue Updated | Any | All screens |
| 🧑 New Patient Registered | Reception | Doctor |
| 📅 Appointment Booked | Any | All screens |

## Health Check
Visit your Railway URL in a browser — you'll see:
```json
{
  "status": "🟢 Aura Dental Socket Server Running",
  "connections": 2,
  "uptime": "3600s"
}
```
