/* ----------------------------------------------------
   UiA Kraken Esports — Teams Page Logic (teams.js)
   - Loads /data/teams.json
   - Tabbed teams by title
   - Panels with roster, staff, achievements
   - Deep-linking via hash (e.g. teams.html#valorant)
   - Player cards link to players/profile.html?handle=...
-------------------------------------------------------*/

(async function () {
  const tabsWrap = document.querySelector('.tabs');
  const panelsWrap = document.getElementById('panels');
  if (!tabsWrap || !panelsWrap) return;

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  let TEAMS = [];

  try {
    TEAMS = await loadJSON('../data/teams.json');
  } catch (err) {
    console.error(err);
    panelsWrap.setAttribute('aria-busy', 'false');
    return;
  }

  function makeTab(team, isActive) {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.id = `tab-${team.key}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.setAttribute('aria-controls', `panel-${team.key}`);
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
    btn.textContent = team.title;

    btn.addEventListener('click', () => selectTab(team.key));

    return btn;
  }

  // 🔗 Player cards now link to profile.html
  function makePlayerCard(player) {
    // Anchor instead of article, so the whole card is clickable
    const card = document.createElement('a');
    card.className = 'card player';
    card.href = `players/profile.html?handle=${encodeURIComponent(player.handle)}`;
    card.setAttribute('aria-label', `View profile for ${player.handle}`);

    const img = document.createElement('img');
    img.className = 'avatar';
    img.alt = `${player.name} avatar`;
    img.loading = 'lazy';

    const localPath = `../assets/images/players/${player.handle.replace(/\s+/g, '')}.jpg`;
    img.src = player.avatar && player.avatar.trim() ? player.avatar : localPath;

    img.onerror = () => {
      img.onerror = null;
      img.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(player.handle)}&radius=10`;
    };

    const info = document.createElement('div');
    const h = document.createElement('div');
    h.className = 'handle';
    h.textContent = player.handle;

    const r = document.createElement('div');
    r.className = 'role';
    r.textContent = player.role;

    info.append(h, r);
    card.append(img, info);

    return card;
  }

  function makePanel(team, isActive) {
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.id = `panel-${team.key}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${team.key}`);
    panel.hidden = !isActive;

    const header = document.createElement('div');
    header.className = 'team-header';

    const badge = document.createElement('img');
    badge.className = 'team-badge';
    badge.alt = `${team.title} badge`;
    badge.loading = 'lazy';
    badge.src = team.badge
      ? `../assets/images/teams/${team.badge}`
      : `https://dummyimage.com/160x160/171722/ffffff.png&text=${encodeURIComponent(team.title)}`;

    const titleWrap = document.createElement('div');
    titleWrap.className = 'team-title';
    titleWrap.innerHTML = `
      <h3>${team.title}</h3>
      <div class="team-meta">${team.status} • ${team.coach}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'team-actions';
    (team.ctas || []).forEach(cta => {
      const a = document.createElement('a');
      a.className = 'btn btn-outline';
      a.href = cta.href;
      a.textContent = cta.label;
      actions.appendChild(a);
    });

    header.append(badge, titleWrap, actions);
    panel.append(header);

    const rosterHead = document.createElement('div');
    rosterHead.className = 'subhead';
    rosterHead.textContent = 'Active Roster';
    panel.append(rosterHead);

    const rosterGrid = document.createElement('div');
    rosterGrid.className = 'grid';
    (team.roster || []).forEach(player => {
      rosterGrid.append(makePlayerCard(player));
    });
    panel.append(rosterGrid);

    if (team.staff && team.staff.length) {
      const staffHead = document.createElement('div');
      staffHead.className = 'subhead';
      staffHead.textContent = 'Staff';
      panel.append(staffHead);

      const staffWrap = document.createElement('div');
      staffWrap.className = 'staff';
      team.staff.forEach(member => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = `${member.title}: ${member.name}`;
        staffWrap.appendChild(badge);
      });
      panel.append(staffWrap);
    }

    if (team.achievements && team.achievements.length) {
      const achHead = document.createElement('div');
      achHead.className = 'subhead';
      achHead.textContent = 'Recent Achievements';
      panel.append(achHead);

      const ul = document.createElement('ul');
      ul.className = 'achievements';
      team.achievements.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
      panel.append(ul);
    }

    return panel;
  }

  function render(initialKey) {
    tabsWrap.innerHTML = '';
    panelsWrap.innerHTML = '';

    TEAMS.forEach((team, index) => {
      const isActive = initialKey ? team.key === initialKey : index === 0;
      tabsWrap.appendChild(makeTab(team, isActive));
      panelsWrap.appendChild(makePanel(team, isActive));
    });

    panelsWrap.setAttribute('aria-busy', 'false');
  }

  function selectTab(key) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

    tabs.forEach(tab => {
      const active = tab.id === `tab-${key}`;
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });

    panels.forEach(panel => {
      panel.hidden = panel.id !== `panel-${key}`;
    });

    if (history.replaceState) {
      history.replaceState(null, '', `#${key}`);
    } else {
      window.location.hash = key;
    }
  }

  tabsWrap.addEventListener('keydown', (e) => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
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

  const hashKey = window.location.hash.replace('#', '') || null;
  const validKey = TEAMS.some(t => t.key === hashKey) ? hashKey : (TEAMS[0] && TEAMS[0].key);
  render(validKey);

  // JSON-LD structured data
  TEAMS.forEach(team => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      "name": `UiA Kraken — ${team.title}`,
      "sport": "Esports",
      "url": window.location.origin + window.location.pathname + `#${team.key}`,
      "member": (team.roster || []).map(player => ({
        "@type": "Person",
        "name": player.name,
        "additionalName": player.handle,
        "jobTitle": player.role
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
})();
