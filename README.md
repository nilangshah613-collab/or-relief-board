# OR Relief Board — Vercel Deployment

Deploy this folder to get a live URL your whole team can open from any device.

```
or-relief-board-vercel/
├── vercel.json          ← routing config
├── package.json
├── .gitignore
├── api/                 ← serverless functions (replace the local proxy)
│   ├── login.js         ← POST /api/login
│   ├── schedule.js      ← GET  /api/schedule
│   ├── staff.js         ← GET  /api/staff
│   └── health.js        ← GET  /api/health
└── public/              ← static frontend
    ├── index.html
    └── qgenda-api.js
```

---

## Deploy in 5 steps

### Step 1 — Create a GitHub repository

1. Go to https://github.com/new
2. Repository name: `or-relief-board`
3. Set to **Private** (recommended)
4. Click **Create repository**
5. GitHub will show a page with setup commands — keep this tab open

### Step 2 — Upload this folder to GitHub

**Option A — GitHub web upload (no command line needed)**

1. On your new repo page click **uploading an existing file**
2. Drag the entire contents of this folder into the upload area
   - `vercel.json`, `package.json`, `.gitignore`
   - The `api/` folder and all its files
   - The `public/` folder and all its files
3. Click **Commit changes**

**Option B — Terminal (faster if Node is installed)**

```bash
cd or-relief-board-vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/or-relief-board.git
git push -u origin main
```

### Step 3 — Import to Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your `or-relief-board` repository
3. Leave all settings at their defaults — Vercel auto-detects everything
4. Click **Deploy**
5. Wait ~30 seconds — Vercel builds and gives you a live URL like:
   `https://or-relief-board-abc123.vercel.app`

### Step 4 — Set your Qgenda company key (optional but recommended)

This locks the API to your organisation so the serverless functions
can't be used as an open relay.

1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add: `QGENDA_COMPANY_KEY` = your Qgenda company key
3. Click **Save** → Vercel redeploys automatically (~20 seconds)

### Step 5 — Open the app and configure

1. Click the URL Vercel gave you
2. Click **Settings** in the top right
3. Enter your Qgenda company key, email, and password
4. Click **Save** → then **Sync Qgenda**

Your credentials are stored in your browser's localStorage — they never
leave your device and are not sent to Vercel's servers.

---

## Sharing with your team

Send them the Vercel URL. They open it in any browser — no install needed.
Each person enters their own Qgenda credentials in Settings on first use.

If you want a custom URL (e.g. `relief.yourhospital.org`), Vercel supports
custom domains under Project → Settings → Domains.

---

## Updating the app

Any time you push a change to GitHub, Vercel redeploys automatically in ~30s.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Sync failed" after deploy | Check Vercel → Functions tab for error logs |
| 403 on /api/schedule | QGENDA_COMPANY_KEY env var doesn't match what you entered in Settings |
| Blank board after sync | Adjust tag filter in Settings to match your Qgenda task tags |
| Changes not showing | Hard-refresh the browser (Cmd+Shift+R / Ctrl+Shift+R) |
