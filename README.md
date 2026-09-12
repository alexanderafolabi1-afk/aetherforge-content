# AetherForge Command Deck

Cosmic creator observatory for **X growth** — followers, impressions, engagement, revenue, streaks, and content verticals.  
Repo: [alexanderafolabi1-afk/aetherforge-content](https://github.com/alexanderafolabi1-afk/aetherforge-content)

This is the live **Command Deck** (the dashboard you open every day). Data lives in your browser until you wire real APIs.

**Live after Pages is on:** https://alexanderafolabi1-afk.github.io/aetherforge-content/

---

## What this app does

| Piece | What it does |
| --- | --- |
| **Daily check-in** | Locks a streak. Miss a day and it resets. Hit 14 / 30 and you get a supernova. |
| **Live stats** | Followers, 24h/7d impressions, engagement, monthly revenue (X + tips + other), posts this week. |
| **Growth orbit** | Rings filling toward 100K followers, 10% engagement, $10K/month. |
| **Milestones** | Pre-loaded monuments + ones you add. When a number crosses the line, celebration. |
| **Progress galaxy** | Six planets = content verticals (Threads, Visuals, Longform, Collabs, Livestreams, Experiments). |
| **Top posts** | This week’s best transmissions. |
| **Mission log** | Hand-log hauls, notes, and telemetry until X/Sheets/Stripe are connected. |
| **Connectors** | Instructions for docking live APIs later. Nothing secret lives in the browser. |
| **Executive Briefing tab** | A second screen (Deck / Briefing switcher) with an automated morning summary: engagement velocity, follower growth pace, estimated revenue, and top-performing verticals — all derived from live store data. |
| **Admin PIN lock** | Prompts for a PIN on first open (and every fresh app open after that), plus re-confirms it before Export and Commit telemetry. A local screen lock for a shared/borrowed device — not real account security. Reset it from Connectors. |

Numbers persist in `localStorage` under the key `aetherforge-command-deck`.

---

## What each folder does

```
aetherforge-content/
├── index.html                 App shell, fonts, PWA tags
├── package.json               Dependencies and scripts
├── vite.config.ts             Build tool (alias @ → src, GitHub Pages base path)
├── public/                    Files copied as-is into the site
│   ├── brand/                 Astronaut + six planet images
│   ├── favicon.svg            Tab icon
│   ├── icon-192.png / 512.png Home-screen icons
│   ├── og.jpg                 Share-link card
│   └── manifest.webmanifest   Install-to-home-screen config
├── src/
│   ├── main.tsx               Starts React
│   ├── App.tsx                Renders the Command Deck
│   ├── styles.css             Colors, fonts, motion tokens
│   ├── lib/                   Data + copy (no UI)
│   │   ├── store.ts           All state (zustand + localStorage)
│   │   ├── seed.ts            Placeholder telemetry + milestones
│   │   ├── types.ts           TypeScript shapes
│   │   ├── copy.ts            Space-pun lines and greetings
│   │   ├── format.ts          47.8K / $4,280 helpers
│   │   ├── connectors.ts      How to wire X / Sheets / tips later
│   │   ├── pin.ts             Salted-hash PIN storage (no plaintext)
│   │   └── github-sync.ts     Direct browser → GitHub Contents API commit
│   ├── components/ui/         Buttons, cards, dialogs (Radix)
│   └── components/deck/       The actual observatory
│       ├── command-deck.tsx   Layout
│       ├── hero.tsx           Starfield greeting + astronaut
│       ├── stats-grid.tsx     Big numbers
│       ├── orbit.tsx          Solar-system progress
│       ├── milestones.tsx     Flags and supernovas
│       ├── galaxy-map.tsx     Planets / verticals
│       ├── top-posts.tsx      Content highlights
│       ├── log-panel.tsx      Haul / note / telemetry forms
│       ├── executive-briefing.tsx  Morning summary (Briefing tab)
│       ├── pin-gate.tsx       Full-screen PIN lock on app open
│       ├── pin-confirm-dialog.tsx  Re-confirm PIN for restricted actions
│       └── celebration.tsx    Full-screen win moment
└── .github/workflows/pages.yml  Auto-publish to GitHub Pages
```

---

## Run it on your machine (optional)

Need Node 22.

```bash
npm install
npm run dev
```

Open the URL Vite prints. `npm run build` makes a static `dist/` folder you can drop on any host.

---

## Publish (pick one)

### GitHub Pages (already wired)

1. On GitHub: **Settings → Pages → Source: GitHub Actions**
2. Push to `main` (this repo already has the workflow)
3. Site: `https://alexanderafolabi1-afk.github.io/aetherforge-content/`

### Vercel / Netlify

- Import this repo
- Build command: `npm run build`
- Output: `dist`
- Leave `VITE_BASE` unset (defaults to `/`)

---

## Connect real numbers later

Open **Connectors** in the deck, or read `src/lib/connectors.ts`.

- **X analytics** → followers, impressions, engagement, posts  
- **Sheets** → daily snapshot + revenue journal  
- **Stripe / Ko-fi / tips** → append hauls  

Never put API secrets in the frontend — server routes only. **GitHub Sync** (below) is the one deliberate exception: it needs a token in the browser to commit directly, so it's scoped as narrowly as possible (fine-grained PAT, one repo, Contents-only) and clearly warned about in the UI.

Until then: **Telemetry** tab + **Log haul** is the real workflow.

---

## Automate posting

The **Launch queue** panel stages daily, multi-language posts (with a Queue/Preview tab to markdown-preview each one). **GitHub Sync** (Connectors → GitHub Sync) commits the queue straight to `data/content-queue.json` in this repo the moment it changes — no export, no manual upload. To actually fire posts to X on a schedule, see [`AUTOMATION_GUIDE.md`](./AUTOMATION_GUIDE.md) and import [`n8n-workflow-template.json`](./n8n-workflow-template.json) into n8n.

---

## Reset

Connectors → **Restore demo orbit** wipes local data back to the sample universe.
