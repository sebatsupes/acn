const CONFIG = {
  YOUTUBE_API_KEY: "",
  YOUTUBE_CHANNEL_ID: "",
  DEFAULT_VIDEO_ID: "syFZfO_wfMQ"
};

let SITE = {
  address: "",
  youtubeUrl: "",
  heroTitle: "",
  scheduleText: "",
  social: [],
  events: []
};

// Helpers
function encodeQuery(q){ return encodeURIComponent(q); }

function openGoogleMapsPlace() {
  const q = encodeQuery(SITE.address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer");
}

function openGoogleMapsDirections({ originLat, originLng } = {}) {
  const destination = encodeQuery(SITE.address);

  if (typeof originLat === "number" && typeof originLng === "number") {
    const origin = encodeURIComponent(`${originLat},${originLng}`);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  openGoogleMapsPlace();
}

function tryAutoDirections() {
  if (!navigator.geolocation) { openGoogleMapsDirections(); return; }

  navigator.geolocation.getCurrentPosition(
    (pos) => openGoogleMapsDirections({ originLat: pos.coords.latitude, originLng: pos.coords.longitude }),
    () => openGoogleMapsDirections(),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

// Theme
function setThemeIcon(theme){
  const icon1 = document.querySelector("#themeToggle .themeBtn__icon");
  const icon2 = document.querySelector("#themeToggleMobile .themeBtn__icon");
  const value = theme === "dark" ? "☀️" : "🌙";
  if (icon1) icon1.textContent = value;
  if (icon2) icon2.textContent = value;
}

function applyTheme(theme){
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  setThemeIcon(theme);
}

function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") applyTheme(saved);
  else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

function setupThemeButtons(){
  const btnDesk = document.getElementById("themeToggle");
  const btnMob  = document.getElementById("themeToggleMobile");

  const toggle = () => {
    const current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  };

  if (btnDesk) btnDesk.addEventListener("click", toggle);
  if (btnMob)  btnMob.addEventListener("click", toggle);
}

// Mobile menu
function setupMobileMenu(){
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (!menuBtn || !mobileNav) return;

  const close = () => {
    mobileNav.setAttribute("hidden", "");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    mobileNav.removeAttribute("hidden");
    menuBtn.setAttribute("aria-expanded", "true");
  };

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = mobileNav.hasAttribute("hidden");
    isHidden ? open() : close();
  });

  mobileNav.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.tagName === "A") close();
  });

  document.addEventListener("click", (e) => {
    if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

// Render data.json
function renderFromData(){
  const addrEl = document.getElementById("churchAddress");
  const heroEl = document.getElementById("heroTitle");
  const schEl  = document.getElementById("scheduleText");
  const ytBtn  = document.getElementById("btnYouTube");

  if (addrEl) addrEl.textContent = SITE.address || "";
  if (heroEl) heroEl.textContent = SITE.heroTitle || "";
  if (schEl)  schEl.textContent  = SITE.scheduleText || "";
  if (ytBtn)  ytBtn.href = SITE.youtubeUrl || "https://www.youtube.com/@avenidacentralnorte";

  // Maps link
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeQuery(SITE.address || "")}`;
  const btnOpenMap = document.getElementById("btnOpenMap");
  if (btnOpenMap) btnOpenMap.href = mapsUrl;

  // Social
  const socialMount = document.getElementById("socialMount");
  if (socialMount) {
    socialMount.innerHTML = "";
    (SITE.social || []).forEach((s) => {
      const a = document.createElement("a");
      a.className = "btn btn--ghost";
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = s.label;
      socialMount.appendChild(a);
    });
  }

  // Events
  const mount = document.getElementById("eventsMount");
  if (mount) {
    const list = Array.isArray(SITE.events) ? SITE.events : [];
    mount.innerHTML = "";

    if (!list.length) {
      mount.innerHTML = `<div class="card"><p class="muted">Aún no hay eventos publicados.</p></div>`;
      return;
    }

    list.forEach((e) => {
      const article = document.createElement("article");
      article.className = "evento-card";
      article.innerHTML = `
        <div class="evento-img">
          <img src="${e.image}" alt="${e.title || "Evento"}" loading="lazy">
        </div>
        <div class="evento-info">
          <span class="evento-badge">${e.badge || "Evento"}</span>
          <h3>${e.title || ""}</h3>
          <p class="muted">${(e.desc || "").replace(/\n/g, "<br>")}</p>
          <div class="evento-meta">
            <div>📍 ${e.place || ""}</div>
            <div>📅 ${e.date || ""}</div>
          </div>
        </div>
      `;
      mount.appendChild(article);
    });
  }
}

async function loadData(){
  try{
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar data.json");
    const data = await res.json();
    SITE = { ...SITE, ...data };
  } catch(e){
    // fallback
  } finally {
    renderFromData();
  }
}

// YouTube live auto (si no tienes API key, cae al default)
function setLiveStatus(text, variant){
  const badge = document.getElementById("liveBadge");
  if (!badge) return;
  badge.textContent = text;
  badge.style.background = "";
  if (variant === "live") badge.style.background = "rgba(239,68,68,.15)";
  if (variant === "last") badge.style.background = "rgba(37,99,235,.12)";
}

function setVideo(videoId){
  const frame = document.getElementById("liveFrame");
  if (!frame) return;
  frame.src = `https://www.youtube.com/embed/${videoId}`;
}

async function resolveLiveOrLatest(){
  if (!CONFIG.YOUTUBE_API_KEY || !CONFIG.YOUTUBE_CHANNEL_ID){
    setLiveStatus("Video destacado", "last");
    setVideo(CONFIG.DEFAULT_VIDEO_ID);
    return;
  }

  const key = encodeURIComponent(CONFIG.YOUTUBE_API_KEY);
  const channelId = encodeURIComponent(CONFIG.YOUTUBE_CHANNEL_ID);

  const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${key}`;

  try{
    const liveRes = await fetch(liveUrl);
    const liveJson = await liveRes.json();
    const liveItem = liveJson.items && liveJson.items[0];
    if (liveItem?.id?.videoId){
      setLiveStatus("🔴 EN VIVO", "live");
      setVideo(liveItem.id.videoId);
      return;
    }
  } catch {}

  const lastUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=1&key=${key}`;

  try{
    const lastRes = await fetch(lastUrl);
    const lastJson = await lastRes.json();
    const lastItem = lastJson.items && lastJson.items[0];
    if (lastItem?.id?.videoId){
      setLiveStatus("Último video", "last");
      setVideo(lastItem.id.videoId);
      return;
    }
  } catch {}

  setLiveStatus("Video destacado", "last");
  setVideo(CONFIG.DEFAULT_VIDEO_ID);
}

// Buttons
function setupButtons(){
  const btnDirections = document.getElementById("btnDirections");
  if (btnDirections) btnDirections.addEventListener("click", tryAutoDirections);
}


// Init
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupThemeButtons();
  setupMobileMenu();
  setupButtons();
  setupPWA();

  await loadData();
  await resolveLiveOrLatest();
});



