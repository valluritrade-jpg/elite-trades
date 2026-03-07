# Elite Trades LLC 🏦

**AI-powered trading education platform** with automated X (Twitter) posting.

---

## What's Included

| Layer | Tech | Purpose |
|---|---|---|
| **Frontend** | React + Vite | Website with auth, analyzer, admin dashboard |
| **Hosting** | GitHub Pages | Free static site hosting |
| **Bot** | Node.js | Scheduled X posts via GitHub Actions |
| **AI** | Claude API | Strategy generation + post writing |
| **Auth** | In-app storage | User accounts, sessions, admin role |

---

## Project Structure

```
elite-trades/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Full application (all pages)
│   └── index.css             # Global styles
│
├── scripts/
│   ├── auto-post.js          # X bot — reads config/assets.json
│   └── package.json          # Bot dependencies
│
├── config/
│   └── assets.json           # ← Admin exports here; bot reads from here
│
├── public/
│   └── favicon.svg
│
├── .github/workflows/
│   ├── deploy.yml            # Auto-deploy site on push to main
│   └── auto-post.yml         # Scheduled X posts (daily + weekly)
│
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## Quick Launch Guide

### Prerequisites

- [Node.js 20+](https://nodejs.org) installed
- [Git](https://git-scm.com) installed
- A [GitHub](https://github.com) account
- An [Anthropic API key](https://console.anthropic.com)
- An [X Developer account](https://developer.x.com) (for auto-posting)

---

### Step 1 — Clone & Configure

```bash
# Clone your repo (or start fresh)
git clone https://github.com/YOUR-USERNAME/elite-trades.git
cd elite-trades
```

Open `package.json` and update the homepage URL:
```json
"homepage": "https://YOUR-GITHUB-USERNAME.github.io/elite-trades"
```

Open `vite.config.js` and confirm the base matches your repo name:
```js
base: '/elite-trades/',   // must match your GitHub repo name exactly
```

---

### Step 2 — Install & Run Locally

```bash
# Install frontend dependencies
npm install

# Start local dev server
npm run dev
```

Your site runs at **http://localhost:5173/elite-trades/**

> **First account registered = Admin.** Create your account first to get admin access.

---

### Step 3 — Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it **`elite-trades`** (must match `vite.config.js` base)
3. Set to **Public** (required for free GitHub Pages)
4. Do **not** initialize with README
5. Click **Create Repository**

```bash
# Push your code
git init
git add .
git commit -m "🚀 Initial Elite Trades launch"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/elite-trades.git
git push -u origin main
```

---

### Step 4 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source** → select **GitHub Actions**
3. Save

The `deploy.yml` workflow will automatically build and deploy your site every time you push to `main`.

Your site will be live at:
```
https://YOUR-USERNAME.github.io/elite-trades/
```

---

### Step 5 — Add API Secrets to GitHub

Go to: **Repo → Settings → Secrets and variables → Actions → New repository secret**

#### Required for the website (Analyzer page):
| Secret | Value |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |

#### Required for X auto-posting:
| Secret | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Same Anthropic key (used by bot) |
| `X_API_KEY` | From X Developer Portal |
| `X_API_SECRET` | From X Developer Portal |
| `X_ACCESS_TOKEN` | From X Developer Portal |
| `X_ACCESS_TOKEN_SECRET` | From X Developer Portal |

---

### Step 6 — Set Up X (Twitter) API Keys

1. Go to [developer.x.com](https://developer.x.com) → sign in
2. Create a new **App** (free Basic tier works)
3. Under **User authentication settings**:
   - Enable **Read and Write** permissions
   - App type: **Web App**
4. Go to **Keys and Tokens** tab → generate all 4 keys/tokens
   > ⚠️ Generate Access Token **after** setting Write permissions

---

### Step 7 — Update the Vite Config for Your API Key

In `vite.config.js`, the Anthropic API key is injected at build time. The App uses:
```js
// In src/App.jsx — the fetch call uses the key from env
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
```

> **Note:** For production, consider a proxy/backend to avoid exposing your API key in the browser bundle. For a small educational site this is acceptable — just monitor your usage.

---

### Step 8 — Test the X Bot Manually

1. Go to your repo → **Actions** tab
2. Click **"Elite Trades — Auto Post to X"**
3. Click **"Run workflow"** → choose `daily` or `weekly`
4. Watch the logs in real-time

---

## Admin Dashboard

After launching, log in with your admin account and click **⚙ ADMIN** in the nav.

### Managing Bot Assets

```
Admin Dashboard
  ├── Daily Rotation tab   → assets posted Mon–Fri (one per day, cycled)
  └── Weekly Thread tab    → assets included in Monday deep-dive thread

For each asset you can:
  • Toggle active / paused (live switch)
  • Add new assets (symbol, name, type)
  • Remove assets
```

### Syncing to the Bot

The bot reads `config/assets.json` from your repo. To update it:

1. Make changes in the Admin Dashboard
2. Click **"⬇ EXPORT CONFIG JSON"** → downloads `assets.json`
3. Replace `config/assets.json` in your project with the downloaded file
4. Commit and push:

```bash
cp ~/Downloads/assets.json config/assets.json
git add config/assets.json
git commit -m "chore: update bot asset list"
git push
```

The bot will use your new list on its next scheduled run. ✓

---

## Bot Schedule

| Post Type | Schedule | Content |
|---|---|---|
| **Daily Spotlight** | Mon–Fri, 9 AM EST | Single tweet — one asset, AI-generated educational analysis |
| **Weekly Thread** | Every Monday, 8 AM EST | 7+ tweet thread — all active weekly assets |

To change the schedule, edit `.github/workflows/auto-post.yml`:
```yaml
# Times are in UTC. EST = UTC-5, EDT = UTC-4
- cron: "0 14 * * 1-5"   # 9 AM EST = 14:00 UTC
- cron: "0 13 * * 1"     # 8 AM EST = 13:00 UTC
```
Use [crontab.guru](https://crontab.guru) to build custom schedules.

---

## Monthly Cost Estimate

| Service | Plan | Cost |
|---|---|---|
| GitHub Pages | Free | $0 |
| GitHub Actions | Free (2,000 min/mo) | $0 |
| X Developer API | Basic (1,500 tweets/mo) | $0 |
| Anthropic API | Pay-per-use | ~$1–3/mo |
| Custom Domain (optional) | Namecheap .com | ~$1/mo |
| **Total** | | **~$1–4/month** |

---

## Deploying Updates

Any push to `main` automatically redeploys the site via `deploy.yml`.

```bash
# Make changes → commit → push → site updates in ~60 seconds
git add .
git commit -m "feat: update homepage copy"
git push
```

---

## Disclaimer

All content generated by Elite Trades LLC is for **educational purposes only** and does not constitute financial advice. Users and automated posts include this disclaimer on all outputs.
