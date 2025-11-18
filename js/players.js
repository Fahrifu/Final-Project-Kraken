/* ----------------------------------------------------
   UiA Kraken — Player Profile Logic (players.js)
   - Reads ?handle= from URL
   - Loads /data/players.json
   - Renders hero + stats + socials + highlights
-------------------------------------------------------*/

(function () {
  const heroInner = document.getElementById('player-hero-inner');
  const layout = document.getElementById('player-layout');
  if (!heroInner || !layout) return;

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function getHandle() {
    const params = new URLSearchParams(window.location.search);
    return params.get('handle');
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

  function renderNotFound() {
    heroInner.innerHTML = `
      <div>
        <div class="player-main-meta">
          <span>Player</span>
        </div>
        <div class="player-handle">Unknown</div>
        <div class="player-name">Not found</div>
        <p class="player-tagline">This player profile could not be loaded.</p>
      </div>
    `;
    heroInner.setAttribute('aria-busy', 'false');

    layout.innerHTML = `
      <p><a href="../index.html#roster" class="btn btn-outline">Back to roster</a></p>
    `;
  }

  function renderPlayer(player) {
    // Document title
    document.title = `${player.handle} — UiA Kraken Esports`;

    // Hero
    heroInner.innerHTML = '';

    const left = document.createElement('div');
    const right = document.createElement('div');

    const meta = createEl('div', {
      className: 'player-main-meta',
      html: `
        <span>${player.game || 'Esports'}</span>
        <span>• ${player.role || ''}</span>
        ${player.country ? `<span>• ${player.country}</span>` : ''}
      `
    });

    const handleEl = createEl('div', {
      className: 'player-handle',
      text: player.handle
    });

    const nameEl = createEl('div', {
      className: 'player-name',
      text: player.name || ''
    });

    const tagline = createEl('p', {
      className: 'player-tagline',
      text: player.bio || ''
    });

    // Socials
    const socialsWrap = createEl('div', { className: 'player-socials' });
    if (player.socials) {
      if (player.socials.twitter) {
        socialsWrap.append(
          createEl('a', { href: player.socials.twitter, text: 'Twitter', target: '_blank' })
        );
      }
      if (player.socials.twitch) {
        socialsWrap.append(
          createEl('a', { href: player.socials.twitch, text: 'Twitch', target: '_blank' })
        );
      }
      if (player.socials.youtube) {
        socialsWrap.append(
          createEl('a', { href: player.socials.youtube, text: 'YouTube', target: '_blank' })
        );
      }
    }

    left.append(meta, handleEl, nameEl, tagline, socialsWrap);

// Avatar
const avatarWrap = createEl('div', { className: 'player-hero-avatar-wrap' });
const img = createEl('img', {
  className: 'player-hero-avatar',
  alt: `${player.name || player.handle} avatar`,
  loading: 'lazy'
});

// If avatar is set, treat it as a filename under /assets/images/players
let src;
if (player.avatar && player.avatar.trim()) {
  src = `../../assets/images/players/${player.avatar.trim()}`;
} else {
  // Fallback to handle-based filename
  src = `../../assets/images/players/${player.handle.replace(/\s+/g, '')}.jpg`;
}
img.src = src;

// Final fallback: DiceBear if file missing
img.onerror = () => {
  img.onerror = null;
  img.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(player.handle)}&radius=10`;
};

avatarWrap.append(img);
right.append(avatarWrap);


    heroInner.append(left, right);
    heroInner.setAttribute('aria-busy', 'false');

    // Content layout
    layout.innerHTML = '';

    const main = document.createElement('div');
    main.className = 'player-main';

    const sidebar = document.createElement('div');
    sidebar.className = 'player-sidebar';

    // Bio / more text
    const bioBlock = createEl('div', { className: 'player-bio' });
    if (player.bio) {
      const p = document.createElement('p');
      p.textContent = player.bio;
      bioBlock.append(p);
    }
    main.append(bioBlock);

    // Highlights
    if (player.highlights && player.highlights.length) {
      const highlights = createEl('section', { className: 'player-highlights' });
      const h3 = document.createElement('h3');
      h3.textContent = 'Highlights';
      highlights.append(h3);

      const ul = document.createElement('ul');
      player.highlights.forEach(h => {
        const li = document.createElement('li');
        const a = createEl('a', {
          href: h.url || '#',
          text: h.title || 'Highlight',
          target: '_blank'
        });
        li.append(a);
        if (h.platform) {
          li.append(document.createTextNode(` (${h.platform})`));
        }
        ul.append(li);
      });

      highlights.append(ul);
      main.append(highlights);
    }

    // Sidebar: stats
    if (player.stats && Object.keys(player.stats).length) {
      const card = createEl('div', { className: 'player-sidebar-card' });
      const title = createEl('h3', { text: 'Stats' });
      const grid = createEl('div', { className: 'player-stats-grid' });

      Object.entries(player.stats).forEach(([label, value]) => {
        const labelEl = createEl('div', {
          className: 'player-stat-label',
          text: label.toUpperCase()
        });
        const valueEl = createEl('div', {
          className: 'player-stat-value',
          text: value
        });
        grid.append(labelEl, valueEl);
      });

      card.append(title, grid);
      sidebar.append(card);
    }

    // Sidebar: tags
    if (player.tags && player.tags.length) {
      const card = createEl('div', { className: 'player-sidebar-card' });
      const title = createEl('h3', { text: 'Profile' });
      const tagsWrap = createEl('div', { className: 'player-tags' });
      player.tags.forEach(t => {
        const badge = createEl('span', { className: 'badge', text: t });
        tagsWrap.append(badge);
      });
      card.append(title, tagsWrap);
      sidebar.append(card);
    }

    // Sidebar: agent/champion pool
    if (player.agentPool && player.agentPool.length) {
      const card = createEl('div', { className: 'player-sidebar-card' });
      const title = createEl('h3', { text: 'Pool' });
      const list = createEl('div', { className: 'player-agents' });
      player.agentPool.forEach(a => {
        const badge = createEl('span', { className: 'badge', text: a });
        list.append(badge);
      });
      card.append(title, list);
      sidebar.append(card);
    }

    layout.append(main, sidebar);
  }

  async function init() {
    const handle = getHandle();
    if (!handle) {
      renderNotFound();
      return;
    }

    try {
      const players = await loadJSON('../../data/players.json');
      const player = players.find(p => p.handle.toLowerCase() === handle.toLowerCase());
      if (!player) {
        renderNotFound();
        return;
      }
      renderPlayer(player);
    } catch (err) {
      console.error(err);
      renderNotFound();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
