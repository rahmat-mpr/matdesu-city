// Card rendering, quest badges and play overlay. DOM only; no three.js here.
import { profile, experience, projects, archive, sections, contact } from '../data/projects.js';

const STORE_KEY = 'matdesu-city-visited-v1';

// tiny DOM helper: h('div', { class: 'x', text: '..' }, child, 'text')
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c);
  return el;
}

const extLink = (l, cls) => h('a', { href: l.url, target: '_blank', rel: 'noopener', class: cls }, l.label);

// ---------- quest (visited islands) ----------
export function createQuest(ids) {
  const visited = new Set();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) for (const id of JSON.parse(raw)) if (ids.includes(id)) visited.add(id);
  } catch (e) {
    /* storage unavailable or corrupt: start fresh */
  }
  const listeners = [];
  return {
    total: ids.length,
    has: (id) => visited.has(id),
    count: () => visited.size,
    visit(id) {
      if (visited.has(id)) return false;
      visited.add(id);
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify([...visited]));
      } catch (e) {
        /* works without storage */
      }
      listeners.forEach((fn) => fn(id));
      return true;
    },
    onChange: (fn) => listeners.push(fn),
  };
}

// ---------- play overlay (WebGL builds) ----------
export function createPlayOverlay({ onOpen, onClose }) {
  let root = null;
  function close() {
    if (!root) return;
    root.remove(); // removing the iframe unloads the game
    root = null;
    onClose?.();
  }
  function open(play, title) {
    if (root) return;
    const narrow = window.matchMedia('(max-width: 699px), (pointer: coarse)').matches;
    const frame = h('iframe', {
      src: play.src,
      title: `Play ${title}`,
      allow: 'autoplay; fullscreen; gamepad',
      allowfullscreen: '',
      loading: 'lazy',
    });
    const box = h('div', { class: 'play-frame' }, frame);
    if (play.aspect) box.style.aspectRatio = play.aspect;
    root = h(
      'div',
      { class: 'play-overlay', role: 'dialog', 'aria-label': `Play ${title}` },
      h(
        'div',
        { class: 'play-bar' },
        h('strong', { text: title }),
        narrow ? h('span', { class: 'play-note', text: 'Best played on desktop' }) : null,
        play.note ? h('span', { class: 'play-note', text: play.note }) : null,
        h('button', { type: 'button', class: 'play-close', 'aria-label': 'Close game', onclick: close, text: '✕' })
      ),
      box
    );
    document.body.append(root);
    onOpen?.();
  }
  return { open, close, isOpen: () => !!root };
}

// ---------- card ----------
export function createCardUI({ islands, quest, els, play }) {
  const { title, desc, content, scroll } = els;
  let current = null;
  let detailId = null;
  let media = null; // element holding an iframe/video, removed on leave

  const nameOf = (id) => islands.find((i) => i.id === id)?.name ?? id;

  function dropMedia() {
    if (!media) return;
    const v = media.querySelector('video');
    if (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
    media.remove(); // removing iframe stops playback
    media = null;
  }

  function creditLine(p) {
    return [p.role, p.studio, p.period].filter(Boolean).join(' · ');
  }

  function tile(p) {
    return h(
      'button',
      { type: 'button', class: 'tile', onclick: () => showDetail(p.id) },
      h('img', { src: p.image, alt: p.imageAlt, loading: 'lazy', class: p.fit === 'contain' ? 'contain' : null }),
      h(
        'span',
        { class: 'tile-text' },
        h('b', { text: p.title }),
        h('small', { text: creditLine(p) }),
        h('span', { text: p.blurb })
      ),
      h('span', { class: 'tile-go', 'aria-hidden': 'true', text: '›' })
    );
  }

  function archiveList(ids) {
    return h(
      'ul',
      { class: 'archive' },
      ids.map((id) => {
        const a = archive[id];
        return h(
          'li',
          null,
          h('b', { text: a.title }),
          h('span', { class: 'note', text: a.note }),
          h('span', { class: 'alinks' }, a.links.map((l) => extLink(l)))
        );
      })
    );
  }

  function facts(list) {
    return h(
      'div',
      { class: 'facts' },
      list.map((f) => h('div', null, h('h4', { text: f.title }), h('p', { text: f.text })))
    );
  }

  function profileBlock() {
    return h(
      'div',
      { class: 'profile' },
      h(
        'div',
        { class: 'profile-head' },
        h('img', { src: profile.portrait, alt: profile.portraitAlt, loading: 'lazy' }),
        h('div', null, h('h3', { text: profile.name }), h('p', { class: 'headline', text: profile.headline }), h('p', { class: 'loc', text: profile.location }))
      ),
      h('p', { text: profile.intro }),
      h('div', { class: 'links' }, extLink({ label: 'Download CV (PDF)', url: contact.cv }, 'btn primary')),
      facts([
        { title: 'Skills', text: profile.skills },
        { title: 'QA', text: profile.qa },
      ]),
      h('h4', { class: 'sect', text: 'Experience' }),
      h(
        'ul',
        { class: 'timeline' },
        experience.map((e) =>
          h(
            'li',
            null,
            h('span', { class: 'when', text: e.when }),
            h(
              'span',
              null,
              e.studio ? h('b', { text: e.studio }) : null,
              h('small', { text: [e.role, e.place].filter(Boolean).join(' · ') })
            )
          )
        )
      )
    );
  }

  function contactBlock() {
    const done = quest.count() >= quest.total;
    const badges = h(
      'div',
      { class: 'badges' },
      islands.map((i) => h('span', { class: quest.has(i.id) ? 'badge got' : 'badge', text: `${quest.has(i.id) ? '✓' : '○'} ${i.name}` }))
    );
    const buttons = h(
      'div',
      { class: 'links' },
      h('a', { class: 'btn primary', href: `mailto:${contact.email}`, text: `Email ${contact.email}` }),
      extLink({ label: 'CV (PDF)', url: contact.cv }, 'btn'),
      extLink({ label: 'LinkedIn', url: contact.linkedin }, 'btn'),
      extLink({ label: 'Classic portfolio ↗', url: contact.classic }, 'btn')
    );
    let reward;
    if (done) {
      reward = h(
        'div',
        { class: 'contact-card reveal' },
        h('span', { class: 'spark s1', text: '✦' }),
        h('span', { class: 'spark s2', text: '★' }),
        h('span', { class: 'spark s3', text: '✦' }),
        h('span', { class: 'spark s4', text: '★' }),
        h('b', { class: 'cc-title', text: '🏅 All badges collected!' }),
        h('h3', { text: profile.name }),
        h('p', { class: 'headline', text: profile.headline }),
        h('p', null, h('a', { href: `mailto:${contact.email}`, text: contact.email })),
        h('p', null, extLink({ label: 'linkedin.com/in/rahmatmpr', url: contact.linkedin }))
      );
    } else {
      reward = h('p', { class: 'locked', text: `Visit all ${quest.total} islands to unlock the contact card (${quest.total - quest.count()} to go).` });
    }
    return h(
      'div',
      null,
      buttons,
      h('h4', { class: 'sect', text: `Quest: ${quest.count()}/${quest.total} badges` }),
      badges,
      reward
    );
  }

  function renderList() {
    dropMedia();
    detailId = null;
    content.replaceChildren();
    const isl = current;
    title.textContent = isl.name;
    desc.textContent = isl.description;
    if (isl.section === 'profile') content.append(profileBlock());
    else if (isl.section === 'contact') content.append(contactBlock());
    else if (isl.section && sections[isl.section]) content.append(facts(sections[isl.section].facts));
    if (isl.projects?.length) {
      content.append(h('h4', { class: 'sect', text: 'Projects' }), h('div', { class: 'tiles' }, isl.projects.map((id) => tile(projects[id]))));
    }
    if (isl.archive?.length) content.append(h('h4', { class: 'sect', text: 'More projects' }), archiveList(isl.archive));
    scroll.scrollTop = 0;
  }

  function videoEl(v, titleText) {
    if (v.type === 'mp4') {
      return h('video', { src: v.src, controls: '', playsinline: '', preload: 'none' });
    }
    return h('iframe', {
      src: v.src,
      title: `${titleText} video`,
      allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
      allowfullscreen: '',
      loading: 'lazy',
      class: v.type === 'instagram' ? 'ig' : null,
    });
  }

  function showDetail(id) {
    const p = projects[id];
    dropMedia();
    detailId = id;
    content.replaceChildren();
    const kids = [h('button', { type: 'button', class: 'back', onclick: renderList, text: '← Back' })];

    if (p.gallery?.length) {
      kids.push(
        h(
          'div',
          { class: 'title-row' },
          h('img', { src: p.image, alt: p.imageAlt }),
          h('div', null, h('h3', { text: p.title }), h('p', { class: 'credit', text: creditLine(p) }))
        ),
        h('div', { class: 'gallery', tabindex: '0', 'aria-label': `${p.title} screenshots` }, p.gallery.map((g) => h('img', { src: g.src, alt: g.alt, loading: 'lazy' }))),
        h('p', { class: 'gallery-hint', text: 'Swipe or scroll for more screenshots' })
      );
    } else {
      kids.push(h('img', { class: p.fit === 'contain' ? 'hero contain' : 'hero', src: p.image, alt: p.imageAlt }), h('h3', { text: p.title }), h('p', { class: 'credit', text: creditLine(p) }));
    }

    kids.push(h('p', { text: p.description }));
    if (p.stats) kids.push(h('div', { class: 'stats' }, p.stats.map((s) => h('div', null, h('b', { text: s.value }), h('span', { text: s.label })))));
    if (p.roles) kids.push(h('ul', { class: 'duties' }, p.roles.map((r) => h('li', null, h('b', { text: r.title }), h('span', { text: r.text })))));
    if (p.tags?.length) kids.push(h('div', { class: 'chips' }, p.tags.map((t) => h('span', { text: t }))));

    if (p.video) {
      media = h('div', { class: p.video.type === 'instagram' ? 'media media-ig' : 'media' }, videoEl(p.video, p.title));
      kids.push(media);
    }
    const links = h('div', { class: 'links' });
    if (p.play) links.append(h('button', { type: 'button', class: 'btn primary', onclick: () => play.open(p.play, p.title), text: '▶ Play' }));
    for (const l of p.links ?? []) links.append(extLink(l, l.primary && !p.play ? 'btn primary' : 'btn'));
    if (links.children.length) kids.push(links);

    content.append(...kids);
    scroll.scrollTop = 0;
  }

  return {
    show(isl) {
      current = isl;
      renderList();
    },
    // true if a layer (play overlay, detail view) consumed the Escape / back action
    back() {
      if (play.isOpen()) {
        play.close();
        return true;
      }
      if (detailId) {
        renderList();
        return true;
      }
      return false;
    },
    // card closing: stop media and any game
    reset() {
      play.close();
      dropMedia();
      detailId = null;
    },
    refreshIfOpen() {
      if (current && !detailId) renderList();
    },
    nameOf,
  };
}
