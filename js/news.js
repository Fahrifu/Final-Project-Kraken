/* ----------------------------------------------------
   UiA Kraken — News Hub Logic (news.js)
   - Loads /data/news.json
   - Category filter + search
   - "Load more" pagination
-------------------------------------------------------*/

(function () {
  const grid = document.getElementById('news-grid');
  const categorySelect = document.getElementById('news-category');
  const searchInput = document.getElementById('news-search');
  const loadMoreBtn = document.getElementById('news-load-more');

  if (!grid || !categorySelect || !searchInput || !loadMoreBtn) return;

  let allNews = [];
  let filteredNews = [];
  let page = 0;
  const pageSize = 9;

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

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function buildCategories() {
    const set = new Set();
    allNews.forEach(item => {
      const cat = item.category || 'News';
      set.add(cat);
    });

    // Clear existing except "All"
    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }

    Array.from(set).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  function matchesFilters(item, category, term) {
    const cat = item.category || 'News';
    if (category && cat !== category) return false;
    if (!term) return true;

    const t = term.toLowerCase();
    const haystack = [
      item.title || '',
      item.excerpt || '',
      cat
    ].join(' ').toLowerCase();

    return haystack.includes(t);
  }

  function applyFilters() {
    const category = categorySelect.value;
    const term = searchInput.value.trim();

    filteredNews = allNews.filter(item => matchesFilters(item, category, term));
    page = 0;
    grid.innerHTML = '';
    renderPage();
  }

  function renderCard(item) {
    const article = document.createElement('article');
    article.className = 'news-card';
    article.setAttribute('role', 'article');

    const img = document.createElement('img');
    img.className = 'news-card-thumb';

    const thumbSrc = item.image
      ? `../assets/images/banners/${item.image}`
      : `https://picsum.photos/seed/${encodeURIComponent(item.title)}/600/400`;

    img.src = thumbSrc;
    img.alt = item.title || '';
    img.loading = 'lazy';

    const body = createEl('div', { className: 'news-card-body' });

    const metaLine = createEl('div', { className: 'news-card-meta' });
    const category = createEl('span', {
      className: 'news-card-category',
      text: item.category || 'News'
    });
    const date = createEl('span', {
      className: 'news-card-date',
      text: fmtDate(item.date)
    });
    metaLine.append(category, date);

    const title = createEl('h2');
    const link = createEl('a', {
      href: item.url || '#',
      text: item.title || 'Untitled'
    });
    title.append(link);

    const excerpt = createEl('p', {
      className: 'news-card-excerpt',
      text: item.excerpt || ''
    });

    body.append(metaLine, title, excerpt);

    const footer = createEl('div', { className: 'news-card-footer' });
    const readMore = createEl('a', {
      href: item.url || '#',
      text: 'Read more'
    });
    const gameTag = item.game
      ? createEl('span', { className: 'news-card-game', text: item.game })
      : null;

    footer.append(readMore);
    if (gameTag) footer.append(gameTag);

    article.append(img, body, footer);
    return article;
  }

  function renderPage() {
    const start = page * pageSize;
    const slice = filteredNews.slice(start, start + pageSize);

    slice.forEach(item => {
      grid.append(renderCard(item));
    });

    grid.setAttribute('aria-busy', 'false');

    page++;
    if (page * pageSize >= filteredNews.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'No more articles';
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load more';
    }
  }

  async function init() {
    try {
      const data = await loadJSON('../data/news.json');
      // sort newest first
      allNews = data
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      buildCategories();
      applyFilters();
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<p>Unable to load news at this time.</p>';
      grid.setAttribute('aria-busy', 'false');
      loadMoreBtn.disabled = true;
    }
  }

  /* Events */
  categorySelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', () => {
    // simple debounce: re-apply after short pause
    clearTimeout(searchInput._timer);
    searchInput._timer = setTimeout(applyFilters, 200);
  });

  loadMoreBtn.addEventListener('click', renderPage);

  document.addEventListener('DOMContentLoaded', init);
})();
