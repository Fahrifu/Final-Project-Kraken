

(function () {
  const nextMatchCard = document.getElementById('next-match-card');
  const upcomingList = document.getElementById('upcoming-list');
  const resultsList = document.getElementById('results-list');
  const vodsList = document.getElementById('vods-list');

  if (!nextMatchCard || !upcomingList || !resultsList || !vodsList) return;

  /* Helpers */
  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
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

  function createEl(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    if (options.href) el.href = options.href;
    if (options.role) el.setAttribute('role', options.role);
    if (options.target) el.target = options.target;
    return el;
  }

  /* Next Match + Countdown */
  function renderNextMatch(schedule) {
    nextMatchCard.innerHTML = '';

    const now = new Date();
    const upcoming = schedule
      .filter(m => new Date(m.datetime) >= now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    if (!upcoming.length) {
      nextMatchCard.innerHTML = `
        <div class="next-match-title">No upcoming matches</div>
        <p class="next-match-meta">Check back soon for new fixtures.</p>
      `;
      nextMatchCard.setAttribute('aria-busy', 'false');
      return;
    }

    const match = upcoming[0];
    const title = createEl('div', {
      className: 'next-match-title',
      text: match.title
    });

    const meta1 = createEl('div', {
      className: 'next-match-meta',
      text: `${match.game} • ${match.league} • ${match.stage}`
    });

    const meta2 = createEl('div', {
      className: 'next-match-meta',
      text: `${fmtDate(match.datetime)} • ${match.venue}`
    });

    const countdown = createEl('div', {
      className: 'next-match-countdown',
      html: 'Starts in <span>–</span>'
    });
    countdown.id = 'next-match-countdown';

    const cta = createEl('a', {
      className: 'btn btn-primary',
      href: 'index.html#schedule',
      text: 'View full schedule'
    });

    nextMatchCard.append(title, meta1, meta2, countdown, cta);
    nextMatchCard.setAttribute('aria-busy', 'false');

    startCountdown(match.datetime, countdown.querySelector('span'));
  }

  function startCountdown(iso, spanEl) {
    if (!spanEl) return;
    function update() {
      const now = new Date();
      const target = new Date(iso);
      const diff = target - now;
      if (diff <= 0) {
        spanEl.textContent = 'Live or finished';
        clearInterval(timer);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      spanEl.textContent = `${days}d ${hours}h ${minutes}m`;
    }
    update();
    const timer = setInterval(update, 60000);
  }

  /* Upcoming List */
  function renderUpcoming(schedule) {
    upcomingList.innerHTML = '';

    const now = new Date();
    const upcoming = schedule
      .filter(m => new Date(m.datetime) >= now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    if (!upcoming.length) {
      upcomingList.innerHTML = '<p>No upcoming matches.</p>';
      upcomingList.setAttribute('aria-busy', 'false');
      return;
    }

    upcoming.forEach(match => {
      const card = createEl('article', { className: 'match-card', role: 'listitem' });

      const left = createEl('div');
      const right = createEl('div', { className: 'match-right' });

      const badges = createEl('div', {
        className: 'match-badges',
        html: `
          <span class="badge">${match.game}</span>
          <span class="badge">${match.league}</span>
          <span class="badge">${match.stage}</span>
        `
      });

      const title = createEl('div', {
        className: 'match-main-title',
        text: match.title
      });

      const meta = createEl('div', {
        className: 'match-meta-line',
        text: `${fmtDate(match.datetime)} • ${match.venue}`
      });

      left.append(badges, title, meta);

      const cta = createEl('a', {
        className: 'btn btn-outline',
        href: match.stream || '#',
        text: 'Watch'
      });

      right.append(cta);

      card.append(left, right);
      upcomingList.append(card);
    });

    upcomingList.setAttribute('aria-busy', 'false');
  }

  /* Results */
  function renderResults(results) {
    resultsList.innerHTML = '';

    if (!results.length) {
      resultsList.innerHTML = '<p>No recent results yet.</p>';
      resultsList.setAttribute('aria-busy', 'false');
      return;
    }

    results
      .slice()
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
      .forEach(match => {
        const card = createEl('article', { className: 'match-card', role: 'listitem' });

        const left = createEl('div');
        const right = createEl('div', { className: 'match-right' });

        const resultClass = match.result === 'Win' ? 'badge-result-win' : 'badge-result-loss';

        const badges = createEl('div', {
          className: 'match-badges',
          html: `
            <span class="badge">${match.game}</span>
            <span class="badge">${match.league}</span>
            <span class="badge">${match.stage}</span>
            <span class="badge ${resultClass}">${match.result}</span>
          `
        });

        const title = createEl('div', {
          className: 'match-main-title',
          text: match.title
        });

        const meta = createEl('div', {
          className: 'match-meta-line',
          text: `${fmtDate(match.datetime)} • vs ${match.opponent}`
        });

        const maps = createEl('div', { className: 'map-list' });
        if (match.maps && match.maps.length) {
          maps.textContent = 'Maps: ' + match.maps.map(m => `${m.name} (${m.score})`).join(' • ');
        }

        left.append(badges, title, meta, maps);

        const score = createEl('div', {
          className: 'match-score',
          text: match.score || ''
        });

        const vod = createEl('a', {
          className: 'btn btn-outline',
          href: match.vodUrl || '#',
          text: 'Watch VOD',
          target: '_blank'
        });

        right.append(score, vod);

        card.append(left, right);
        resultsList.append(card);
      });

    resultsList.setAttribute('aria-busy', 'false');
  }

  /* VODs */
  function renderVods(media) {
    vodsList.innerHTML = '';

    const vods = media || [];
    if (!vods.length) {
      vodsList.innerHTML = '<p>No VODs available yet.</p>';
      vodsList.setAttribute('aria-busy', 'false');
      return;
    }

    vods.forEach(item => {
      const card = createEl('article', { className: 'vod-card', role: 'listitem' });

      const platform = createEl('div', {
        className: 'vod-platform',
        text: item.platform
      });

      const title = createEl('a', {
        className: 'vod-title',
        href: item.url || '#',
        text: item.title
      });
      title.target = '_blank';

      const meta = createEl('div', {
        className: 'vod-meta',
        text: item.game ? `Game: ${item.game}` : ''
      });

      card.append(platform, title, meta);
      vodsList.append(card);
    });

    vodsList.setAttribute('aria-busy', 'false');
  }

  /* Tabs */
  function initTabs() {
    const tabs = Array.from(document.querySelectorAll('.mc-tab'));
    const panels = {
      upcoming: document.getElementById('panel-upcoming'),
      results: document.getElementById('panel-results'),
      vods: document.getElementById('panel-vods')
    };

    function show(key) {
      tabs.forEach(tab => {
        const active = tab.id === `tab-${key}`;
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
      });

      Object.entries(panels).forEach(([k, panel]) => {
        if (!panel) return;
        panel.hidden = k !== key;
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.id.replace('tab-', '');
        show(key);
      });
    });

    // Keyboard support
    document.querySelector('.mc-tabs')?.addEventListener('keydown', (e) => {
      const currentIndex = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
      if (currentIndex === -1) return;

      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowRight') {
        const next = Math.min(currentIndex + 1, tabs.length - 1);
        tabs[next].click();
        tabs[next].focus();
      } else if (e.key === 'ArrowLeft') {
        const prev = Math.max(currentIndex - 1, 0);
        tabs[prev].click();
        tabs[prev].focus();
      } else if (e.key === 'Home') {
        tabs[0].click();
        tabs[0].focus();
      } else if (e.key === 'End') {
        const last = tabs.length - 1;
        tabs[last].click();
        tabs[last].focus();
      }
    });
  }

  /* Init */
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const [schedule, results, media] = await Promise.all([
        loadJSON('../data/schedule.json'),
        loadJSON('../data/results.json'),
        loadJSON('../data/media.json')
      ]);

      renderNextMatch(schedule);
      renderUpcoming(schedule);
      renderResults(results);
      renderVods(media);
    } catch (err) {
      console.error(err);
      nextMatchCard.setAttribute('aria-busy', 'false');
      upcomingList.setAttribute('aria-busy', 'false');
      resultsList.setAttribute('aria-busy', 'false');
      vodsList.setAttribute('aria-busy', 'false');
    }

    initTabs();
  });
})();
