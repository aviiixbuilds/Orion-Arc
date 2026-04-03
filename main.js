
// ── UTILITIES ──
const $ = id => document.getElementById(id);
const $$ = selector => document.querySelectorAll(selector);
const show = el => el?.classList.remove("hidden");
const hide = el => el?.classList.add("hidden");

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function timeFromNow(isoString) {
  if (!isoString) return "—";
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = then - now;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  let str;
  if (years > 0) str = `${years} year${years > 1 ? "s" : ""}`;
  else if (months > 0) str = `${months} month${months > 1 ? "s" : ""}`;
  else if (days > 0) str = `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0) str = `${hours} hour${hours > 1 ? "s" : ""}`;
  else str = `${mins} min${mins > 1 ? "s" : ""}`;
  return diff < 0 ? `${str} ago` : `in ${str}`;
}

function getYear(isoString) { return isoString ? new Date(isoString).getFullYear() : null; }

function getISTString() {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()) + " IST";
}

function getTMinus(isoString) {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: String(Math.floor(totalSeconds / 86400)).padStart(2, "0"),
    hours: String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}

function latLngToXYZ(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

function groupByYear(launches) {
  return launches.reduce((acc, launch) => {
    const year = getYear(launch.date);
    if (year) (acc[year] = acc[year] || []).push(launch);
    return acc;
  }, {});
}

function calcSuccessRate(launches) {
  const completed = launches.filter(l => l.success !== null && l.success !== undefined && !l.upcoming);
  if (completed.length === 0) return "—";
  return ((completed.filter(l => l.success === true).length / completed.length) * 100).toFixed(1) + "%";
}

function formatMass(kg) { return kg ? kg.toLocaleString() + " kg" : "—"; }

function getLaunchStatus(launch) {
  if (launch.upcoming) return "upcoming";
  return launch.success ? "success" : "failed";
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── DATA FETCHING ──
const BASE_URL = "https://api.spacexdata.com/v4";
async function fetchData(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function fetchAllData() {
  const [launches, rockets, launchpads, payloads] = await Promise.all([
    fetchData("/launches"), fetchData("/rockets"), fetchData("/launchpads"), fetchData("/payloads")
  ]);
  return { launches, rockets, launchpads, payloads };
}

function shapeLaunchData(launches, rockets, launchpads, payloads) {
  return launches.map(launch => {
    const rocket = rockets.find(r => r.id === launch.rocket) || {};
    const pad = launchpads.find(p => p.id === launch.launchpad) || {};
    const payload = payloads.find(p => p.id === launch.payloads?.[0]) || {};
    return {
      ...launch,
      date: launch.date_utc,
      rocketName: rocket.name || "Unknown",
      rocketType: rocket.type || "—",
      siteName: pad.name || "Unknown",
      siteFullName: pad.full_name || "—",
      siteLat: pad.latitude || null,
      siteLng: pad.longitude || null,
      siteRegion: pad.region || "—",
      siteLaunchAttempts: pad.launch_attempts || 0,
      siteLaunchSuccesses: pad.launch_successes || 0,
      payloadMass: payload.mass_kg || null,
      orbit: payload.orbit || "—",
      manufacturer: payload.manufacturers?.[0] || "—",
      nationality: payload.nationalities?.[0] || "—",
    };
  });
}

// ── RENDER LOGIC ──
function renderStats(launches) {
  const total = launches.length, upcoming = launches.filter(l => l.upcoming).length;
  const rate = calcSuccessRate(launches), rockets = [...new Set(launches.map(l => l.rocketName))].length;
  const agencies = [...new Set(launches.map(l => l.nationality).filter(Boolean))].length;
  $("stat-total").textContent = total.toLocaleString();
  $("stat-success").textContent = rate;
  $("stat-upcoming").textContent = upcoming;
  $("stat-agencies").textContent = agencies || "6+";
  $("stat-rockets").textContent = rockets;
}

function createLaunchCard(launch) {
  const status = getLaunchStatus(launch);
  const card = document.createElement("div");
  card.className = "launch-card";
  card.dataset.id = launch.id;
  const img = launch.links?.patch?.small || "";
  card.innerHTML = `
    <div class="card-top">
      <div class="card-patch">${img ? `<img src="${img}" loading="lazy" />` : `<img src="assets/logo.png" class="placeholder-patch" />`}</div>
      <button class="card-fav-btn" data-id="${launch.id}">♡</button>
    </div>
    <div class="card-body">
      <div class="card-header-row"><span class="card-flight">#${launch.flightNumber}</span><span class="badge badge-${status}">${status.toUpperCase()}</span></div>
      <h3 class="card-name">${launch.name}</h3>
      <div class="card-meta">
        <span class="card-meta-item">🚀 ${launch.rocketName}</span>
        <span class="card-meta-item">📍 ${launch.siteName}</span>
        <span class="card-meta-item">📅 ${formatDate(launch.date)}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="card-time">${timeFromNow(launch.date)}</span>
      <button class="card-view-btn" data-id="${launch.id}">VIEW →</button>
    </div>
  `;
  return card;
}

function renderLaunchCards(launches) {
  const grid = $("launches-grid"); grid.innerHTML = "";
  if (!launches.length) { show($("empty-state")); hide($("pagination")); return; }
  hide($("empty-state"));
  launches.forEach(l => grid.appendChild(createLaunchCard(l)));
  $("launch-count").textContent = `${launches.length} mission${launches.length !== 1 ? "s" : ""}`;
}

function renderPagination(currentPage, totalPages) {
    const container = $("page-numbers"); container.innerHTML = "";
    if (totalPages <= 1) { hide($("pagination")); return; }
    show($("pagination"));
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) {
        const btn = document.createElement("button");
        btn.className = `page-num${i === currentPage ? " active" : ""}`;
        btn.textContent = i; btn.dataset.page = i;
        container.appendChild(btn);
    }
}

function renderAgencies(launches) {
  const grid = $("agencies-grid"); grid.innerHTML = "";
  const rocketNames = [...new Set(launches.map(l => l.rocketName))];
  rocketNames.forEach(name => {
    const group = launches.filter(l => l.rocketName === name);
    const total = group.length;
    const rate = total > 0 ? ((group.filter(l => l.success === true).length / group.filter(l => !l.upcoming).length) * 100).toFixed(0) : "—";
    const card = document.createElement("div");
    card.className = "agency-card";
    card.innerHTML = `
      <div class="agency-name">${name}</div>
      <div class="agency-stats">
        <div class="agency-stat"><span class="agency-stat-val">${total}</span><span class="agency-stat-label">LAUNCHES</span></div>
        <div class="agency-stat"><span class="agency-stat-val">${rate}%</span><span class="agency-stat-label">SUCCESS</span></div>
      </div>
      <div class="agency-bar-wrap"><div class="agency-bar" style="width: ${rate}%"></div></div>
    `;
    grid.appendChild(card);
  });
}

function renderTimeline(launches) {
  const container = $("timeline-chart"); container.innerHTML = "";
  const byYear = groupByYear(launches), years = Object.keys(byYear).sort();
  if (!years.length) return;
  const maxCount = Math.max(...years.map(y => byYear[y].length));
  years.forEach((year) => {
    const count = byYear[year].length, heightPercent = (count / maxCount) * 80;
    const wrap = document.createElement("div"); wrap.className = "neon-bar-wrap";
    wrap.innerHTML = `
      <div class="neon-bar-val">0</div>
      <div class="neon-bar-3d" data-target-height-percent="${heightPercent}" data-target-count="${count}">
        <div class="face front"></div><div class="face right"></div><div class="face top"></div>
      </div>
      <div class="neon-bar-year">${year}</div>
    `;
    container.appendChild(wrap);
  });
}

// ── STATE MANAGEMENT ──
const state = { allLaunches: [], filteredLaunches: [], currentPage: 1, perPage: 12, selectedLaunch: null };

function getSavedIds() { return JSON.parse(localStorage.getItem("orion-favorites") || "[]"); }
function toggleFavorite(id) {
  let saved = getSavedIds(), index = saved.indexOf(id);
  if (index > -1) saved.splice(index, 1); else saved.push(id);
  localStorage.setItem("orion-favorites", JSON.stringify(saved));
  return index === -1;
}

function renderFavs() {
    const grid = $("favorites-grid"), saved = getSavedIds(); grid.innerHTML = "";
    if (!saved.length) { show($("fav-empty-state")); $("fav-count").textContent = "0 saved"; return; }
    hide($("fav-empty-state")); $("fav-count").textContent = `${saved.length} saved`;
    state.allLaunches.filter(l => saved.includes(l.id)).forEach(l => grid.appendChild(createLaunchCard(l)));
}

function updateFavButtons(id, isSaved) {
    $$(`.card-fav-btn[data-id="${id}"]`).forEach(btn => {
        btn.textContent = isSaved ? "♥" : "♡"; btn.classList.toggle("saved", isSaved);
    });
}

// ── INITIALIZATION ──
async function init() {
    // ── INITIALIZATION ──
    try {
      console.log('Orion Arc: Initializing...');
      const data = await fetchAllData();
      const shaped = shapeLaunchData(data.launches, data.rockets, data.launchpads, data.payloads);
      shaped.sort((a, b) => new Date(b.date) - new Date(a.date));
      state.allLaunches = state.filteredLaunches = shaped;

      $$(".skeleton-card").forEach(s => s.remove());
      renderStats(shaped); renderAgencies(shaped); renderTimeline(shaped); renderFavs();
      initOrbitalVisualiser(shaped); populateAgencyFilter(shaped); renderPage(1);
      initFilters(state, renderPage); initInteractiveText(); initScrollHero();
      initScrollSpy(); initIntersectionObserver();
      
      const globeContainer = $("globe-canvas-container");
      if (globeContainer) {
          initGlobe(globeContainer, (pad) => { 
              const launch = state.allLaunches.find(l => l.siteName === pad.siteName);
              if (launch) renderModal(launch);
          });
      }


      setStatusLive();
      startClock();
      console.log('Orion Arc: Ready');
    } catch (err) {
      console.error('Initialization Failed:', err);
      setStatusError();
    }
}

function startClock() {
  setInterval(() => { if($("nav-clock")) $("nav-clock").textContent = getISTString(); }, 1000);
}

function renderModal(launch) {
  const status = getLaunchStatus(launch);
  $("modal-badge").textContent = status.toUpperCase();
  $("modal-badge").className = `modal-badge badge badge-${status}`;
  $("modal-mission-name").textContent = launch.name;
  $("modal-rocket").textContent = launch.rocketName;
  $("modal-date").textContent = formatDate(launch.date);
  $("modal-site").textContent = launch.siteFullName;
  $("modal-orbit").textContent = launch.orbit;
  $("modal-mass").textContent = formatMass(launch.payloadMass);
  $("modal-flight").textContent = `#${launch.flightNumber}`;

  const wiki = $("modal-wiki-link");
  if (launch.links?.wikipedia) { wiki.href = launch.links.wikipedia; show(wiki); } else hide(wiki);

  const favBtn = $("modal-fav-btn");
  favBtn.textContent = getSavedIds().includes(launch.id) ? "♥ SAVED" : "♡ SAVE MISSION";
  favBtn.dataset.id = launch.id;

  const details = $("modal-details");
  details.innerHTML = (launch.details ? `<p class="modal-description">${launch.details}</p>` : "") +
    (launch.links?.article ? `<a href="${launch.links.article}" target="_blank" class="modal-link">READ ARTICLE →</a>` : "") +
    (launch.links?.webcast ? `<a href="${launch.links.webcast}" target="_blank" class="modal-link">WATCH WEBCAST →</a>` : "");

  show($("modal-overlay"));
}

function renderPage(page) {
    state.currentPage = page;
    const slice = state.filteredLaunches.slice((page-1)*state.perPage, page*state.perPage);
    renderLaunchCards(slice);
    renderPagination(page, Math.ceil(state.filteredLaunches.length / state.perPage));
    $$(".launch-card").forEach((c, i) => setTimeout(() => c.classList.add("visible"), i * 50));
    if (page > 1) $("launches").scrollIntoView({ behavior: "smooth" });
}

// ── CUSTOM VISUALS ──
function initInteractiveText() {
    const container = $("reveal-text"); if (!container) return;
    const text = "ORION ARC";
    container.innerHTML = text.split('').map((char, i) => char === ' ' ? '<span style="display:inline-block; width:0.3em;">&nbsp;</span>' : `
        <span class="letter-wrap" data-index="${i}">
            <span class="letter-base">${char}</span>
            <span class="letter-overlay">${char}</span>
        </span>`).join('');
    $$(".letter-wrap").forEach((l, i) => setTimeout(() => l.classList.add('spring-in'), i * 80));
}

function initScrollHero() {
    const video = $("hero-video"), section = $("hero-scroll"); if (!video || !section) return;
    window.addEventListener('scroll', () => {
        const progress = Math.max(0, Math.min(1, (window.scrollY - section.offsetTop) / (section.offsetHeight - window.innerHeight)));
        requestAnimationFrame(() => {
            if (video.duration) video.currentTime = progress * video.duration;
            const text = document.querySelector('.reveal-text-container');
            if (text) {
                text.style.transform = `scale(${1 + progress * 0.45})`;
                text.style.opacity = 1 - Math.max(0, progress - 0.25) * 1.5;
            }
        });
    });
}

function initIntersectionObserver() {
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
    }), { threshold: 0.1 });
    $$(".section-title, .agency-card").forEach(el => observer.observe(el));

    const tlObserver = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) {
            const wraps = $$(".neon-bar-wrap");
            let start = null;
            function run(now) {
                if (!start) start = now;
                const p = Math.min((now - start) / 2500, 1);
                const ease = 1 - Math.pow(1 - p, 4);
                wraps.forEach(w => {
                    const bar = w.querySelector(".neon-bar-3d"), val = w.querySelector(".neon-bar-val");
                    bar.style.height = `${bar.dataset.targetHeightPercent * ease}%`;
                    val.textContent = Math.floor(bar.dataset.targetCount * ease);
                    val.style.opacity = Math.min(p * 2, 1);
                });
                if (p < 1) requestAnimationFrame(run);
            }
            requestAnimationFrame(run);
            tlObserver.unobserve(e.target);
        }
    }), { threshold: 0.4 });
    if ($("timeline")) tlObserver.observe($("timeline"));
}

// ── GLOBE (Three.js) ──
let globeScene, globeCamera, globeRenderer, globeEarth, globeAtmosphere, globePins = [], globeRaycaster = new THREE.Raycaster(), globeMouse = new THREE.Vector2();

function initGlobe(container, onClick) {
    if (!container || !window.THREE) return;
    globeScene = new THREE.Scene();
    globeCamera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 1000);
    globeCamera.position.z = 14;
    globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    globeRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(globeRenderer.domElement);
    globeScene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(5,3,5); globeScene.add(sun);
    
    const geo = new THREE.SphereGeometry(5, 64, 64);
    const texture = new THREE.TextureLoader().load("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
    globeEarth = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: texture })); globeScene.add(globeEarth);

    const atmosphereGeo = new THREE.SphereGeometry(5.2, 64, 64);
    globeAtmosphere = new THREE.Mesh(atmosphereGeo, new THREE.MeshPhongMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.1 })); globeScene.add(globeAtmosphere);

    function loop() { requestAnimationFrame(loop); globeEarth.rotation.y += 0.001; globeAtmosphere.rotation.y += 0.001; globeRenderer.render(globeScene, globeCamera); }
    loop();
}


// ── REMAINING LOGIC ──
function filterBySearch(launches, query) {
  if (!query) return launches;
  const q = query.toLowerCase().trim();
  return launches.filter(l => l.name.toLowerCase().includes(q) || l.rocketName.toLowerCase().includes(q) || l.siteName.toLowerCase().includes(q));
}

function filterByAgency(launches, agency) {
  return (!agency || agency === "all") ? launches : launches.filter(l => l.rocketName === agency);
}

function filterByStatus(launches, status) {
  if (!status || status === "all") return launches;
  if (status === "upcoming") return launches.filter(l => l.upcoming === true);
  if (status === "success") return launches.filter(l => l.success === true && !l.upcoming);
  if (status === "failed") return launches.filter(l => l.success === false && !l.upcoming);
  return launches;
}

function filterByOrbit(launches, orbit) {
  return (!orbit || orbit === "all") ? launches : launches.filter(l => l.orbit === orbit);
}

function sortLaunches(launches, sortVal) {
  const arr = [...launches];
  if (sortVal === "date-asc") return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortVal === "name-asc") return arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function applyFilters() {
  const query = $("search-input")?.value || "";
  const agency = $("filter-agency")?.value || "all";
  const status = $("filter-status")?.value || "all";
  const orbit = $("filter-orbit")?.value || "all";
  const sort = $("sort-select")?.value || "date-desc";

  let result = state.allLaunches;
  result = filterBySearch(result, query);
  result = filterByAgency(result, agency);
  result = filterByStatus(result, status);
  result = filterByOrbit(result, orbit);
  state.filteredLaunches = sortLaunches(result, sort);
  renderPage(1);
}

function initFilters(state, renderPage) {
    const run = debounce(applyFilters);
    $("search-input")?.addEventListener("input", run);
    $("filter-agency")?.addEventListener("change", applyFilters);
    $("filter-status")?.addEventListener("change", applyFilters);
    $("filter-orbit")?.addEventListener("change", applyFilters);
    $("sort-select")?.addEventListener("change", applyFilters);
}

function setStatusLive() { if($("status-dot")) $("status-dot").classList.add("live"); if($("status-label")) $("status-label").textContent = "LIVE DATA"; }
function setStatusError() { if($("status-dot")) $("status-dot").classList.add("error"); if($("status-label")) $("status-label").textContent = "API ERROR"; }

document.addEventListener("DOMContentLoaded", () => {
    init();
    $("launches-grid").onclick = $("favorites-grid").onclick = e => {
        const id = e.target.closest("[data-id]")?.dataset.id;
        if (e.target.closest(".card-fav-btn")) { toggleFavorite(id); updateFavButtons(id, getSavedIds().includes(id)); renderFavs(); }
        else if (id) renderModal(state.allLaunches.find(l => l.id === id));
    };
    $("modal-close").onclick = $("modal-overlay").onclick = (e) => { if(e.target === $("modal-overlay") || e.target === $("modal-close")) hide($("modal-overlay")); };
    $("theme-toggle").onclick = () => {
        const next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.body.setAttribute("data-theme", next); localStorage.setItem("orion-theme", next);
    };
});

function initOrbitalVisualiser(launches) {
    const canvas = $("orbital-canvas"), ctx = canvas.getContext('2d');
    if (!canvas) return;
    let idx = 0, auto = true, timer = null;
    const missions = launches.filter(l => l.orbit !== "—").slice(0, 50);

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr); ctx.lineWidth = 1;
    }
    window.addEventListener('resize', resize); resize();

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
        const maxR = Math.min(cx, cy) * 0.85;

        // Bands
        const bands = [
            { r: 0.15, c: "rgba(79, 195, 247, 0.15)", name: "LEO" },
            { r: 0.35, c: "rgba(129, 199, 132, 0.12)", name: "ISS" },
            { r: 0.60, c: "rgba(255, 183, 77, 0.1)", name: "SSO" },
            { r: 0.85, c: "rgba(206, 147, 216, 0.08)", name: "GEO" }
        ];

        bands.forEach(b => {
           ctx.strokeStyle = b.c; ctx.beginPath(); ctx.arc(cx, cy, maxR * b.r, 0, Math.PI*2); ctx.stroke();
        });

        // Earth
        ctx.fillStyle = "#0d1a2e"; ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.08, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "rgba(79, 195, 247, 0.4)"; ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.08, 0, Math.PI*2); ctx.stroke();

        // Missions
        missions.forEach((m, i) => {
            const angle = (i * 0.4) + (performance.now() * 0.0001 * (i % 2 ? 1 : -1));
            const band = bands.find(b => b.name === m.orbit) || bands[3];
            const dist = maxR * band.r;
            const x = cx + Math.cos(angle) * dist, y = cy + Math.sin(angle) * dist;

            ctx.fillStyle = i === idx ? "#4fc3f7" : "rgba(255,255,255,0.2)";
            ctx.beginPath(); ctx.arc(x, y, i === idx ? 4 : 2, 0, Math.PI*2); ctx.fill();
            if(i === idx) {
                ctx.strokeStyle = "#4fc3f7"; ctx.beginPath(); ctx.arc(x, y, 8 + Math.sin(performance.now()*0.01)*2, 0, Math.PI*2); ctx.stroke();
            }
        });

        if(missions[idx]) updateOrbitalUI(missions[idx], idx + 1, missions.length);
        requestAnimationFrame(draw);
    }
    
    $("orbital-next").onclick = () => { auto = false; idx = (idx + 1) % missions.length; };
    $("orbital-prev").onclick = () => { auto = false; idx = (idx - 1 + missions.length) % missions.length; };
    $("orbital-auto").onclick = () => { auto = !auto; $("orbital-auto").textContent = auto ? "⏸ PAUSE" : "▶ PLAY"; };

    setInterval(() => { if(auto) idx = (idx + 1) % missions.length; }, 4000);
    draw();
}

function updateOrbitalUI(m, count, total) {
    if(!m) return;
    $("orbital-mission-name").textContent = m.name;
    $("orbital-rocket").textContent = m.rocketName;
    $("orbital-site").textContent = m.siteName;
    $("orbital-orbit").textContent = m.orbit;
    $("orbital-date").textContent = formatDate(m.date);
    $("orbital-status").textContent = getLaunchStatus(m).toUpperCase();
    $("orbital-status").className = `orbital-meta-val badge-${getLaunchStatus(m)}`;
    $("orbital-idx").textContent = count;
    $("orbital-total").textContent = total;
}

function populateAgencyFilter(launches) {
  const select = $("filter-agency"); if(!select) return;
  [...new Set(launches.map(l => l.rocketName))].sort().forEach(name => {
    const opt = document.createElement("option"); opt.value = name; opt.textContent = name; select.appendChild(opt);
  });
}

function initScrollSpy() {
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) {
        $$(".nav-link").forEach(l => l.classList.remove("active"));
        const active = document.querySelector(`.nav-link[data-section="${e.target.id}"]`);
        if (active) active.classList.add("active");
    }
  }), { threshold: 0.3 });
  ["globe", "launches", "agencies", "favorites"].forEach(id => { if($(id)) observer.observe($(id)); });
}
