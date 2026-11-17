/* =========================================================
   NEONVICE — front-end app
   hash router · zero dependencies
   ========================================================= */
(function () {
  "use strict";

  const { SITE, CATEGORIES, VIDEOS } = window;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $("#app");

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, c => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]
  ));

  function fmtDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h
      ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
      : `${m}:${String(s).padStart(2,"0")}`;
  }

  function fmtViews(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "K";
    return String(n);
  }

  function fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  const byId = (id) => VIDEOS.find(v => v.id === id);
  const byCat = (slug) => VIDEOS.filter(v => v.categories.includes(slug));
  const uniqTags = () => {
    const set = new Set();
    VIDEOS.forEach(v => v.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  };

  const PLAY_ICON = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

  function getLiked() {
    try { return new Set(JSON.parse(localStorage.getItem("nv_liked") || "[]")); }
    catch { return new Set(); }
  }
  function setLiked(set) {
    localStorage.setItem("nv_liked", JSON.stringify(Array.from(set)));
  }

  /* ---------------- components ---------------- */
  function cardHTML(v) {
    return `
      <a class="card" href="#/watch/${v.id}">
        <div class="card-thumb" style="background:${v.gradient}">
          <span class="hd">HD</span>
          <span class="play">${PLAY_ICON}</span>
          <span class="dur">${fmtDuration(v.duration)}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(v.title)}</h3>
          <div class="card-meta">
            <span>${esc(v.studio)}</span>
            <span class="dot">·</span>
            <span>${fmtViews(v.views)} views</span>
            <span class="dot">·</span>
            <span class="rating">★ ${v.rating.toFixed(1)}</span>
          </div>
          <div class="card-tags">
            ${v.tags.slice(0, 3).map(t => `<span class="tag">#${esc(t)}</span>`).join("")}
          </div>
        </div>
      </a>`;
  }

  function gridHTML(list) {
    if (!list.length) {
      return `<div class="empty"><strong>Nothing here yet</strong>Try another category or search term.</div>`;
    }
    return `<div class="grid">${list.map(cardHTML).join("")}</div>`;
  }

  function sideCardHTML(v) {
    return `
      <a class="side-card" href="#/watch/${v.id}">
        <div class="side-thumb" style="background:${v.gradient}">
          <span class="dur">${fmtDuration(v.duration)}</span>
        </div>
        <div>
          <h4>${esc(v.title)}</h4>
          <div class="side-meta">${esc(v.studio)} · ${fmtViews(v.views)} views</div>
        </div>
      </a>`;
  }

  /* ---------------- router ---------------- */
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    return raw.split("/").filter(Boolean).map(decodeURIComponent);
  }

  function route() {
    const parts = parseHash();
    const [seg, param] = parts;
    highlightNav(seg, param);

    if (!seg)                       return renderHome();
    if (seg === "watch")            return renderWatch(param);
    if (seg === "category")         return renderCategory(param);
    if (seg === "search")           return renderSearch(param || "");
    return renderHome();
  }

  function highlightNav(seg, param) {
    $$("#navCats a").forEach(a => {
      const s = a.dataset.slug;
      a.classList.toggle("active",
        (seg === "category" && s === param) || (seg === "search" && s === "search"));
    });
  }

  function mount(html) {
    app.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------------- pages ---------------- */
  function renderHome() {
    const featured = VIDEOS.slice().sort((a, b) => b.views - a.views)[0];
    const latest   = VIDEOS.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    const trending = VIDEOS.slice().sort((a, b) => b.views - a.views).slice(0, 8);
    const tags     = uniqTags().slice(0, 26);

    mount(`
      <section class="hero" style="--hero-bg:${featured.gradient}">
        <div>
          <span class="hero-badge">● Featured tonight</span>
          <h1 class="hero-title">${esc(featured.title)}</h1>
          <div class="hero-meta">
            <span>${featured.performers.map(esc).join(" & ")}</span>
            <span class="dot">·</span>
            <span>${esc(featured.studio)}</span>
            <span class="dot">·</span>
            <span>${fmtViews(featured.views)} views</span>
            <span class="dot">·</span>
            <span>★ ${featured.rating.toFixed(1)}</span>
          </div>
          <div class="hero-actions">
            <a class="hero-play" href="#/watch/${featured.id}">${PLAY_ICON} Watch now</a>
            <a class="btn-ghost" href="#/category/trending">See what's trending</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">New releases</h2>
          <a class="section-link" href="#/category/new">View all →</a>
        </div>
        ${gridHTML(latest)}
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">Most watched</h2>
          <a class="section-link" href="#/category/trending">View all →</a>
        </div>
        ${gridHTML(trending)}
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">Browse by tag</h2>
        </div>
        <div class="chips">
          ${tags.map(t => `<a href="#/search/${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}
        </div>
      </section>
    `);
  }

  function renderCategory(slug) {
    const meta = CATEGORIES.find(c => c.slug === slug);
    let list = byCat(slug);

    if (slug === "new")      list = VIDEOS.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (slug === "trending") list = VIDEOS.slice().sort((a, b) => b.views - a.views);

    if (!meta && !list.length) {
      return mount(`<div class="empty"><strong>Category not found</strong>That shelf doesn't exist.</div>`);
    }

    const title = meta ? meta.label : slug;

    mount(`
      <div class="page-head">
        <h1>${esc(title)}</h1>
        <p>${list.length} ${list.length === 1 ? "video" : "videos"} · explicit · 18+</p>
      </div>

      <div class="chips">
        ${CATEGORIES.map(c => `
          <a href="#/category/${c.slug}" class="${c.slug === slug ? "active" : ""}">${esc(c.label)}</a>
        `).join("")}
      </div>

      <div class="toolbar">
        <span class="toolbar-label">Sort</span>
        <button class="sort-btn active" data-sort="latest">Latest</button>
        <button class="sort-btn" data-sort="views">Most viewed</button>
        <button class="sort-btn" data-sort="rating">Top rated</button>
      </div>

      <div id="catGrid">${gridHTML(list)}</div>
    `);

    $$(".sort-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".sort-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const k = btn.dataset.sort;
        const sorted = list.slice().sort((a, b) =>
          k === "views"  ? b.views - a.views :
          k === "rating" ? b.rating - a.rating :
                           b.date.localeCompare(a.date)
        );
        $("#catGrid").innerHTML = gridHTML(sorted);
      });
    });
  }

  function renderSearch(query) {
    const q = query.trim().toLowerCase();
    const list = q
      ? VIDEOS.filter(v =>
          v.title.toLowerCase().includes(q) ||
          v.performers.join(" ").toLowerCase().includes(q) ||
          v.studio.toLowerCase().includes(q) ||
          v.tags.some(t => t.toLowerCase().includes(q)) ||
          v.categories.some(c => c.toLowerCase().includes(q))
        )
      : [];

    mount(`
      <div class="page-head">
        <h1>${q ? `Results for “${esc(query)}”` : "Search"}</h1>
        <p>${q ? `${list.length} ${list.length === 1 ? "match" : "matches"}` : "Type something in the search bar above."}</p>
      </div>
      ${gridHTML(list)}
    `);

    const input = $("#searchInput");
    if (input) input.value = query;
  }

  function renderWatch(id) {
    const v = byId(id);
    if (!v) {
      return mount(`<div class="empty"><strong>Video not found</strong>It may have been removed.</div>`);
    }

    const related = VIDEOS
      .filter(x => x.id !== v.id && x.categories.some(c => v.categories.includes(c)))
      .slice(0, 6);

    const liked = getLiked();
    const isLiked = liked.has(v.id);

    mount(`
      <div class="watch">
        <div class="watch-main">
          <div class="player" id="player">
            <video id="videoEl" controls playsinline preload="none"></video>
            <div class="player-cover" id="playerCover" style="background:${v.gradient}">
              <button class="play-big" data-play="${v.id}" aria-label="Play">
                ${PLAY_ICON}
              </button>
            </div>
          </div>

          <h1 class="watch-title">${esc(v.title)}</h1>

          <div class="watch-sub">
            <span class="performer">${v.performers.map(esc).join(" & ")}</span>
            <span class="dot">·</span>
            <span>${esc(v.studio)}</span>
            <span class="dot">·</span>
            <span>${fmtViews(v.views)} views</span>
            <span class="dot">·</span>
            <span class="rating">★ ${v.rating.toFixed(1)}</span>
            <span class="dot">·</span>
            <span>${fmtDate(v.date)}</span>
            <span class="dot">·</span>
            <span>${fmtDuration(v.duration)}</span>
          </div>

          <div class="watch-actions">
            <button class="action-btn ${isLiked ? "on" : ""}" id="likeBtn" data-id="${v.id}">
              <svg viewBox="0 0 24 24"><path d="M12 21s-7.4-4.6-9.5-9A5.4 5.4 0 0 1 12 5.6 5.4 5.4 0 0 1 21.5 12c-2.1 4.4-9.5 9-9.5 9Z"/></svg>
              <span id="likeCount">${fmtViews(v.likes + (isLiked ? 1 : 0))}</span>
            </button>
            <button class="action-btn" id="shareBtn">
              <svg viewBox="0 0 24 24"><path d="M14 9V5l7 7-7 7v-4.1c-4 0-6.7 1.3-9 4.1 1.2-4.6 3.8-8.7 9-10Z"/></svg>
              Share
            </button>
            <button class="action-btn" id="saveBtn">
              <svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>
              Save
            </button>
          </div>

          <div class="watch-desc">
            <h4>Description</h4>
            <p>${esc(v.description)}</p>
            <div class="watch-tags">
              ${v.tags.map(t => `<a class="tag" href="#/search/${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}
            </div>
          </div>

          <section class="comments">
            <h3>Comments · 3</h3>
            ${[
              { n: "deepthroatdevotee", t: "2 hours ago", b: "minute 12 is the whole reason i pay for this site." },
              { n: "anal_only_acct",    t: "yesterday",   b: "the slow build actually pays off for once. respect." },
              { n: "nightowl_88",       t: "3 days ago",  b: "she's genuinely enjoying herself, that's rare here. more of this." }
            ].map(c => `
              <div class="comment">
                <div class="avatar">${esc(c.n[0].toUpperCase())}</div>
                <div>
                  <div class="comment-head">
                    <span class="comment-name">${esc(c.n)}</span>
                    <span class="comment-time">${esc(c.t)}</span>
                  </div>
                  <div class="comment-body">${esc(c.b)}</div>
                </div>
              </div>`).join("")}
          </section>
        </div>

        <aside class="watch-side">
          <h3 class="side-title">Related</h3>
          <div class="side-list">
            ${related.map(sideCardHTML).join("") || `<p class="muted small">No related videos.</p>`}
          </div>
        </aside>
      </div>
    `);

    wireWatch(v);
  }

  function wireWatch(v) {
    const cover = $("#playerCover");
    const video = $("#videoEl");

    cover.addEventListener("click", () => {
      cover.style.display = "none";
      video.src = v.src;
      video.play().catch(() => {
        toast("Playback blocked — check the media URL in data.js");
      });
    });

    $("#likeBtn").addEventListener("click", function () {
      const liked = getLiked();
      const btn = this;
      if (liked.has(v.id)) {
        liked.delete(v.id);
        btn.classList.remove("on");
      } else {
        liked.add(v.id);
        btn.classList.add("on");
        toast("Added to your likes");
      }
      setLiked(liked);
      $("#likeCount").textContent = fmtViews(v.likes + (liked.has(v.id) ? 1 : 0));
    });

    $("#shareBtn").addEventListener("click", async () => {
      const url = location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title: v.title, url });
        } else {
          await navigator.clipboard.writeText(url);
          toast("Link copied");
        }
      } catch { /* user cancelled */ }
    });

    $("#saveBtn").addEventListener("click", function () {
      this.classList.toggle("on");
      toast(this.classList.contains("on") ? "Saved to watch later" : "Removed");
    });
  }

  /* ---------------- boot ---------------- */
  function buildNav() {
    $("#navCats").innerHTML = CATEGORIES.map(c =>
      `<a href="#/category/${c.slug}" data-slug="${c.slug}">${esc(c.label)}</a>`
    ).join("");
  }

  function wireGlobal() {
    $("#ageEnter").addEventListener("click", () => {
      localStorage.setItem("nv_age_ok", "1");
      document.documentElement.classList.add("age-ok");
    });

    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = $("#searchInput").value.trim();
      if (!q) return;
      location.hash = `#/search/${encodeURIComponent(q)}`;
    });

    window.addEventListener("hashchange", route);
  }

  buildNav();
  wireGlobal();
  $("#year").textContent = new Date().getFullYear();
  route();
})();