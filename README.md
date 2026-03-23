# Orion Arc

> Real-world rocket launches. Visualized on a living planet.

---

## What is Orion Arc?

**Orion Arc** is an immersive, ops-style space launch dashboard that tracks real-world rocket launches across every major space agency — SpaceX, NASA, ESA, ISRO, Blue Origin, Roscosmos, and more.

While most trackers show you a boring table of launches, Orion Arc renders them on an **interactive 3D globe** built with Three.js. Every launch site is a pin on Earth. Select a mission, a trajectory arc animates from the launchpad toward orbit. A live countdown ticks toward the next launch. The whole interface is built to feel like an actual operations center, not a student project.

---

## Core Idea and Vision

Most space apps treat launches as rows in a database. Orion Arc treats them as **events on a planet**.

The central idea is simple: if you want to understand the scale and geography of humanity's reach into space, a list tells you nothing. A globe tells you everything. Seeing that most launches happen from a handful of coastal sites, that trajectory arcs fan out in predictable orbital directions, that some launch sites have fired hundreds of missions while others have fired one that's the kind of insight that only emerges when data is given a physical form.

The vision for Orion Arc is to be the dashboard that makes space feel **visceral and present**, not archived and academic. Every design decision flows from that — dark UI because space is dark, live countdowns because launches are events not records, trajectory arcs because rockets don't go straight up they arc across the sky.

Longer term, Orion Arc is the kind of tool that could sit in a real ops room. The aesthetic isn't decoration — it's the product.

---

## Features

### Core
- **3D Earth** — Three.js globe with launch site pins, trajectory arc animations, and an atmospheric glow layer
- **Live search** — debounced search across mission names, rockets, and agencies
- **Filter** — by agency (SpaceX / NASA / ESA / others) and launch status (success / failed / upcoming)
- **Sort** — by launch date (newest or oldest) or payload mass
- **Mission favorites** — save missions to a personal watchlist, persisted in localStorage
- **Live countdown** — real-time T-minus timer ticking toward the next launch
- **Dark / light mode** — theme toggle, default dark

### Bonus
- Debounced search input — no redundant calls on every keystroke
- Loading skeleton cards — smooth placeholder states while data fetches
- localStorage persistence — favorites and theme survive page reload
- Fully responsive — mobile, tablet, and desktop
- Pagination — launch feed divided into pages

---

## Tech Stack

| Technology | Role |
|---|---|
| HTML | App structure and markup |
| CSS | Base styling and responsive layout |
| JavaScript | Core logic, HOFs, API calls, localStorage |
| Fetch API | All API calls — no external HTTP libraries |
| React (Vite) | Component-based UI and state management |
| Three.js | WebGL 3D globe and trajectory arc animation |

---

## API

### SpaceX API
```
Base URL: https://api.spacexdata.com/v4/
Auth: None — no API key required
```

| Endpoint | Used for |
|---|---|
| `GET /launches` | All launch data — name, date, success, rocket ID |
| `GET /rockets` | Rocket specifications and family info |
| `GET /launchpads` | Launch site coordinates → globe pin placement |
| `GET /crew` | Astronaut data for crewed missions |
| `GET /payloads` | Payload mass and target orbit |

---

## Getting Started

> Deployment method may change as the project develops. This covers local setup for now.

```bash
git clone https://github.com/aviiixbuilds/orion-arc.git
cd orion-arc
npm install
npm run dev
```

App runs at `http://localhost:5173` (no API keys or environment variables needed)

---

## Design Notes

**Dark by default.** Space is dark: the UI reflects its subject matter.

**Color as data.** Launch status is communicated through color at a glance: teal for success, amber for upcoming, red for failure. No status labels needed on the globe.

**The globe is the navigation.** Most dashboards list → detail. In Orion Arc, you navigate by interacting with a 3D Earth. Launch sites are where the story starts.

**Ops aesthetic.** Monospace fonts for telemetry readouts, thin borders, status badges, countdown timers. Feels like a real operations center.

---
