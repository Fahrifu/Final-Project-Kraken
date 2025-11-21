/* ----------------------------------------------------
   UiA Kraken — Board & Stakeholders Logic (board.js)
   - Loads /data/leadership.json
   - Splits into board vs stakeholders
-------------------------------------------------------*/

(function () {
  const boardGrid = document.getElementById('board-grid');
  const stakeholderGrid = document.getElementById('stakeholder-grid');
  if (!boardGrid || !stakeholderGrid) return;

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

  function renderCard(person) {
    const card = createEl('article', { className: 'board-card', role: 'article' });

    const photoWrap = createEl('div', { className: 'board-photo-wrap' });
    const img = createEl('img', {
      className: 'board-photo',
      alt: person.name,
      loading: 'lazy'
    });

    const src = person.photo
      ? `../assets/images/banners/${person.photo}`
      : `https://picsum.photos/seed/${encodeURIComponent(person.name)}/600/600`;

    img.src = src;
    photoWrap.append(img);

    const body = createEl('div', { className: 'board-card-body' });

    const nameEl = createEl('div', { className: 'board-name', text: person.name });
    const roleEl = createEl('div', { className: 'board-role', text: person.role });

    const bioEl = createEl('p', { text: person.bio || '' });

    const focusWrap = createEl('div', { className: 'board-focus' });
    (person.focus || []).forEach(item => {
      const badge = createEl('span', { className: 'badge', text: item });
      focusWrap.append(badge);
    });

    // simple socials line
    const socialsWrap = createEl('div', { className: 'player-socials' });
    if (person.socials) {
      if (person.socials.linkedin) {
        socialsWrap.append(createEl('a', {
          href: person.socials.linkedin,
          text: 'LinkedIn',
          target: '_blank'
        }));
      }
      if (person.socials.website) {
        socialsWrap.append(createEl('a', {
          href: person.socials.website,
          text: 'Website',
          target: '_blank'
        }));
      }
    }

    body.append(nameEl, roleEl, bioEl, focusWrap, socialsWrap);
    card.append(photoWrap, body);

    return card;
  }

  async function init() {
    try {
      const leadership = await loadJSON('../data/leadership.json');

      const board = leadership.filter(p => p.type === 'board');
      const stakeholders = leadership.filter(p => p.type === 'stakeholder');

      board.forEach(person => boardGrid.append(renderCard(person)));
      stakeholders.forEach(person => stakeholderGrid.append(renderCard(person)));

      boardGrid.setAttribute('aria-busy', 'false');
      stakeholderGrid.setAttribute('aria-busy', 'false');
    } catch (err) {
      console.error(err);
      boardGrid.innerHTML = '<p>Unable to load leadership information.</p>';
      stakeholderGrid.innerHTML = '';
      boardGrid.setAttribute('aria-busy', 'false');
      stakeholderGrid.setAttribute('aria-busy', 'false');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
