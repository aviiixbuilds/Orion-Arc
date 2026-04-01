
// --- src: js/utils.js ---
// utils.js — helper functions used across the whole app

// ── DATE & TIME ──

// formats ISO date string into readable format
// e.g. "2024-03-15T10:30:00Z" -> "15 MAR 2024"
function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
}

// returns how long ago a launch was, or how far away it is
// e.g. "3 years ago" or "in 4 days"
function timeFromNow(isoString) {
  if (!isoString) return "—";
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = then - now; // positive = future, negative = past
  const abs = Math.abs(diff);

  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let str;
  if (years > 0)        str = `${years} year${years > 1 ? "s" : ""}`;
  else if (months > 0)  str = `${months} month${months > 1 ? "s" : ""}`;
  else if (days > 0)    str = `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0)   str = `${hours} hour${hours > 1 ? "s" : ""}`;
  else                  str = `${mins} min${mins > 1 ? "s" : ""}`;

  return diff < 0 ? `${str} ago` : `in ${str}`;
}

// extracts just the year from an ISO string
function getYear(isoString) {
  if (!isoString) return null;
  return new Date(isoString).getFullYear();
}

// get current UTC time as HH:MM:SS string
function getUTCTimeString() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s} UTC`;
}

// calculates T-minus breakdown from a future ISO date
// returns { days, hours, minutes, seconds } or null if date is in the past
function getTMinus(isoString) {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days:    String(days).padStart(2, "0"),
    hours:   String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

// ── GEO / 3D MATH ──

// converts lat/lng to x,y,z position on a sphere
// used by globe.js to place launch site pins
// radius should match whatever sphere radius Three.js uses
function latLngToXYZ(lat, lng, radius) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y =   radius * Math.cos(phi);
  const z =   radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

// ── DATA HELPERS ──

// groups an array of launches by year
// returns an object like { 2020: [...], 2021: [...], ... }
function groupByYear(launches) {
  return launches.reduce((acc, launch) => {
    const year = getYear(launch.date);
    if (!year) return acc;
    if (!acc[year]) acc[year] = [];
    acc[year].push(launch);
    return acc;
  }, {});
}

// gets unique agencies from shaped launch data
function getUniqueAgencies(launches) {
  const names = launches.map(l => l.rocketName);
  return [...new Set(names)].sort();
}

// success rate as a percentage string e.g. "94.2%"
function calcSuccessRate(launches) {
  const completed = launches.filter(l => l.success !== null && l.success !== undefined && !l.upcoming);
  if (completed.length === 0) return "—";
  const successes = completed.filter(l => l.success === true).length;
  return ((successes / completed.length) * 100).toFixed(1) + "%";
}

// formats payload mass nicely
// e.g. 12500 -> "12,500 kg"
function formatMass(kg) {
  if (!kg) return "—";
  return kg.toLocaleString() + " kg";
}

// figures out status string from a launch object
function getLaunchStatus(launch) {
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  if (launch.success === false) return "failed";
  return "unknown";
}

// ── DOM HELPERS ──

// shorthand so i dont type document.getElementById everywhere
function $(id) {
  return document.getElementById(id);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

// show/hide element by toggling the hidden class
function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

// debounce — delays function call until user stops triggering it
// used on the search input
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}



// --- src: js/api.js ---
// api.js — all fetch calls live here, nothing else

const BASE_URL = "https://api.spacexdata.com/v4";

// just a wrapper so i dont repeat try/catch everywhere
async function fetchData(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status} on ${endpoint}`);
  return res.json();
}

// get all launches — past + upcoming combined
async function getAllLaunches() {
  const data = await fetchData("/launches");
  return data;
}

// upcoming only
async function getUpcomingLaunches() {
  const data = await fetchData("/launches/upcoming");
  return data;
}

// single launch by id
async function getLaunchById(id) {
  const data = await fetchData(`/launches/${id}`);
  return data;
}

// all rockets
async function getRockets() {
  const data = await fetchData("/rockets");
  return data;
}

// all launchpads — we need coordinates for the globe
async function getLaunchpads() {
  const data = await fetchData("/launchpads");
  return data;
}

// crew members
async function getCrew() {
  const data = await fetchData("/crew");
  return data;
}

// payloads — for orbit type and mass
async function getPayloads() {
  const data = await fetchData("/payloads");
  return data;
}

// this is the big one — fetches everything in parallel
// so we dont make 6 sequential requests and waste time
async function fetchAllData() {
  const [launches, rockets, launchpads, payloads] = await Promise.all([
    getAllLaunches(),
    getRockets(),
    getLaunchpads(),
    getPayloads(),
  ]);

  return { launches, rockets, launchpads, payloads };
}

// shapes raw launch data into something cleaner to work with
// merges rocket name, launchpad coords, payload info into each launch object
function shapeLaunchData(launches, rockets, launchpads, payloads) {
  return launches.map(launch => {
    const rocket = rockets.find(r => r.id === launch.rocket) || {};
    const pad = launchpads.find(p => p.id === launch.launchpad) || {};

    // a launch can have multiple payloads, just grab first one for now
    const payloadId = launch.payloads?.[0];
    const payload = payloads.find(p => p.id === payloadId) || {};

    return {
      id: launch.id,
      name: launch.name,
      date: launch.date_utc,
      upcoming: launch.upcoming,
      success: launch.success,
      details: launch.details,
      flightNumber: launch.flight_number,
      links: launch.links,

      // rocket info
      rocketName: rocket.name || "Unknown",
      rocketType: rocket.type || "—",

      // launchpad info
      siteName: pad.name || "Unknown",
      siteFullName: pad.full_name || "—",
      siteLat: pad.latitude || null,
      siteLng: pad.longitude || null,
      siteRegion: pad.region || "—",
      siteLaunchAttempts: pad.launch_attempts || 0,
      siteLaunchSuccesses: pad.launch_successes || 0,

      // payload info
      payloadMass: payload.mass_kg || null,
      orbit: payload.orbit || "—",
      manufacturer: payload.manufacturers?.[0] || "—",
      nationality: payload.nationalities?.[0] || "—",

      // crew
      crewIds: launch.crew || [],
    };
  });
}



// --- src: js/render.js ---
// render.js — takes data, puts it on the screen



// ── STATS BAR ──

function renderStats(launches) {
  const total    = launches.length;
  const upcoming = launches.filter(l => l.upcoming).length;
  const rate     = calcSuccessRate(launches);
  const rockets  = [...new Set(launches.map(l => l.rocketName))].length;

  // count unique agencies by nationality — rough but works
  const agencies = [...new Set(launches.map(l => l.nationality).filter(Boolean))].length;

  $("stat-total").textContent    = total.toLocaleString();
  $("stat-success").textContent  = rate;
  $("stat-upcoming").textContent = upcoming;
  $("stat-agencies").textContent = agencies || "6+";
  $("stat-rockets").textContent  = rockets;
}

// ── HERO SECTION ──

function renderHero(launch) {
  if (!launch) return;

  $("hero-mission-name").textContent = launch.name;
  $("hero-agency").textContent       = launch.rocketName;
  $("hero-rocket").textContent       = launch.rocketType || "—";
  $("hero-site").textContent         = launch.siteName;
}

// ── LAUNCH CARDS ──

function createLaunchCard(launch) {
  const status = getLaunchStatus(launch);
  const card   = document.createElement("div");
  card.className = "launch-card";
  card.dataset.id = launch.id;

  // patch image — spacex provides mission images
  const img = launch.links?.patch?.small || "";

  card.innerHTML = `
    <div class="card-top">
      <div class="card-patch">
        ${img
          ? `<img src="${img}" alt="${launch.name} patch" loading="lazy" />`
          : `<img src="assets/logo.png" alt="Placeholder patch" loading="lazy" class="placeholder-patch" />`
        }
      </div>
      <button class="card-fav-btn" data-id="${launch.id}" aria-label="Save mission">♡</button>
    </div>

    <div class="card-body">
      <div class="card-header-row">
        <span class="card-flight">#${launch.flightNumber}</span>
        <span class="badge badge-${status}">${status.toUpperCase()}</span>
      </div>

      <h3 class="card-name">${launch.name}</h3>

      <div class="card-meta">
        <span class="card-meta-item">
          <span class="meta-icon">⚡</span> ${launch.rocketName}
        </span>
        <span class="card-meta-item">
          <span class="meta-icon">📍</span> ${launch.siteName}
        </span>
        <span class="card-meta-item">
          <span class="meta-icon">🗓</span> ${formatDate(launch.date)}
        </span>
        ${launch.orbit !== "—" ? `
        <span class="card-meta-item">
          <span class="meta-icon">🛸</span> ${launch.orbit}
        </span>` : ""}
      </div>

      ${launch.details ? `
      <p class="card-details">${launch.details.slice(0, 100)}${launch.details.length > 100 ? "..." : ""}</p>
      ` : ""}
    </div>

    <div class="card-footer">
      <span class="card-time">${timeFromNow(launch.date)}</span>
      <button class="card-view-btn" data-id="${launch.id}">VIEW →</button>
    </div>
  `;

  return card;
}

function renderLaunchCards(launches) {
  const grid = $("launches-grid");
  grid.innerHTML = "";

  if (launches.length === 0) {
    show($("empty-state"));
    hide($("pagination"));
    return;
  }

  hide($("empty-state"));

  launches.forEach(launch => {
    const card = createLaunchCard(launch);
    grid.appendChild(card);
  });

  // update count label
  $("launch-count").textContent = `${launches.length} mission${launches.length !== 1 ? "s" : ""}`;
}

// clears skeletons and replaces with real cards
function clearSkeletons() {
  const skeletons = document.querySelectorAll(".skeleton-card");
  skeletons.forEach(s => s.remove());
}

// ── PAGINATION ──

function renderPagination(currentPage, totalPages) {
  const container = $("page-numbers");
  container.innerHTML = "";

  if (totalPages <= 1) {
    hide($("pagination"));
    return;
  }

  show($("pagination"));

  // show max 5 page numbers at a time
  let start = Math.max(1, currentPage - 2);
  let end   = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.className = `page-num${i === currentPage ? " active" : ""}`;
    btn.textContent = i;
    btn.dataset.page = i;
    container.appendChild(btn);
  }

  $("page-prev").disabled = currentPage === 1;
  $("page-next").disabled = currentPage === totalPages;
}

// ── MISSION MODAL ──

function renderModal(launch) {
  const status = getLaunchStatus(launch);

  $("modal-badge").textContent        = status.toUpperCase();
  $("modal-badge").className          = `modal-badge badge badge-${status}`;
  $("modal-mission-name").textContent = launch.name;
  $("modal-rocket").textContent       = launch.rocketName;
  $("modal-date").textContent         = formatDate(launch.date);
  $("modal-site").textContent         = launch.siteFullName || launch.siteName;
  $("modal-orbit").textContent        = launch.orbit;
  $("modal-mass").textContent         = formatMass(launch.payloadMass);
  $("modal-flight").textContent       = `#${launch.flightNumber}`;

  // wikipedia link
  const wikiLink = $("modal-wiki-link");
  if (launch.links?.wikipedia) {
    wikiLink.href = launch.links.wikipedia;
    show(wikiLink);
  } else {
    hide(wikiLink);
  }

  // fav button state
  const saved = getSavedIds();
  const favBtn = $("modal-fav-btn");
  favBtn.textContent = saved.includes(launch.id) ? "♥ SAVED" : "♡ SAVE MISSION";
  favBtn.dataset.id  = launch.id;

  // extra details — crew, article, youtube
  const details = $("modal-details");
  details.innerHTML = "";

  if (launch.details) {
    const p = document.createElement("p");
    p.className = "modal-description";
    p.textContent = launch.details;
    details.appendChild(p);
  }

  if (launch.links?.article) {
    const a = document.createElement("a");
    a.href = launch.links.article;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "modal-link";
    a.textContent = "READ ARTICLE →";
    details.appendChild(a);
  }

  if (launch.links?.webcast) {
    const a = document.createElement("a");
    a.href = launch.links.webcast;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "modal-link";
    a.textContent = "WATCH WEBCAST →";
    details.appendChild(a);
  }

  show($("modal-overlay"));
}

function closeModal() {
  hide($("modal-overlay"));
}

// ── AGENCY CARDS ──

function renderAgencies(launches) {
  const grid = $("agencies-grid");
  grid.innerHTML = "";

  // group by rocket name as a proxy for agency
  const rocketNames = [...new Set(launches.map(l => l.rocketName))];

  rocketNames.forEach(name => {
    const group    = launches.filter(l => l.rocketName === name);
    const total    = group.length;
    const successes = group.filter(l => l.success === true).length;
    const rate     = total > 0 ? ((successes / group.filter(l => !l.upcoming).length) * 100).toFixed(0) : "—";

    const card = document.createElement("div");
    card.className = "agency-card";
    card.innerHTML = `
      <div class="agency-name">${name}</div>
      <div class="agency-stats">
        <div class="agency-stat">
          <span class="agency-stat-val">${total}</span>
          <span class="agency-stat-label">LAUNCHES</span>
        </div>
        <div class="agency-stat">
          <span class="agency-stat-val">${rate}%</span>
          <span class="agency-stat-label">SUCCESS</span>
        </div>
      </div>
      <div class="agency-bar-wrap">
        <div class="agency-bar" style="width: ${rate}%"></div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── TIMELINE CHART ──
// drawing a simple bar chart with SVG — no libraries

function renderTimeline(launches) {
  const container = $("timeline-chart");
  container.innerHTML = "";

  const byYear = groupByYear(launches);
  const years  = Object.keys(byYear).sort();

  if (years.length === 0) return;

  const maxCount = Math.max(...years.map(y => byYear[y].length));
  const barWidth = 32;
  const gap      = 12;
  const chartH   = 160;
  const labelH   = 24;
  const totalW   = years.length * (barWidth + gap);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${totalW} ${chartH + labelH}`);
  svg.setAttribute("width", "100%");
  svg.style.overflow = "visible";

  years.forEach((year, i) => {
    const count  = byYear[year].length;
    const barH   = Math.max(4, (count / maxCount) * chartH);
    const x      = i * (barWidth + gap);
    const y      = chartH - barH;

    // bar
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", barH);
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", "var(--text-accent)");
    rect.setAttribute("opacity", "0.7");
    svg.appendChild(rect);

    // count label on top of bar
    const countLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    countLabel.setAttribute("x", x + barWidth / 2);
    countLabel.setAttribute("y", y - 5);
    countLabel.setAttribute("text-anchor", "middle");
    countLabel.setAttribute("font-size", "9");
    countLabel.setAttribute("fill", "var(--text-muted)");
    countLabel.setAttribute("font-family", "Share Tech Mono, monospace");
    countLabel.textContent = count;
    svg.appendChild(countLabel);

    // year label below bar
    const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yearLabel.setAttribute("x", x + barWidth / 2);
    yearLabel.setAttribute("y", chartH + 16);
    yearLabel.setAttribute("text-anchor", "middle");
    yearLabel.setAttribute("font-size", "9");
    yearLabel.setAttribute("fill", "var(--text-muted)");
    yearLabel.setAttribute("font-family", "Share Tech Mono, monospace");
    yearLabel.textContent = year;
    svg.appendChild(yearLabel);
  });

  container.appendChild(svg);
}

// ── FAVORITES ──

function getSavedIds() {
  return JSON.parse(localStorage.getItem("orion-favorites") || "[]");
}

function saveFavorite(id) {
  const saved = getSavedIds();
  if (!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem("orion-favorites", JSON.stringify(saved));
  }
}

function removeFavorite(id) {
  const saved = getSavedIds().filter(s => s !== id);
  localStorage.setItem("orion-favorites", JSON.stringify(saved));
}

function toggleFavorite(id) {
  const saved = getSavedIds();
  if (saved.includes(id)) {
    removeFavorite(id);
    return false; // removed
  } else {
    saveFavorite(id);
    return true; // added
  }
}

function renderFavorites(allLaunches) {
  const grid  = $("favorites-grid");
  const saved = getSavedIds();

  grid.innerHTML = "";

  if (saved.length === 0) {
    show($("fav-empty-state"));
    $("fav-count").textContent = "0 saved";
    return;
  }

  hide($("fav-empty-state"));
  $("fav-count").textContent = `${saved.length} saved`;

  const favLaunches = allLaunches.filter(l => saved.includes(l.id));
  favLaunches.forEach(launch => {
    const card = createLaunchCard(launch);
    grid.appendChild(card);
  });
}

// updates fav button icon on a card after toggling
function updateFavButtons(id, isSaved) {
  document.querySelectorAll(`.card-fav-btn[data-id="${id}"]`).forEach(btn => {
    btn.textContent = isSaved ? "♥" : "♡";
    btn.classList.toggle("saved", isSaved);
  });
}

// ── STATUS DOT ──

function setStatusLive() {
  const dot   = $("status-dot");
  const label = $("status-label");
  dot.classList.add("live");
  dot.classList.remove("error");
  label.textContent = "LIVE DATA";
}

function setStatusError() {
  const dot   = $("status-dot");
  const label = $("status-label");
  dot.classList.add("error");
  dot.classList.remove("live");
  label.textContent = "API ERROR";
}



// --- src: js/filters.js ---
// filters.js — search, filter, sort — all using HOFs
// this is where .map .filter .sort .find .reduce all live



// ── FILTER LOGIC ──

// each function takes the full launches array and returns a filtered version
// they're kept separate so they can be chained cleanly in applyFilters()

function filterBySearch(launches, query) {
  if (!query || query.trim() === "") return launches;
  const q = query.toLowerCase().trim();
  return launches.filter(l =>
    l.name.toLowerCase().includes(q)       ||
    l.rocketName.toLowerCase().includes(q) ||
    l.siteName.toLowerCase().includes(q)   ||
    l.orbit?.toLowerCase().includes(q)     ||
    String(l.flightNumber).includes(q)
  );
}

function filterByAgency(launches, agency) {
  if (!agency || agency === "all") return launches;
  return launches.filter(l => l.rocketName === agency);
}

function filterByStatus(launches, status) {
  if (!status || status === "all") return launches;
  if (status === "upcoming") return launches.filter(l => l.upcoming === true);
  if (status === "success")  return launches.filter(l => l.success === true && !l.upcoming);
  if (status === "failed")   return launches.filter(l => l.success === false && !l.upcoming);
  return launches;
}

function filterByOrbit(launches, orbit) {
  if (!orbit || orbit === "all") return launches;
  return launches.filter(l => l.orbit === orbit);
}

// ── SORT LOGIC ──

function sortLaunches(launches, sortVal) {
  // spread to avoid mutating the original array
  const arr = [...launches];

  switch (sortVal) {
    case "date-desc":
      return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    case "date-asc":
      return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    case "mass-desc":
      return arr.sort((a, b) => (b.payloadMass || 0) - (a.payloadMass || 0));
    case "mass-asc":
      return arr.sort((a, b) => (a.payloadMass || 0) - (b.payloadMass || 0));
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return arr;
  }
}

// ── ACTIVE FILTERS DISPLAY ──

function renderActivePills(filters) {
  const container = $("active-filters");
  if (!container) return;
  container.innerHTML = "";

  const labels = {
    search: `"${filters.search}"`,
    agency: filters.agency,
    status: filters.status,
    orbit:  filters.orbit,
  };

  Object.entries(labels).forEach(([key, val]) => {
    if (!val || val === "all") return;

    const pill = document.createElement("div");
    pill.className = "filter-pill";
    pill.innerHTML = `
      <span>${val.toUpperCase()}</span>
      <span class="filter-pill-remove" data-key="${key}">✕</span>
    `;
    container.appendChild(pill);
  });
}

// ── APPLY ALL FILTERS ──
// chains all filter + sort functions together
// this runs every time any filter/sort/search changes

function applyFilters(state, renderPage) {
  const query  = $("search-input")?.value   || "";
  const agency = $("filter-agency")?.value  || "all";
  const status = $("filter-status")?.value  || "all";
  const orbit  = $("filter-orbit")?.value   || "all";
  const sort   = $("sort-select")?.value    || "date-desc";

  // chain all filters — each one takes the output of the previous
  let result = state.allLaunches;
  result = filterBySearch(result, query);
  result = filterByAgency(result, agency);
  result = filterByStatus(result, status);
  result = filterByOrbit(result, orbit);
  result = sortLaunches(result, sort);

  state.filteredLaunches = result;

  // update active filter pills
  renderActivePills({ search: query, agency, status, orbit });

  // go back to page 1 whenever filters change
  renderPage(1);
}

// ── INIT — called from main.js ──

function initFilters(state, renderPage) {
  // debounced search so it doesn't fire on every single keystroke
  const debouncedSearch = debounce(() => applyFilters(state, renderPage), 300);

  $("search-input")?.addEventListener("input", debouncedSearch);

  // clear button on search
  $("search-clear")?.addEventListener("click", () => {
    $("search-input").value = "";
    applyFilters(state, renderPage);
  });

  // dropdowns fire immediately — no debounce needed
  $("filter-agency")?.addEventListener("change", () => applyFilters(state, renderPage));
  $("filter-status")?.addEventListener("change", () => applyFilters(state, renderPage));
  $("filter-orbit")?.addEventListener("change",  () => applyFilters(state, renderPage));
  $("sort-select")?.addEventListener("change",   () => applyFilters(state, renderPage));

  // remove individual filter pills
  $("active-filters")?.addEventListener("click", e => {
    const btn = e.target.closest(".filter-pill-remove");
    if (!btn) return;

    const key = btn.dataset.key;
    if (key === "search") $("search-input").value  = "";
    if (key === "agency") $("filter-agency").value = "all";
    if (key === "status") $("filter-status").value = "all";
    if (key === "orbit")  $("filter-orbit").value  = "all";

    applyFilters(state, renderPage);
  });
}



// --- src: js/countdown.js ---
// countdown.js — live T-minus timer for next upcoming launch



let countdownInterval = null;

// call this with the launch date ISO string
function initCountdown(launchDateISO) {
  // clear any existing interval first
  if (countdownInterval) clearInterval(countdownInterval);

  const cdDays    = $("cd-days");
  const cdHours   = $("cd-hours");
  const cdMinutes = $("cd-minutes");
  const cdSeconds = $("cd-seconds");

  if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

  function tick() {
    const t = getTMinus(launchDateISO);

    if (!t) {
      // launch has passed
      cdDays.textContent    = "00";
      cdHours.textContent   = "00";
      cdMinutes.textContent = "00";
      cdSeconds.textContent = "00";
      clearInterval(countdownInterval);
      return;
    }

    // only animate the seconds tick when value changes
    const prevSec = cdSeconds.textContent;
    if (prevSec !== t.seconds) {
      cdSeconds.classList.remove("tick");
      // small timeout so removing and re-adding the class triggers the animation
      setTimeout(() => cdSeconds.classList.add("tick"), 10);
    }

    cdDays.textContent    = t.days;
    cdHours.textContent   = t.hours;
    cdMinutes.textContent = t.minutes;
    cdSeconds.textContent = t.seconds;
  }

  // run immediately so theres no 1s delay on load
  tick();
  countdownInterval = setInterval(tick, 1000);
}



// --- src: three/globe.js ---
// globe.js — three.js earth globe
// handles: sphere, atmosphere, launch pins, trajectory arcs, click detection



// three.js is loaded via CDN in index.html so it's on window.THREE
const THREE = window.THREE;

// ── GLOBE STATE ──
let scene, camera, renderer, earth, atmosphere;
let orbitControls = null;
let raycaster, mouse;
let pins       = [];
let arcs       = [];
let launchpads = [];
let onPinClick = null; // callback set from outside

const GLOBE_RADIUS = 5;

// ── INIT ──

function initGlobe(container, onClickCallback) {
  if (!THREE) {
    console.warn("three.js not loaded");
    return;
  }

  onPinClick = onClickCallback;

  // scene
  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 14);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0); // transparent bg
  container.appendChild(renderer.domElement);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  // earth
  buildEarth();

  // atmosphere glow
  buildAtmosphere();

  // stars background
  buildStars();

  // raycaster for click detection
  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2();

  // drag to rotate — manual implementation (no OrbitControls in r128 without import)
  initDragRotate(container);

  // click handler
  renderer.domElement.addEventListener("click", onCanvasClick);

  // resize
  window.addEventListener("resize", () => onResize(container));

  // start render loop
  animate();

  // hide the loader
  const loader = $("globe-loader");
  if (loader) loader.style.display = "none";
}

// ── EARTH SPHERE ──

function buildEarth() {
  const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

  // load earth texture — using a public domain nasa blue marble texture
  const loader  = new THREE.TextureLoader();
  const texture = loader.load(
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    () => { /* loaded */ },
    undefined,
    () => {
      // fallback if texture fails — dark blue sphere
      earth.material.color.set(0x1a3a5c);
    }
  );

  const mat = new THREE.MeshPhongMaterial({
    map:       texture,
    shininess: 8,
  });

  earth = new THREE.Mesh(geo, mat);
  scene.add(earth);
}

// ── ATMOSPHERE ──

function buildAtmosphere() {
  const geo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    color:       0x4fc3f7,
    transparent: true,
    opacity:     0.06,
    side:        THREE.FrontSide,
  });
  atmosphere = new THREE.Mesh(geo, mat);
  scene.add(atmosphere);
}

// ── STARS ──

function buildStars() {
  const geo = new THREE.BufferGeometry();
  const count = 2000;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 400;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size:  0.25,
    transparent: true,
    opacity: 0.7,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
}

// ── LAUNCH PINS ──

function addPin(lat, lng, data) {
  const pos = latLngToXYZ(lat, lng, GLOBE_RADIUS + 0.05);

  const geo = new THREE.SphereGeometry(0.06, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7 });
  const pin = new THREE.Mesh(geo, mat);

  pin.position.set(pos.x, pos.y, pos.z);
  pin.userData = data; // store launchpad data on the mesh for click detection

  scene.add(pin);
  pins.push(pin);

  return pin;
}

function addPins(launchpadData) {
  // clear existing pins first
  pins.forEach(p => scene.remove(p));
  pins = [];

  launchpadData.forEach(pad => {
    if (!pad.siteLat || !pad.siteLng) return;
    addPin(pad.siteLat, pad.siteLng, pad);
  });

  launchpads = launchpadData;
}

// ── TRAJECTORY ARC ──
// draws a curved line from launch site toward "orbit" (a point above the surface)

function addArc(lat, lng, color = 0x4fc3f7) {
  // clear previous arcs
  clearArcs();

  const startPos = latLngToXYZ(lat, lng, GLOBE_RADIUS + 0.05);

  // orbit endpoint — same lat, slightly different lng, higher altitude
  const endPos = latLngToXYZ(lat + 15, lng + 20, GLOBE_RADIUS * 1.8);

  // control point for the bezier curve — above the midpoint
  const midLat = (lat + lat + 15) / 2;
  const midLng = (lng + lng + 20) / 2;
  const ctrl   = latLngToXYZ(midLat, midLng, GLOBE_RADIUS * 2.2);

  const startVec = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
  const endVec   = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
  const ctrlVec  = new THREE.Vector3(ctrl.x, ctrl.y, ctrl.z);

  const curve  = new THREE.QuadraticBezierCurve3(startVec, ctrlVec, endVec);
  const points = curve.getPoints(60);

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color:       color,
    transparent: true,
    opacity:     0.8,
  });

  const arc = new THREE.Line(geo, mat);
  scene.add(arc);
  arcs.push(arc);

  // animate the arc drawing — reveal points progressively
  animateArc(arc, points);
}

function animateArc(arc, points) {
  let count = 0;
  const total = points.length;

  const interval = setInterval(() => {
    count = Math.min(count + 3, total);
    const visible = points.slice(0, count);
    arc.geometry.setFromPoints(visible);
    arc.geometry.attributes.position.needsUpdate = true;

    if (count >= total) clearInterval(interval);
  }, 16);
}

function clearArcs() {
  arcs.forEach(a => scene.remove(a));
  arcs = [];
}

// ── DRAG ROTATION ──
// simple mouse/touch drag to rotate globe

function initDragRotate(container) {
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let rotX  = 0;
  let rotY  = 0;

  container.addEventListener("mousedown", e => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    // clamp vertical rotation so it doesnt flip
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    earth.rotation.y      = rotY;
    earth.rotation.x      = rotX;
    atmosphere.rotation.y = rotY;
    atmosphere.rotation.x = rotX;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener("mouseup", () => { isDragging = false; });

  // touch support
  container.addEventListener("touchstart", e => {
    isDragging = true;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  });

  container.addEventListener("touchmove", e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevX;
    const dy = e.touches[0].clientY - prevY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    earth.rotation.y      = rotY;
    earth.rotation.x      = rotX;
    atmosphere.rotation.y = rotY;
    atmosphere.rotation.x = rotX;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  });

  container.addEventListener("touchend", () => { isDragging = false; });
}

// ── CLICK DETECTION ──

function onCanvasClick(e) {
  if (!raycaster || !pins.length) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(pins);
  if (hits.length > 0 && onPinClick) {
    const pad = hits[0].object.userData;
    onPinClick(pad);

    // highlight clicked pin
    pins.forEach(p => p.material.color.set(0x4fc3f7));
    hits[0].object.material.color.set(0xffab40);

    // draw arc from this site
    if (pad.siteLat && pad.siteLng) {
      addArc(pad.siteLat, pad.siteLng);
    }
  }
}

// ── RESIZE ──

function onResize(container) {
  if (!camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// ── RENDER LOOP ──

function animate() {
  requestAnimationFrame(animate);

  // slow auto-rotate when not dragging
  if (earth) earth.rotation.y += 0.0008;
  if (atmosphere) atmosphere.rotation.y += 0.0008;

  renderer.render(scene, camera);
}



// --- src: js/main.js ---
// main.js — wires everything together








// ── APP STATE ──
// everything lives here so all functions can access it
const state = {
  allLaunches:     [],   // full shaped dataset
  filteredLaunches: [],  // after search/filter/sort applied
  currentPage:     1,
  perPage:         12,
  selectedLaunch:  null,
};

// ── INIT ──

async function init() {
  try {
    // fetch everything in parallel
    const { launches, rockets, launchpads, payloads } = await fetchAllData();

    // shape raw data into clean objects
    const shaped = shapeLaunchData(launches, rockets, launchpads, payloads);

    // sort newest first by default
    shaped.sort((a, b) => new Date(b.date) - new Date(a.date));

    state.allLaunches      = shaped;
    state.filteredLaunches = shaped;

    // clear skeleton loaders
    clearSkeletons();

    // render everything
    renderStats(shaped);
    renderAgencies(shaped);
    renderTimeline(shaped);
    renderFavorites(shaped);
    initOrbitalVisualiser(shaped);

    // populate agency filter dropdown
    populateAgencyFilter(shaped);

    // render first page of cards
    renderPage(1);

    // init search/filter/sort listeners
    initFilters(state, renderPage);

    // Start the new interactive hero and video scroll sync
    initInteractiveText();
    initScrollHero();
    // Scroll spy still useful for highlighting
    initScrollSpy();
    initIntersectionObserver();
    setStatusLive();
  } catch (err) {
    console.error("Failed to load data:", err);
    setStatusError();
    clearSkeletons();
    showErrorState();
  }
}

// ── NEW HERO LOGIC ──

function initInteractiveText() {
  const container = document.getElementById('reveal-text');
  if (!container) return;
  const text = "ORION ARC";
  const letterDelay = 80;
  const overlayDelay = 60;
  const springDuration = 400;
  
  const images = [
    "assets/Satellites/AdobeStock_594956182.jpg.optimal.jpg",
    "assets/Satellites/Earth-from-space-1-64e9a7c.jpg",
    "assets/Satellites/Galileo and blue background.jpg",
    "assets/Satellites/MIT-Global-Broadband-01-PRESS.jpg",
    "assets/Satellites/Webp.net-resizeimage-51-1200x800.jpg",
    "assets/Satellites/different-types-of-satellites-jpg.webp",
    "assets/Satellites/gw-nasa-earth-science-mission-satellite.jpg",
    "assets/Satellites/satellites_960____640.jpg",
    "assets/Satellites/universal_upscale_0_89dec73f-75e4-44ff-84d4-765c2e8f21f3_0.jpg",
  ];

  let html = '';
  // Convert string to letters, ignoring spaces in delay counting but handling them visually
  let letterIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      html += '<span style="display:inline-block; width:0.3em;">&nbsp;</span>';
      continue;
    }
    const bgUrl = images[letterIndex % images.length];
    html += `
      <span class="letter-wrap" data-index="${letterIndex}">
        <span class="letter-base">${text[i]}</span>
        <span class="letter-hover" style="background-image: url('${bgUrl}')">${text[i]}</span>
        <span class="letter-overlay">${text[i]}</span>
      </span>
    `;
    letterIndex++;
  }
  container.innerHTML = html;

  const letters = document.querySelectorAll('.letter-wrap');
  letters.forEach((el) => {
    const idx = parseInt(el.dataset.index, 10);
    setTimeout(() => {
      el.classList.add('spring-in');
    }, idx * letterDelay);
  });

  const totalDelay = (letterIndex * letterDelay) + springDuration;
  
  setTimeout(() => {
    const overlays = document.querySelectorAll('.letter-overlay');
    overlays.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('sweep');
      }, index * overlayDelay);
    });
  }, totalDelay);
}

function initScrollHero() {
  const video = document.getElementById('hero-video');
  const section = document.getElementById('hero-scroll');
  if (!video || !section) return;

  // Make sure video stays paused so we can control timeline
  video.pause();

  window.addEventListener('scroll', () => {
    if (isNaN(video.duration) || video.duration === 0) return;
    
    const rect = section.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const startOffset = section.offsetTop;
    // max scroll height of the hero section constraint
    const maxScroll = section.offsetHeight - window.innerHeight;
    
    if (maxScroll <= 0) return;
    
    let progress = (scrollY - startOffset) / maxScroll;
    progress = Math.max(0, Math.min(1, progress));
    
    requestAnimationFrame(() => {
      video.currentTime = progress * video.duration;
    });
  });
}

// ── PAGINATION ──

function renderPage(page) {
  state.currentPage = page;

  const start = (page - 1) * state.perPage;
  const end   = start + state.perPage;
  const slice = state.filteredLaunches.slice(start, end);

  renderLaunchCards(slice);
  renderPagination(page, Math.ceil(state.filteredLaunches.length / state.perPage));

  // stagger card entrance
  staggerCards();

  // scroll back to launches section if paginating (not on first load)
  if (page > 1 || state.currentPage > 1) {
    const section = document.getElementById("launches");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// adds .visible class to cards with a small delay between each
function staggerCards() {
  const cards = document.querySelectorAll(".launch-card:not(.skeleton-card)");
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add("visible"), i * 50);
  });
}

// same for agency cards
function staggerAgencyCards() {
  const cards = document.querySelectorAll(".agency-card");
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add("visible"), i * 60);
  });
}

// ── AGENCY FILTER DROPDOWN ──

function populateAgencyFilter(launches) {
  const select   = $("filter-agency");
  const rockets  = [...new Set(launches.map(l => l.rocketName))].sort();

  rockets.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// ── MODAL ──

function openMission(id) {
  const launch = state.allLaunches.find(l => l.id === id);
  if (!launch) return;
  state.selectedLaunch = launch;
  renderModal(launch);
}

// ── ERROR STATE ──

function showErrorState() {
  const grid = $("launches-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
      <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--danger);">
        FAILED TO LOAD DATA — CHECK CONNECTION
      </p>
    </div>
  `;
}

// ── UTC CLOCK ──

function startClock() {
  const clock = $("nav-clock");
  if (!clock) return;
  clock.textContent = getUTCTimeString();
  setInterval(() => {
    clock.textContent = getUTCTimeString();
  }, 1000);
}

// ── THEME TOGGLE ──

function initTheme() {
  const saved = localStorage.getItem("orion-theme") || "light";
  document.body.setAttribute("data-theme", saved);

  $("theme-toggle").addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("orion-theme", next);

    // spin animation
    $("theme-toggle").classList.add("spinning");
    setTimeout(() => $("theme-toggle").classList.remove("spinning"), 400);
  });
}

// ── HAMBURGER MENU ──

function initHamburger() {
  const btn    = $("nav-hamburger");
  const drawer = $("nav-drawer");
  if (!btn || !drawer) return;

  btn.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });

  // close drawer on link click
  drawer.querySelectorAll(".drawer-link").forEach(link => {
    link.addEventListener("click", () => drawer.classList.remove("open"));
  });
}

// ── NAV SCROLL SPY ──
// highlights the correct nav link based on scroll position

function initScrollSpy() {
  const sections = ["globe", "launches", "agencies", "favorites"];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-link").forEach(l => l.classList.remove("active"));
        const active = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
        if (active) active.classList.add("active");
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ── INTERSECTION OBSERVER ──
// triggers .visible on elements as they scroll into view

function initIntersectionObserver() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // only trigger once
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".section-title").forEach(el => observer.observe(el));
  document.querySelectorAll(".agency-card").forEach(el => observer.observe(el));
}

// ── EVENT LISTENERS ──

function initEventListeners() {

  // pagination
  $("page-prev")?.addEventListener("click", () => {
    if (state.currentPage > 1) renderPage(state.currentPage - 1);
  });

  $("page-next")?.addEventListener("click", () => {
    const total = Math.ceil(state.filteredLaunches.length / state.perPage);
    if (state.currentPage < total) renderPage(state.currentPage + 1);
  });

  // page number click — delegated
  $("page-numbers")?.addEventListener("click", e => {
    if (e.target.classList.contains("page-num")) {
      renderPage(Number(e.target.dataset.page));
    }
  });

  // launch card clicks — delegated on grid
  $("launches-grid")?.addEventListener("click", e => {
    const viewBtn = e.target.closest(".card-view-btn");
    const favBtn  = e.target.closest(".card-fav-btn");
    const card    = e.target.closest(".launch-card");

    if (viewBtn) {
      openMission(viewBtn.dataset.id);
    } else if (favBtn) {
      const isSaved = toggleFavorite(favBtn.dataset.id);
      updateFavButtons(favBtn.dataset.id, isSaved);
      renderFavorites(state.allLaunches);
    } else if (card && card.dataset.id) {
      openMission(card.dataset.id);
    }
  });

  // favorites grid clicks — same pattern
  $("favorites-grid")?.addEventListener("click", e => {
    const viewBtn = e.target.closest(".card-view-btn");
    const favBtn  = e.target.closest(".card-fav-btn");
    const card    = e.target.closest(".launch-card");

    if (viewBtn) {
      openMission(viewBtn.dataset.id);
    } else if (favBtn) {
      const isSaved = toggleFavorite(favBtn.dataset.id);
      updateFavButtons(favBtn.dataset.id, isSaved);
      renderFavorites(state.allLaunches);
    } else if (card && card.dataset.id) {
      openMission(card.dataset.id);
    }
  });

  // modal close
  $("modal-close")?.addEventListener("click", closeModal);
  $("modal-overlay")?.addEventListener("click", e => {
    if (e.target === $("modal-overlay")) closeModal();
  });

  // modal fav button
  $("modal-fav-btn")?.addEventListener("click", e => {
    const id      = e.target.dataset.id;
    const isSaved = toggleFavorite(id);
    e.target.textContent = isSaved ? "♥ SAVED" : "♡ SAVE MISSION";
    updateFavButtons(id, isSaved);
    renderFavorites(state.allLaunches);
  });

  // hero random mission button
  $("hero-random-btn")?.addEventListener("click", () => {
    const random = state.allLaunches[Math.floor(Math.random() * state.allLaunches.length)];
    if (random) openMission(random.id);
  });

  // hero view mission button
  $("hero-view-btn")?.addEventListener("click", () => {
    if (state.selectedLaunch) openMission(state.selectedLaunch.id);
    else if (state.allLaunches.length) openMission(state.allLaunches.find(l => l.upcoming)?.id);
  });

  // reset filters from empty state
  $("empty-reset")?.addEventListener("click", () => {
    // reset will be handled by filters.js resetFilters export
    $("search-input").value   = "";
    $("filter-agency").value  = "all";
    $("filter-status").value  = "all";
    $("filter-orbit").value   = "all";
    $("sort-select").value    = "date-desc";
    state.filteredLaunches    = state.allLaunches;
    $("active-filters").innerHTML = "";
    renderPage(1);
  });

  // close modal on escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
}

// ── ORBITAL ARC VISUALISER ──
// Pure Canvas 2D — no libraries. Draws Earth, orbit rings, animated trajectory arcs.

function initOrbitalVisualiser(launches) {
  const canvas  = document.getElementById('orbital-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');

  // ── CONFIG ──
  const ORBIT_BANDS = {
    LEO:   { label: 'LEO',   r: 0.34, color: '#4fc3f7' },
    ISS:   { label: 'ISS',   r: 0.38, color: '#81c784' },
    SSO:   { label: 'SSO',   r: 0.41, color: '#ffb74d' },
    Polar: { label: 'POLAR', r: 0.44, color: '#ef9a9a' },
    GEO:   { label: 'GEO',   r: 0.60, color: '#ce93d8' },
  };
  const DEFAULT_BAND = { label: 'OTHER', r: 0.44, color: '#ef9a9a' };

  // Filter to launches that have a known launchpad
  const usable = launches.filter(l => l.siteLat !== null && l.siteLng !== null);
  if (!usable.length) return;

  let currentIdx  = 0;
  let autoplay    = true;
  let autoTimer   = null;
  let arc         = null;       // active arc animation state
  let particles   = [];         // orbiting particles

  // ── RESIZE ──
  function resize() {
    const wrap = canvas.parentElement;
    const size = Math.min(wrap.clientWidth, wrap.clientHeight);
    canvas.width  = size;
    canvas.height = size;
  }
  resize();
  window.addEventListener('resize', () => { resize(); draw(); });

  // ── COORDINATE HELPERS ──
  function cx() { return canvas.width  / 2; }
  function cy() { return canvas.height / 2; }
  function R()  { return canvas.width  * 0.22; } // Earth radius

  // map lat/lng to canvas x,y on Earth circle edge
  function latLngToCanvas(lat, lng) {
    // project longitude onto the circle (top-down equatorial view)
    const angle = (lng - 90) * (Math.PI / 180); // 0° points up
    const r = R();
    return {
      x: cx() + r * Math.cos(angle),
      y: cy() + r * Math.sin(angle),
    };
  }

  // ── ORBIT BAND ──
  function getOrbitBand(orbit) {
    if (!orbit || orbit === '—') return DEFAULT_BAND;
    const k = Object.keys(ORBIT_BANDS).find(k => orbit.toUpperCase().includes(k));
    return k ? ORBIT_BANDS[k] : DEFAULT_BAND;
  }

  // ── ARC STATE MACHINE ──
  function startArc(launch) {
    const band = getOrbitBand(launch.orbit);
    const orbitR = canvas.width * band.r;
    const site   = latLngToCanvas(launch.siteLat, launch.siteLng);

    // angle along the orbit ring where the arc ends (random but linked to launch)
    const hash    = launch.flightNumber % 360;
    const endAngle = (hash / 360) * Math.PI * 2;
    const endX     = cx() + orbitR * Math.cos(endAngle);
    const endY     = cy() + orbitR * Math.sin(endAngle);

    // quadratic bezier control point — push outward for the arc belly
    const midX = (site.x + endX) / 2;
    const midY = (site.y + endY) / 2;
    const pushX = (midX - cx()) * 0.6;
    const pushY = (midY - cy()) * 0.6;
    const cpX   = cx() + pushX * 2.2 + (Math.random() - 0.5) * orbitR * 0.5;
    const cpY   = cy() + pushY * 2.2 + (Math.random() - 0.5) * orbitR * 0.5;

    arc = {
      sx: site.x, sy: site.y,
      cpx: cpX,   cpy: cpY,
      ex: endX,   ey: endY,
      color: band.color,
      t: 0,          // progress 0→1
      fadingOut: false,
      alpha: 0,
      trail: [],     // sampled path points for the glowing trail
    };

    // pre-compute trail points (100 steps)
    for (let i = 0; i <= 100; i++) {
      const tt = i / 100;
      arc.trail.push(quadBezier(tt, arc.sx, arc.cpx, arc.ex, arc.sy, arc.cpy, arc.ey));
    }

    // launch a new particle onto the orbit ring
    spawnParticle(endAngle, orbitR, band.color);
  }

  function quadBezier(t, x0, x1, x2, y0, y1, y2) {
    const x = (1-t)*(1-t)*x0 + 2*(1-t)*t*x1 + t*t*x2;
    const y = (1-t)*(1-t)*y0 + 2*(1-t)*t*y1 + t*t*y2;
    return { x, y };
  }

  // ── PARTICLES ── tiny dots that slowly orbit a ring
  function spawnParticle(startAngle, radius, color) {
    particles.push({
      angle:  startAngle,
      radius: radius,
      color:  color,
      speed:  0.004 + Math.random() * 0.003,
      size:   2.5 + Math.random() * 1.5,
      alpha:  1,
      life:   1,  // 0→1, counts down
    });
    // cap particles to avoid clutter
    if (particles.length > 18) particles.shift();
  }

  // ── UPDATE PANEL ──
  function updatePanel(launch, idx) {
    const $n = document.getElementById('orbital-mission-name');
    const $r = document.getElementById('orbital-rocket');
    const $s = document.getElementById('orbital-site');
    const $o = document.getElementById('orbital-orbit');
    const $d = document.getElementById('orbital-date');
    const $t = document.getElementById('orbital-status');
    const $i = document.getElementById('orbital-idx');
    const $total = document.getElementById('orbital-total');

    if ($n) { $n.style.opacity = '0'; setTimeout(() => { $n.textContent = launch.name; $n.style.opacity = '1'; }, 200); }
    if ($r) $r.textContent = launch.rocketName || '—';
    if ($s) $s.textContent = launch.siteName   || '—';
    if ($o) $o.textContent = launch.orbit       || '—';
    if ($d) $d.textContent = formatDate(launch.date);
    if ($t) $t.textContent = getLaunchStatus(launch).toUpperCase();
    if ($i) $i.textContent = idx + 1;
    if ($total) $total.textContent = usable.length;
  }

  // ── SHOW MISSION ──
  function showMission(idx) {
    const launch = usable[idx];
    updatePanel(launch, idx);
    startArc(launch);
  }

  // ── AUTO-CYCLE ──
  function scheduleNext() {
    clearTimeout(autoTimer);
    if (!autoplay) return;
    autoTimer = setTimeout(() => {
      currentIdx = (currentIdx + 1) % usable.length;
      showMission(currentIdx);
      scheduleNext();
    }, 4500);
  }

  // ── DRAW ──
  function drawEarth() {
    const r   = R();
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const bgFill = isDark ? '#0d1a2e' : '#d8eaf7';
    const glowColor = isDark ? 'rgba(79,195,247,0.18)' : 'rgba(0,120,200,0.12)';

    // atmospheric glow ring
    const glow = ctx.createRadialGradient(cx(), cy(), r * 0.9, cx(), cy(), r * 1.22);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx(), cy(), r * 1.22, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Earth body
    const grad = ctx.createRadialGradient(cx() - r * 0.25, cy() - r * 0.25, r * 0.1, cx(), cy(), r);
    if (isDark) {
      grad.addColorStop(0, '#1a3a5c');
      grad.addColorStop(0.5, '#0f2744');
      grad.addColorStop(1, '#081522');
    } else {
      grad.addColorStop(0, '#5bb3e8');
      grad.addColorStop(0.5, '#3a8fc9');
      grad.addColorStop(1, '#1b6aa5');
    }
    ctx.beginPath();
    ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // land mass suggestion — simple dark blobs
    const landColor = isDark ? 'rgba(30,70,100,0.6)' : 'rgba(20,90,40,0.35)';
    const landMasses = [
      { a: -0.2, b: 0.7, rx: r*0.28, ry: r*0.20 }, // Americas
      { a: 1.0,  b: -0.1, rx: r*0.22, ry: r*0.30 }, // EuroAfrica
      { a: 1.8,  b: -0.05, rx: r*0.18, ry: r*0.20 }, // Asia
    ];
    landMasses.forEach(lm => {
      const px = cx() + lm.a * r * 0.55;
      const py = cy() + lm.b * r * 0.55;
      ctx.beginPath();
      ctx.ellipse(px, py, lm.rx, lm.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = landColor;
      ctx.fill();
    });

    // edge glow
    ctx.beginPath();
    ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(79,195,247,0.35)' : 'rgba(0,120,200,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawOrbitRings() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    Object.values(ORBIT_BANDS).forEach(band => {
      const r = canvas.width * band.r;
      ctx.beginPath();
      ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
      ctx.strokeStyle = band.color +  (isDark ? '28' : '30');
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // tiny label
      ctx.fillStyle = band.color + (isDark ? 'a0' : '90');
      ctx.font = `${canvas.width * 0.018}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(band.label, cx() + r + 4, cy() - 4);
    });
  }

  function drawLaunchSites() {
    // plot all unique launch sites as faint dots on Earth's equator projection
    const seenSites = new Set();
    usable.forEach((l, i) => {
      const key = `${l.siteLat},${l.siteLng}`;
      if (seenSites.has(key)) return;
      seenSites.add(key);

      const { x, y } = latLngToCanvas(l.siteLat, l.siteLng);
      const isActive = i === currentIdx;
      const isDark = document.body.getAttribute('data-theme') === 'dark';

      if (isActive) {
        // pulsing ring
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
        ctx.beginPath();
        ctx.arc(x, y, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(79,195,247,${0.4 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // active dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#4fc3f7';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
        ctx.fill();
      }
    });
  }

  function drawArc() {
    if (!arc) return;

    const speed = 0.012;
    arc.t = Math.min(arc.t + speed, 1);
    if (arc.t < 0.15) { arc.alpha = arc.t / 0.15; }
    else if (arc.t > 0.85) { arc.alpha = (1 - arc.t) / 0.15; }
    else { arc.alpha = 1; }

    const trailEnd = Math.floor(arc.t * 100);
    const trailStart = Math.max(0, trailEnd - 22);

    // draw glowing trail segments with fade
    for (let i = trailStart; i < trailEnd; i++) {
      const p0 = arc.trail[i];
      const p1 = arc.trail[i + 1];
      if (!p0 || !p1) continue;
      const segProgress = (i - trailStart) / (trailEnd - trailStart);
      const alpha = segProgress * arc.alpha;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = arc.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2 + segProgress * 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // dot at head of arc
    const head = arc.trail[trailEnd];
    if (head) {
      ctx.beginPath();
      ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = arc.color;
      ctx.globalAlpha = arc.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    particles.forEach((p, idx) => {
      p.angle += p.speed;
      p.life  -= 0.0008;
      if (p.life <= 0) { particles.splice(idx, 1); return; }

      const px = cx() + p.radius * Math.cos(p.angle);
      const py = cy() + p.radius * Math.sin(p.angle);

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life * 3) * 0.75;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function draw() {
    if (!canvas.width) return;
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = isDark ? '#080b0f' : '#f0f4f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid dots (radar feel)
    const gridStep = canvas.width / 10;
    for (let gx = 0; gx < canvas.width; gx += gridStep) {
      for (let gy = 0; gy < canvas.height; gy += gridStep) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
        ctx.fill();
      }
    }

    drawOrbitRings();
    drawEarth();
    drawLaunchSites();
    drawArc();
    drawParticles();

    requestAnimationFrame(draw);
  }

  // ── BUTTONS ──
  document.getElementById('orbital-prev')?.addEventListener('click', () => {
    currentIdx = (currentIdx - 1 + usable.length) % usable.length;
    showMission(currentIdx);
    if (autoplay) scheduleNext();
  });

  document.getElementById('orbital-next')?.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % usable.length;
    showMission(currentIdx);
    if (autoplay) scheduleNext();
  });

  document.getElementById('orbital-auto')?.addEventListener('click', e => {
    autoplay = !autoplay;
    e.target.textContent = autoplay ? '⏸ PAUSE' : '▶ PLAY';
    if (autoplay) scheduleNext();
    else clearTimeout(autoTimer);
  });

  // ── KICK OFF ──
  showMission(0);
  scheduleNext();
  draw();
}

// ── START ──


document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHamburger();
  startClock();
  initEventListeners();
  init();
});
