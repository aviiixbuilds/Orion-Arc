<div align="center">

# 🛸 ORION ARC

### Track real-world rocket launches with cinematic visualizations

[![Status](https://img.shields.io/badge/status-in%20development-orange?style=flat-square)](#)
[![API](https://img.shields.io/badge/API-SpaceX-blue?style=flat-square)](https://api.spacexdata.com/v4/)
[![Tech](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JS-black?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)

<br/>

> *Most space apps treat launches as rows in a database.*
> *Orion Arc treats them as events on a planet.*

</div>

---

## 🌌 What is Orion Arc?

**Orion Arc** is an immersive, ops-style space launch dashboard that tracks real-world rocket launches. 

While most trackers give you a boring list, Orion Arc renders launches with a **cinematic scroll-driven hero video** and a custom **Canvas-based Orbital Visualiser**. Every launch site is an animated pin on Earth. Select a mission — a trajectory arc animates from the launchpad toward orbit. The whole interface is designed to feel like an actual operations center, not a college assignment.

---

## 💡 Core Idea and Vision

Most space apps treat launches as rows in a database. Orion Arc treats them as **events on a planet**.

The central idea is simple: if you want to understand the scale and geography of humanity's reach into space, a list tells you nothing. Seeing that trajectory arcs fan out in predictable orbital directions, that some launch sites have fired hundreds of missions while others have fired one — that's the kind of insight that emerges when data is visualised.

The vision for Orion Arc is to be the dashboard that makes space feel **visceral and present**, not archived and academic. Every design decision flows from that — dark UI because space is dark, animated orbital trajectories because rockets don't go straight up — they arc across the sky.

---

## ⚡ Features

### 🔵 Core Features

| Feature | Description |
|---|---|
| 🌍 **Orbital Map Visualiser** | Custom Canvas 2D engine with Earth representation, animated launch site pins, and rendering of trajectory arcs |
| 🎬 **Cinematic Hero** | Scroll-driven video background with hardware-accelerated 3D typography and parallax animations |
| 🔍 **Live Search** | Debounced search across mission names, rockets, and agencies |
| 🎯 **Filter** | Filter by agency and launch status (success / failed / upcoming) |
| 📊 **Sort** | Sort by launch date (newest or oldest) or payload mass |
| ❤️ **Mission Favorites** | Save missions to a personal watchlist, persisted via localStorage |
| ⏱️ **Live UTC/IST Clock** | Real-time clock in the navigation bar |
| 🌙 **Dark / Light Mode** | Full theme toggle — dark by default |
| 📋 **Mission Detail Panel** | Click any launch to see full mission info — rocket, payload, crew, orbit type, and outcome |
| 📅 **Launch Timeline** | Chronological visual timeline of all launches — built purely with HTML/SVG |

### 🟡 Tech & Performance Enhancements

| Feature | Description |
|---|---|
| ⌨️ **Debounced Search** | Search fires only after user stops typing — no redundant filtering computations |
| 💀 **Loading Indicators** | Placeholder skeleton cards animate while data is fetching |
| 💾 **Local Storage** | Favorites and theme preference survive page reload |
| 📱 **Responsive Design** | Adapts cleanly across mobile, tablet, and desktop |
| 📄 **Pagination** | Launch feed split into pages — fast load, easy navigation |
| 🚀 **Agency Stats Panel** | Live-computed stats per agency — total launches, success rate |
| 📍 **Custom Iconography** | Dedicated 14x14 assets for mission parameters like orbit, rocket, and date |
| ⚡ **Hardware Acceleration** | Scroll-spy, 60fps animations, using Intersection Observer algorithms |

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **HTML** | App structure and semantic markup |
| **Vanilla CSS** | Styling, advanced 3D transforms, keyframe animations, and responsive layouts |
| **Vanilla JavaScript** | Core logic, data shaping, pagination, filtering, and Canvas 2D rendering |
| **Canvas API** | Zero-dependency Orbital Arc Visualiser — drawing Earth, orbit rings, and animated trajectories |
| **Fetch API** | Parallel HTTP data fetching from SpaceX API |

---

## 📡 APIs

### SpaceX API
```
Base URL : https://api.spacexdata.com/v4/
Auth     : None — no API key required
```

| Endpoint | Used for |
|---|---|
| `GET /launches` | All launch data — name, date, success status, rocket ID |
| `GET /rockets` | Rocket specs and family info |
| `GET /launchpads` | Launch site coordinates → orbital map pin placement |
| `GET /payloads` | Payload mass and target orbit type |

---

## 🚀 Getting Started

> Deployment method may change as the project develops. This covers local setup for now.

```bash
git clone https://github.com/aviiixbuilds/orion-arc.git
cd orion-arc
```

To run the local server quickly:
```bash
npx serve -l 3000
```
Open `http://localhost:3000` in your browser.

---

## 🎨 Design Notes

**Dark by default.** Space is dark — the UI reflects its subject matter.

**Color as data.** Launch status communicates through color at a glance — teal for success, amber for upcoming, red for failure.

**Ops aesthetic.** Monospace fonts for telemetry readouts, thin borders, status badges, radial gradients. Built to feel like a real operations center.

---

<div align="center">

*Orion Arc — built purely with HTML · CSS · Vanilla JavaScript*
*Data from the SpaceX API*

</div>
