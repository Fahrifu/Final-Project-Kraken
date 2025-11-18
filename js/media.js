

(function () {
  const grid = document.getElementById('media-grid');
  const platformSelect = document.getElementById('media-platform');
  const gameSelect = document.getElementById('media-game');
  const searchInput = document.getElementById('media-search');
  const loadMoreBtn = document.getElementById('media-load-more');

  if (!grid || !platformSelect || !gameSelect || !searchInput || !loadMoreBtn) return;

  let allMedia = [];
  let filteredMedia = [];
  let page = 0;
  const pageSize = 12;

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function createEl(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    if (options.href) el.href = options.href;
    if (options.target) el.target = options.target;
    if (options.alt !== undefined) el.alt = options.alt;
    if (options.loading) el.loading = options.loading;
    return el;
  }

  function buildFilters() {
    const platforms = new Set();
    const games = new Set();

    allMedia.forEach(item => {
      if (item.platform) platforms.add(item.platform);
      if (item.game) games.add(item.game);
    });

    // clear existing (keep "All")
    while (platformSelect.options.length > 1) platformSelect.remove(1);
    while (gameSelect.options.length > 1) gameSelect.remove(1);

    Array.from(platforms).sort().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      platformSelect.appendChild(opt);
    });

    Array.from(games).sort().forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      gameSelect.appendChild(opt);
    });
  }

  function matchesFilters(item, platform, game, term) {
    if (platform && item.platform !== platform) return false;
    if (game && item.game !== game) return false;

    if (!term) return true;

    const t = term.toLowerCase();
    const haystack = [
      item.title || '',
      item.game || '',
      item.platform || ''
    ].join(' ').toLowerCase();

    return haystack.includes(t);
  }

  function applyFilters() {
    const platform = platformSelect.value;
    const game = gameSelect.value;
    const term = searchInput.value.trim();

    filteredMedia = allMedia.filter(item => matchesFilters(item, platform, game, term));
    page = 0;
    grid.innerHTML = '';
    renderPage();
  }

  function renderCard(item) {
    const card = createEl('article', { className: 'media-card', role: 'article' });

    const thumbWrap = createEl('div', { className: 'media-thumb-wrap' });

    const img = createEl('img', { className: 'media-thumb' });
    const thumbSrc = item.thumbnail
      ? `../assets/images/banners/${item.thumbnail}`
      : `https://picsum.photos/seed/${encodeURIComponent(item.title || 'kraken')}/640/360`;
    img.src = thumbSrc;
    img.alt = item.title || '';
    img.loading = 'lazy';

    const platformChip = createEl('span', {
      className: 'media-chip platform',
      text: item.platform || 'Video'
    });

    thumbWrap.append(img, platformChip);

    if (item.game) {
      const gameChip = createEl('span', {
        className: 'media-chip game',
        text: item.game
      });
      thumbWrap.append(gameChip);
    }

    const body = createEl('div', { className: 'media-body' });

    const titleLink = createEl('a', {
      className: 'media-title',
      href: item.url || '#',
      text: item.title || 'Untitled'
    });
    titleLink.target = '_blank';

    const metaParts = [];
    if (item.type) metaParts.push(item.type);
    if (item.duration) metaParts.push(item.duration);
    const metaText = metaParts.join(' • ');

    const meta = createEl('div', {
      className: 'media-meta',
      text: metaText
    });

    body.append(titleLink, meta);

    const footer = createEl('div', { className: 'media-footer' });

    const watch = createEl('a', {
      href: item.url || '#',
      text: 'Watch'
    });
    watch.target = '_blank';

    const date = item.date
      ? createEl('span', {
          className: 'media-date',
          text: new Date(item.date).toLocaleDateString()
        })
      : null;

    footer.append(watch);
    if (date) footer.append(date);

    card.append(thumbWrap, body, footer);
    return card;
  }

  function renderPage() {
    const start = page * pageSize;
    const slice = filteredMedia.slice(start, start + pageSize);

    slice.forEach(item => {
      grid.append(renderCard(item));
    });

    grid.setAttribute('aria-busy', 'false');

    page++;
    if (page * pageSize >= filteredMedia.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'No more media';
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load more';
    }
  }

  async function init() {
    try {
      const data = await loadJSON('../data/media.json');
      // sort newest first if date exists
      allMedia = data.slice().sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
      });

      buildFilters();
      applyFilters();
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<p>Unable to load media at this time.</p>';
      grid.setAttribute('aria-busy', 'false');
      loadMoreBtn.disabled = true;
    }
  }

  /* Events */
  platformSelect.addEventListener('change', applyFilters);
  gameSelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', () => {
    clearTimeout(searchInput._timer);
    searchInput._timer = setTimeout(applyFilters, 200);
  });

  loadMoreBtn.addEventListener('click', renderPage);

  document.addEventListener('DOMContentLoaded', init);
})();
