# Oman LEED Land Assessment Platform
## Deployment Guide — GitHub Pages + Anthropic API

---

## ✅ What's New in This Version

- **Claude AI Chat Panel** — Ask any question about the LEED report in Arabic or English
- **Arabic Executive Summary** — Auto-generated professional Arabic report for investors/government
- **AI Recommendations** — Specific, data-driven actions with ROI analysis to maximize LEED score
- **Bilingual Interface** — Full RTL Arabic support in all AI panels
- **Fixed Vite Config** — Removed Kimi-specific plugin, ready for standard deployment

---

## 🚀 Deploying to GitHub Pages

### Step 1 — Push your code to GitHub

```bash
cd /path/to/your/repo
git add .
git commit -m "Add Claude AI integration"
git push origin main
```

### Step 2 — Enable GitHub Pages

1. Go to your repository on GitHub
2. **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save

### Step 3 — Add your Anthropic API key as a Secret

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: `sk-ant-api03-your-actual-key-here`
5. Click **Add secret**

### Step 4 — Trigger a deployment

Push any commit to `main` — the workflow will automatically build and deploy.

Or manually trigger: **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

Your app will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## 🔑 API Key Security Options

| Approach | Security | Convenience |
|---|---|---|
| **GitHub Secret** (recommended for private repos) | Good — key baked into build JS, but repo is private | ✅ Works automatically for all users |
| **Runtime key input** (recommended for public repos) | Best — key never stored anywhere | Users paste key once per session |
| **Both** | Best of both worlds | Key input UI falls back if env var not set |

This app supports **both** simultaneously — if `VITE_ANTHROPIC_API_KEY` is set at build time, the UI skips the key input screen. Otherwise, users enter their key manually.

**Important:** If your GitHub repo is **public**, anyone can inspect the compiled JS and extract your API key. To protect yourself:
- Set a **spending limit** in [Anthropic Console](https://console.anthropic.com) → **Billing** → **Usage limits**
- Or use the runtime key input approach (skip the GitHub Secret step)

---

## 💻 Local Development

```bash
cd app

# Copy and fill in your API key
cp .env.example .env.local
# Edit .env.local and add: VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## 🤖 Claude AI Features

### Chat Panel
- Full bilingual support (Arabic ↔ English, auto-detected)
- Has complete access to all LEED data (scores, solar, wind, climate, soil)
- Remembers last 10 messages for context
- Pre-loaded suggested questions in both languages

### Arabic Executive Summary (التقرير العربي)
- Professional Arabic report suitable for investors and government agencies
- Covers: location, LEED scores, environmental potential, top recommendations, investment priorities
- One-click generation, copy to clipboard

### AI Recommendations
- Specific to your parcel's actual data (solar GHI, wind speed, soil type, temperatures)
- Includes LEED credit names, exact point values, OMR cost estimates, ROI analysis
- Prioritized by LEED points per Omani Rial

---

## 📊 Data Sources (unchanged)

| Data | Source | Accuracy |
|---|---|---|
| Solar (GHI, DNI) | NASA POWER API | ±5-10% |
| Wind speed | NASA POWER API | ±10% |
| Temperature, humidity, rainfall | NASA POWER API | ±5% |
| Soil type, texture, pH | ISRIC SoilGrids | ±15-20% (250m resolution) |
| LEED scoring | LEED v4.1 BD+C algorithm | Indicative — not a certified assessment |
