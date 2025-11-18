/* ----------------------------------------------------
   UiA Kraken Esports — Global JS (scripts.js)
   - Mobile nav
   - Dynamic year
   - Data loading from /data/*.json
-------------------------------------------------------*/

/* ------------------------------
   Mobile navigation toggle
------------------------------ */
(function initNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const primaryNav = document.getElementById('primary-nav');

  if (!menuToggle || !primaryNav) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryNav.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && primaryNav.classList.contains('open')) {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ------------------------------
   Dynamic year in footer
------------------------------ */
(function setYear() {
  const yearEl = document.getElementById('year');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
})();

/* ------------------------------
   Helpers
------------------------------ */
function createEl(tag, options = {}) {
  const el = document.createElement(tag);

  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  if (options.href) el.href = options.href;
  if (options.src) el.src = options.src;
  if (options.alt !== undefined) el.alt = options.alt;
  if (options.loading) el.loading = options.loading;
  if (options.role) el.setAttribute('role', options.role);

  if (options.aria) {
    Object.entries(options.aria).forEach(([k, v]) => {
      el.setAttribute(`aria-${k}`, v);
    });
  }

  return el;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

/* ------------------------------
   Render Schedule (index.html)
------------------------------ */
async function renderSchedule() {
  const grid = document.getElementById('schedule-grid');
  if (!grid) return;

  try {
    const schedule = await loadJSON('../data/schedule.json');

    schedule.forEach(match => {
      const card = createEl('article', { className: 'card match', role: 'listitem' });

      const left = createEl('div');
      const right = createEl('div');

      const metaBadges = createEl('div', {
        className: 'match-meta',
        html: `
          <span class="badge">${match.game}</span>
          <span class="badge">${match.league}</span>
          <span class="badge">${match.stage}</span>
        `
      });

      const title = createEl('h3', { className: 'match-title', text: match.title });

      const metaInfo = createEl('p', {
        className: 'match-meta',
        html: `<span>${fmtDate(match.datetime)}</span> • <span>${match.venue}</span>`
      });

      left.append(metaBadges, title, metaInfo);

      const watchBtn = createEl('a', {
        className: 'btn btn-outline',
        href: match.stream || '#',
        text: 'Watch'
      });
      watchBtn.setAttribute('aria-label', `Watch stream for ${match.title}`);

      right.append(watchBtn);

      card.append(left, right);
      grid.append(card);
    });
  } catch (err) {
    console.error(err);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

/* ------------------------------
   Render Roster (index.html)
------------------------------ */
async function renderRoster() {
  const grid = document.getElementById('roster-grid');
  if (!grid) return;

  try {
    const roster = await loadJSON('../data/roster.json');

    roster.forEach(player => {
      const item = createEl('article', { className: 'card roster-card', role: 'listitem' });

      const img = createEl('img', {
        className: 'avatar',
        src: `../assets/images/players/${player.handle.replace(/\s+/g, '')}.jpg`,
        alt: `${player.name} avatar`,
        loading: 'lazy'
      });

      img.onerror = () => {
        img.onerror = null;
        img.src = player.avatar && player.avatar.trim()
          ? player.avatar
          : `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(player.handle)}&radius=10`;
      };

      const info = createEl('div');
      const handle = createEl('div', { className: 'handle', text: player.handle });
      const role = createEl('div', { className: 'role', text: `${player.role} • ${player.country}` });

      const tags = createEl('div', { className: 'tags' });
      (player.tags || []).forEach(tag => {
        tags.append(createEl('span', { className: 'badge', text: tag }));
      });

      info.append(handle, role, tags);
      item.append(img, info);
      grid.append(item);
    });
  } catch (err) {
    console.error(err);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

/* ------------------------------
   Render News (index.html)
------------------------------ */
let newsPage = 0;
const pageSize = 3;
let newsCache = null;

async function renderNewsPage() {
  const list = document.getElementById('news-list');
  const loadMoreBtn = document.getElementById('load-more-news');
  if (!list || !loadMoreBtn) return;

  try {
    if (!newsCache) {
      newsCache = await loadJSON('../data/news.json');
    }

    const start = newsPage * pageSize;
    const slice = newsCache.slice(start, start + pageSize);

    slice.forEach(article => {
      const item = createEl('article', { className: 'news-item', role: 'listitem' });

      const title = createEl('h3');
      const link = createEl('a', { href: article.url || '#', text: article.title });
      title.append(link);

      const meta = createEl('div', {
        className: 'news-meta',
        text: new Date(article.date).toLocaleDateString()
      });

      const excerpt = createEl('p', { text: article.excerpt });

      item.append(title, meta, excerpt);
      list.append(item);
    });

    newsPage++;
    if (newsPage * pageSize >= newsCache.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'No more news';
    }
  } catch (err) {
    console.error(err);
  } finally {
    list.setAttribute('aria-busy', 'false');
  }
}

/* ------------------------------
   Render Partners (index.html)
------------------------------ */
async function renderPartners() {
  const grid = document.getElementById('partners-grid');
  if (!grid) return;

  try {
    const partners = await loadJSON('../data/partners.json');

    partners.forEach(partner => {
      const li = createEl('li', { role: 'listitem' });

      const link = createEl('a', {
        href: partner.url || '#',
        aria: { label: `${partner.name} partner` }
      });

      const imgSrc = partner.logo
        ? `../assets/images/partners/${partner.logo}`
        : `https://dummyimage.com/240x80/171722/ffffff.png&text=${encodeURIComponent(partner.name)}`;

      const img = createEl('img', {
        src: imgSrc,
        alt: `${partner.name} logo`,
        loading: 'lazy'
      });

      link.append(img);
      li.append(link);
      grid.append(li);
    });
  } catch (err) {
    console.error(err);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

/* ------------------------------
   Init on DOM ready
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  renderSchedule();
  renderRoster();

  const loadMoreBtn = document.getElementById('load-more-news');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', renderNewsPage);
    renderNewsPage();
  }

  renderPartners();
});
