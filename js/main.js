const CONFIG = {
  rssFeedUrl: "https://anchor.fm/s/109d4dc6c/podcast/rss",
  rssProxy: "https://api.rss2json.com/v1/api.json?rss_url=",
  maxEpisodes: 12,
  contactEmail: "hello@behindtheregspodcast.co.uk",
  platforms: [
    { label: "Spotify", href: "#" },
    { label: "Apple Podcasts", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "RSS Feed", href: "https://anchor.fm/s/109d4dc6c/podcast/rss" },
  ],
};

const state = { episodes: [] };

function initNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true }
  );

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

function initPlatforms() {
  const list = document.querySelector(".platform-list");
  if (!list) return;
  list.innerHTML = CONFIG.platforms
    .map(
      (p) => `
      <a class="platform-link" href="${p.href}" target="_blank" rel="noopener">
        <span>${p.label}</span>
        <span aria-hidden="true">&#8599;</span>
      </a>`
    )
    .join("");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

async function loadEpisodes() {
  const grid = document.querySelector(".episode-grid");
  const status = document.querySelector(".episode-status");

  try {
    const res = await fetch(CONFIG.rssProxy + encodeURIComponent(CONFIG.rssFeedUrl));
    if (!res.ok) throw new Error("Feed request failed");
    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Feed returned no items");
    }

    state.episodes = data.items.slice(0, CONFIG.maxEpisodes);
    status.remove();
    grid.innerHTML = state.episodes
      .map(
        (ep, i) => `
        <button class="episode-card" data-index="${i}" type="button">
          <span class="episode-tag">Episode</span>
          <h3>${ep.title}</h3>
          <p class="episode-desc">${stripHtml(ep.description).slice(0, 140)}</p>
          <span class="episode-meta">${formatDate(ep.pubDate)} &middot; Read &amp; Listen</span>
        </button>`
      )
      .join("");

    grid.querySelectorAll(".episode-card").forEach((card) =>
      card.addEventListener("click", () => openEpisode(Number(card.dataset.index)))
    );
  } catch (err) {
    status.textContent =
      "Couldn't load the latest episodes right now — head over to Spotify or Apple Podcasts to listen.";
  }
}

function openEpisode(index) {
  const ep = state.episodes[index];
  if (!ep) return;
  const overlay = document.querySelector(".detail-overlay");
  const panel = overlay.querySelector(".detail-panel");

  const audioSrc = ep.enclosure && ep.enclosure.link ? ep.enclosure.link : "";

  panel.innerHTML = `
    <button class="detail-close" type="button" aria-label="Close">&times;</button>
    <span class="eyebrow">${formatDate(ep.pubDate)}</span>
    <h3>${ep.title}</h3>
    ${audioSrc ? `<audio class="detail-audio" controls src="${audioSrc}"></audio>` : ""}
    <div class="detail-body">${ep.content || ep.description || ""}</div>
    <p><a class="btn btn-outline" href="${ep.link}" target="_blank" rel="noopener">Open episode page &#8599;</a></p>
  `;

  overlay.classList.add("open");
  overlay.querySelector(".detail-close").addEventListener("click", closeEpisode);
  document.body.style.overflow = "hidden";
}

function closeEpisode() {
  document.querySelector(".detail-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function initOverlay() {
  const overlay = document.querySelector(".detail-overlay");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEpisode();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEpisode();
  });
}

async function loadGuests() {
  const grid = document.querySelector(".guest-grid");
  if (!grid) return;
  try {
    const res = await fetch("data/guests.json");
    const guests = await res.json();
    grid.innerHTML = guests
      .map(
        (g) => `
        <article class="guest-card">
          <div class="guest-avatar">${g.initials}</div>
          <h4>${g.name}</h4>
          <p class="guest-role">${g.role}</p>
          ${g.episodeUrl ? `<a class="guest-episode" href="${g.episodeUrl}" target="_blank" rel="noopener">Hear their episode</a>` : ""}
        </article>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="episode-status">Guest list coming soon.</p>`;
  }
}

function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#name").value;
    const email = form.querySelector("#email").value;
    const message = form.querySelector("#message").value;
    const subject = encodeURIComponent(`Message from ${name} via Behind The Regs site`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
  });
}

function initFloatingCta() {
  const cta = document.querySelector(".floating-cta");
  const contact = document.querySelector("#contact");
  if (!cta || !contact) return;
  const observer = new IntersectionObserver(
    ([entry]) => cta.classList.toggle("hidden", entry.isIntersecting),
    { rootMargin: "0px 0px -10% 0px" }
  );
  observer.observe(contact);
}

function initYear() {
  const el = document.querySelector("#current-year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initPlatforms();
  initOverlay();
  loadEpisodes();
  loadGuests();
  initContactForm();
  initFloatingCta();
  initYear();
});
