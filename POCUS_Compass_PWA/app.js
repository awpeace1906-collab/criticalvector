// ===== POCUS Field Guide — App Logic =====

const APP_NAME = 'POCUS Field Guide';

let MANIFEST = null;
let SECTIONS_META = [];
let SECTION_ORDER = [];
const SECTION_HTML_CACHE = {};

const BADGES = [
  {cls:'em', label:'EM'},
  {cls:'cc', label:'Critical Care'},
  {cls:'anes', label:'Anesthesia'},
  {cls:'trauma', label:'Trauma'},
  {cls:'ob', label:'OB'},
];

async function loadData(){
  const [mRes, smRes] = await Promise.all([
    fetch('content/manifest.json'), fetch('content/sections_meta.json')
  ]);
  MANIFEST = await mRes.json();
  SECTIONS_META = await smRes.json();
  SECTION_ORDER = SECTIONS_META.map(s => s.id);
}

async function loadSectionHtml(sid){
  if(SECTION_HTML_CACHE[sid]) return SECTION_HTML_CACHE[sid];
  const res = await fetch(`content/sections/${sid}.html`);
  let html = await res.text();
  html = html.split('../images/').join('content/images/');
  SECTION_HTML_CACHE[sid] = html;
  return html;
}

function el(tag, attrs={}, ...children){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==='class') e.className = v;
    else if(k==='html') e.innerHTML = v;
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  children.flat().forEach(c => {
    if(c==null) return;
    if(typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function metaFor(sid){
  return SECTIONS_META.find(s => s.id === sid);
}

// ===== Views =====

function renderHome(filterText){
  const wrap = el('div', {class:'app-view app-view-home'});

  wrap.appendChild(el('div', {class:'home-hero'},
    el('div', {class:'logo-title'}, APP_NAME),
    el('h1', {}, 'Browse the Guide'),
    el('div', {class:'logo-sub'}, MANIFEST.subtitle),
    el('div', {class:'home-badges'}, ...BADGES.map(b => el('span', {class:'badge '+b.cls}, b.label)))
  ));

  const search = el('input', {
    class:'home-search', type:'search', placeholder:'Search sections & topics…',
    value: filterText || '',
    oninput: (e) => { route('#/', e.target.value); }
  });
  wrap.appendChild(search);

  const q = (filterText||'').trim().toLowerCase();
  let anyResults = false;

  MANIFEST.groups.forEach(group => {
    const matchedSections = group.sections.filter(sec => {
      if(!q) return true;
      if(sec.title.toLowerCase().includes(q)) return true;
      return sec.subsections.some(sub => sub.label.toLowerCase().includes(q));
    });
    if(matchedSections.length === 0) return;
    anyResults = true;
    wrap.appendChild(el('div', {class:'nav-group-hdr'}, group.label));
    matchedSections.forEach(sec => {
      const meta = metaFor(sec.id);
      const subs = q
        ? sec.subsections.filter(sub => sub.label.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q))
        : sec.subsections;
      wrap.appendChild(el('button', {
        class:'section-row',
        onclick: () => { location.hash = '#/s/'+sec.id; }
      },
        el('div', {class:'section-row-top'},
          el('div', {class:'section-row-num'}, sec.num || sec.id.replace('s','')),
          el('div', {class:'section-row-title'}, sec.title),
          el('div', {class:'section-row-arrow'}, '›')
        ),
        subs.length ? el('div', {class:'section-row-subs'},
          ...subs.slice(0,6).map(sub => el('span',{class:'section-row-sub'}, sub.label))
        ) : null
      ));
    });
  });

  if(!anyResults){
    wrap.appendChild(el('div', {class:'no-results'}, 'No sections match “'+filterText+'”.'));
  }

  return wrap;
}

function renderSection(sid, subid){
  const wrap = el('div', {class:'app-view app-view-section'});
  const meta = metaFor(sid);
  if(!meta){
    wrap.appendChild(el('p', {}, 'Section not found.'));
    return wrap;
  }

  wrap.appendChild(el('div', {class:'section-head'},
    el('span', {class:'sec-num-badge'}, meta.num),
    el('h1', {}, meta.title),
    meta.desc ? el('div', {class:'section-head-desc'}, meta.desc) : null
  ));

  const group = MANIFEST.groups.find(g => g.sections.some(s => s.id === sid));
  const navSec = group ? group.sections.find(s => s.id === sid) : null;
  if(navSec && navSec.subsections.length){
    wrap.appendChild(el('div', {class:'subnav'},
      ...navSec.subsections.map(sub => el('button', {
        class:'subnav-pill'+(sub.id===subid ? ' active':''),
        onclick: () => { location.hash = '#/s/'+sid+'/'+sub.id; }
      }, sub.label))
    ));
  }

  const body = el('div', {class:'section-body'});
  wrap.appendChild(body);

  loadSectionHtml(sid).then(html => {
    body.innerHTML = html;
    if(subid){
      const target = document.getElementById(subid);
      if(target){
        requestAnimationFrame(() => {
          const top = target.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({top: Math.max(0,top), behavior:'smooth'});
        });
      }
    }
  });

  const idx = SECTION_ORDER.indexOf(sid);
  if(idx !== -1){
    const prevId = SECTION_ORDER[(idx-1+SECTION_ORDER.length)%SECTION_ORDER.length];
    const nextId = SECTION_ORDER[(idx+1)%SECTION_ORDER.length];
    const prevMeta = metaFor(prevId), nextMeta = metaFor(nextId);
    wrap.appendChild(el('div', {class:'section-prevnext'},
      el('button', {class:'pn-btn prev', onclick:()=>{location.hash='#/s/'+prevId;}},
        el('span',{class:'pn-lbl'}, '← Previous'),
        prevMeta.title
      ),
      el('button', {class:'pn-btn next', onclick:()=>{location.hash='#/s/'+nextId;}},
        el('span',{class:'pn-lbl'}, 'Next →'),
        nextMeta.title
      ),
    ));
  }

  return wrap;
}

// ===== Router =====

function setTopbar(title, showBack){
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('back-btn').style.visibility = showBack ? 'visible' : 'hidden';
}

let lastFilter = '';

function route(forcedHash, filterOverride){
  const hash = forcedHash !== undefined ? forcedHash : (location.hash || '#/');
  const root = document.getElementById('content-root');

  let view, title, showBack = true;
  if(hash === '#/' || hash === ''){
    lastFilter = filterOverride !== undefined ? filterOverride : lastFilter;
    view = renderHome(lastFilter);
    title = APP_NAME;
    showBack = false;
  } else if(hash.startsWith('#/s/')){
    const parts = hash.replace('#/s/','').split('/');
    const sid = parts[0], subid = parts[1];
    view = renderSection(sid, subid);
    const meta = metaFor(sid);
    title = meta ? (meta.num+' · '+meta.title) : 'Section';
  } else {
    lastFilter = '';
    view = renderHome('');
    title = APP_NAME;
    showBack = false;
  }

  root.innerHTML = '';
  root.appendChild(view);
  setTopbar(title, showBack);

  if(forcedHash === undefined) window.scrollTo(0,0);
  if(forcedHash !== undefined && forcedHash === '#/'){
    const input = root.querySelector('.home-search');
    if(input){
      input.focus();
      const val = input.value;
      input.value = '';
      input.value = val;
    }
  }
}

window.addEventListener('hashchange', () => route());

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('back-btn').addEventListener('click', ()=>{ location.hash = '#/'; });
  await loadData();
  route();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
