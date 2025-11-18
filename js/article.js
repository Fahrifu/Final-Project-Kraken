/* ----------------------------------------------------
   UiA Kraken — Article Template Logic (article.js)
   - Reads ?slug= from URL
   - Loads /data/news.json
   - Renders selected article
-------------------------------------------------------*/

(function () {
  const heroInner = document.getElementById('article-hero-inner');
  const content = document.getElementById('article-content');
  const breadcrumbTitle = document.getElementById('article-breadcrumb-title');

  if (!heroInner || !content) return;

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function estimateReadingTime(text) {
    const words = text.trim().split(/\s+/).length || 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }

  function buildBody(article) {
    // body as array of paragraphs (preferred)
    const paragraphs = Array.isArray(article.body) ? article.body : [article.excerpt || ''];

    // optional: first paragraph as lead
    paragraphs.forEach((para, index) => {
      const p = document.createElement('p');
      p.textContent = para;
      if (index === 0) p.classList.add('lead');
      content.appendChild(p);
    });
  }

  function renderArticle(article) {
    // Set document title & meta
    if (article.title) {
      document.title = `${article.title} — UiA Kraken Esports`;
    }

    if (breadcrumbTitle) breadcrumbTitle.textContent = article.title || 'Article';

    // Hero
    heroInner.innerHTML = '';

    const left = document.createElement('div');
    const right = document.createElement('div');

    const category = document.createElement('div');
    category.className = 'article-category';
    category.textContent = article.category || 'News';

    const title = document.createElement('h1');
    title.textContent = article.title || 'Untitled';

    const metaLine = document.createElement('div');
    metaLine.className = 'article-meta';
    const date = new Date(article.date);
    const dateStr = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const game = article.game ? ` • ${article.game}` : '';
    metaLine.textContent = `${dateStr}${game}`;

    // reading time
    const fullText = (Array.isArray(article.body) ? article.body.join(' ') : article.excerpt || '');
    const reading = document.createElement('div');
    reading.className = 'article-reading-time';
    reading.textContent = estimateReadingTime(fullText);

    left.append(category, title, metaLine, reading);

    // Thumb
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'article-hero-thumb-wrap';

    const img = document.createElement('img');
    img.className = 'article-hero-thumb';
    const thumbSrc = article.image
      ? `../assets/images/banners/${article.image}`
      : `https://picsum.photos/seed/${encodeURIComponent(article.title || 'kraken')}/800/500`;
    img.src = thumbSrc;
    img.alt = article.title || '';
    img.loading = 'lazy';

    thumbWrap.appendChild(img);
    right.appendChild(thumbWrap);

    heroInner.append(left, right);
    heroInner.setAttribute('aria-busy', 'false');

    // Body
    content.innerHTML = '';
    buildBody(article);
  }

  function renderNotFound() {
    heroInner.setAttribute('aria-busy', 'false');
    heroInner.innerHTML = `
      <div>
        <h1>Article not found</h1>
        <p class="lead">We couldn’t find this article. It may have been moved or removed.</p>
      </div>
    `;
    content.innerHTML = `
      <p><a href="news.html" class="btn btn-outline">Back to all news</a></p>
    `;
  }

  async function init() {
    const slug = getSlug();
    if (!slug) {
      renderNotFound();
      return;
    }

    try {
      const data = await loadJSON('../data/news.json');
      const article = data.find(item => item.slug === slug);

      if (!article) {
        renderNotFound();
        return;
      }

      renderArticle(article);
    } catch (err) {
      console.error(err);
      renderNotFound();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
