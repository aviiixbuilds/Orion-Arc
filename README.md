<div align="center">

# 🛸 ORION ARC

### Track real-world rocket launches on an interactive 3D globe

[![Status](https://img.shields.io/badge/status-in%20development-orange?style=flat-square)](#)
[![API](https://img.shields.io/badge/API-SpaceX-blue?style=flat-square)](https://api.spacexdata.com/v4/)
[![Tech](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20Three.js-black?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)

<br/>

> *Most space apps treat launches as rows in a database.*
> *Orion Arc treats them as events on a planet.*

</div>

---

## 🌌 What is Orion Arc?

**Orion Arc** is an immersive, ops-style space launch dashboard that tracks real-world rocket launches across every major space agency — SpaceX, NASA, ESA, ISRO, Blue Origin, Roscosmos, and more.

While most trackers give you a boring list, Orion Arc renders launches on an **interactive 3D globe** powered by Three.js and WebGL. Every launch site is a pin on Earth. Select a mission — a trajectory arc animates from the launchpad toward orbit. A live countdown ticks toward the next launch. The whole interface is designed to feel like an actual operations center, not a college assignment.

---

## 💡 Core Idea and Vision

Most space apps treat launches as rows in a database. Orion Arc treats them as **events on a planet**.

The central idea is simple: if you want to understand the scale and geography of humanity's reach into space, a list tells you nothing. A globe tells you everything. Seeing that most launches happen from a handful of coastal sites, that trajectory arcs fan out in predictable orbital directions, that some launch sites have fired hundreds of missions while others have fired one that's the kind of insight that only emerges when data is given a physical form.

The vision for Orion Arc is to be the dashboard that makes space feel **visceral and present**, not archived and academic. Every design decision flows from that dark UI because space is dark, live countdowns because launches are events not records, trajectory arcs because rockets don't go straight up they arc across the sky.

Longer term, Orion Arc is the kind of tool that could sit in a real ops room. The aesthetic isn't decoration — it's the product.

---

## ⚡ Features

### 🔵 Core Features

| Feature | Description |
|---|---|
| 🌍 **3D Earth** | Interactive Three.js globe with launch site pins, trajectory arc animations, and atmospheric glow |
| 🔍 **Live Search** | Debounced search across mission names, rockets, and agencies |
| 🎯 **Filter** | Filter by agency (SpaceX / NASA / ESA / others) and launch status (success / failed / upcoming) |
| 📊 **Sort** | Sort by launch date (newest or oldest) or payload mass |
| ❤️ **Mission Favorites** | Save missions to a personal watchlist, persisted via localStorage |
| ⏱️ **Live Countdown** | Real-time T-minus timer ticking toward the next upcoming launch |
| 🌙 **Dark / Light Mode** | Full theme toggle — dark by default |
| 📋 **Mission Detail Panel** | Click any launch to see full mission info — rocket, payload, crew, orbit type, and outcome |
| 📅 **Launch Timeline** | Chronological visual timeline of all launches — scroll through history year by year |

### 🟡 Bonus Features

| Feature | Description |
|---|---|
| ⌨️ **Debounced Search** | Search fires only after user stops typing — no redundant API calls |
| 💀 **Loading Skeletons** | Placeholder cards animate while data is fetching |
| 💾 **localStorage Persistence** | Favorites and theme preference survive page reload |
| 📱 **Fully Responsive** | Adapts cleanly across mobile, tablet, and desktop |
| 📄 **Pagination** | Launch feed split into pages — fast load, easy navigation |
| 🚀 **Agency Stats Panel** | Live-computed stats per agency — total launches, success rate, most used rocket |
| 🔁 **Random Mission** | "Surprise me" button that loads a random mission from the dataset |
| 🗺️ **Launch Site Info** | Click a globe pin to see launchpad name, location, and total launches fired from that site |
| 📈 **Launch Frequency Chart** | Bar chart showing number of launches per year — built using canvas or SVG, no libraries |
| 🌐 **Orbit Type Filter** | Filter missions by target orbit — LEO, GEO, ISS, Polar, SSO |

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **HTML** | App structure and markup |
| **CSS** | Styling, animations, and responsive layout |
| **JavaScript** | Core logic, HOFs, DOM manipulation, API calls |
| **DOM API** | Dynamic UI rendering and all user interactions |
| **Fetch API** | All HTTP calls to the SpaceX API — no libraries |
| **Three.js** | WebGL-powered 3D globe, pins, and trajectory arcs |

---

## 📡 APIs

### SpaceX API
```
Base URL : https://api.spacexdata.com/v4/
Auth     : None — no API key required
```

### Launch Library 2 API
```
Base URL: https://ll.thespacedevs.com/2.2.0/
Auth: None — free tier, 15 requests/hour
```

| Endpoint | Used for |
|---|---|
| `GET /launches` | All launch data — name, date, success status, rocket ID |
| `GET /rockets` | Rocket specs and family info |
| `GET /launchpads` | Launch site coordinates → globe pin placement |
| `GET /crew` | Astronaut data for crewed missions |
| `GET /payloads` | Payload mass and target orbit type |
| `GET /launch/upcoming/` | Upcoming launches from all agencies |
| `GET /launch/previous/` | Past launches from all agencies |
| `GET /agencies/` | All space agency metadata |


---

## 🚀 Getting Started

> Deployment method may change as the project develops. This covers local setup for now.

```bash
git clone https://github.com/aviiixbuilds/orion-arc.git
cd orion-arc
```

Open `index.html` in your browser — no build step, no installs, no environment variables needed.

---

## 🎨 Design Notes

**Dark by default.** Space is dark — the UI reflects its subject matter.

**Color as data.** Launch status communicates through color at a glance — teal for success, amber for upcoming, red for failure. No need to read a label.

**The globe is the navigation.** Most dashboards go list → detail. In Orion Arc, you navigate by interacting with a 3D Earth. The launch site is where the story starts.

**Ops aesthetic.** Monospace fonts for telemetry readouts, thin borders, status badges, countdown timers. Built to feel like a real operations center.

---

<div align="center">

*Orion Arc — built with HTML · CSS · JavaScript · Three.js*
*Data from the SpaceX API*

</div>
