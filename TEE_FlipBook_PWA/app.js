// ===== TEE Reference FlipBook — App Logic =====

let CARDS = [];
let CARDS_BY_SLUG = {};
let REF = {};

const NAV_NODES = [
  {id:'hypo', label:'Hypopharynx', x:600, y:40, kind:'landmark'},
  {slug:'ue-aortic-arch-lax', num:12, label:'UE Arch LAX', x:760, y:105},
  {slug:'ue-aortic-arch-sax', num:13, label:'UE Arch SAX', x:945, y:105},
  {slug:'me-ascending-ao-lax', num:9, label:'ME Asc Ao LAX', x:330, y:180},
  {slug:'me-ascending-ao-sax', num:8, label:'ME Asc Ao SAX', x:495, y:180},
  {slug:'me-av-lax', num:7, label:'ME AV LAX', x:110, y:275},
  {slug:'me-rv-inflow-outflow', num:6, label:'ME RV I-O', x:275, y:275},
  {slug:'me-av-sax', num:5, label:'ME AV SAX', x:435, y:275},
  {slug:'me-bicaval', num:4, label:'ME Bicaval', x:20, y:385},
  {slug:'me-long-axis', num:3, label:'ME LAX', x:180, y:385},
  {slug:'me-two-chamber', num:2, label:'ME 2C', x:335, y:385},
  {slug:'me-commissural', num:19, label:'ME Commissural', x:495, y:385},
  {slug:'me-four-chamber', num:1, label:'ME 4C', x:655, y:385},
  {slug:'desc-aorta-sax', num:10, label:'Desc Ao SAX', x:815, y:385},
  {slug:'desc-aorta-lax', num:11, label:'Desc Ao LAX', x:975, y:385},
  {slug:'tg-basal-sax', num:14, label:'TG Basal SAX', x:655, y:495},
  {slug:'tg-rv-two-chamber', num:20, label:'TG RV 2C', x:165, y:605},
  {slug:'tg-long-axis', num:17, label:'TG LAX', x:335, y:605},
  {slug:'tg-two-chamber', num:16, label:'TG 2C', x:495, y:605},
  {slug:'tg-mid-papillary-sax', num:15, label:'TG Mid SAX', x:655, y:605},
  {slug:'deep-tg-lax', num:18, label:'Deep TG LAX', x:655, y:715},
];

const NAV_EDGES = [
  ['hypo','ue-aortic-arch-lax'], ['ue-aortic-arch-lax','ue-aortic-arch-sax'],
  ['me-ascending-ao-lax','me-ascending-ao-sax'],
  ['me-av-lax','me-rv-inflow-outflow'], ['me-rv-inflow-outflow','me-av-sax'], ['me-av-sax','me-four-chamber'],
  ['me-av-lax','me-long-axis'],
  ['me-bicaval','me-long-axis'], ['me-long-axis','me-two-chamber'], ['me-two-chamber','me-commissural'], ['me-commissural','me-four-chamber'],
  ['me-four-chamber','desc-aorta-sax'], ['desc-aorta-sax','desc-aorta-lax'],
  ['me-ascending-ao-sax','me-four-chamber'],
  ['hypo','me-ascending-ao-sax'],
  ['me-four-chamber','tg-basal-sax'],
  ['tg-basal-sax','tg-mid-papillary-sax'],
  ['tg-mid-papillary-sax','deep-tg-lax'],
  ['tg-rv-two-chamber','tg-long-axis'], ['tg-long-axis','tg-two-chamber'], ['tg-two-chamber','tg-mid-papillary-sax'],
];

const CAT_COLOR = {ME:'#2563eb', UE:'#a78bfa', TG:'#15803d', landmark:'#8B9BB0'};
function catOf(slug){
  if(!slug) return 'landmark';
  if(slug.startsWith('ue-')) return 'UE';
  if(slug.startsWith('tg-') || slug.startsWith('deep-tg')) return 'TG';
  return 'ME';
}

async function loadData(){
  const [cardsRes, refRes] = await Promise.all([
    fetch('cards.json'), fetch('reference.json')
  ]);
  CARDS = await cardsRes.json();
  REF = await refRes.json();
  CARDS.forEach(c => CARDS_BY_SLUG[c.slug] = c);
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

function bulletList(items){
  return el('ul', {class:'bullets'}, ...items.map(t => el('li', {}, t)));
}

// ===== Views =====

function renderHome(){
  const wrap = el('div', {class:'view view-home'});
  wrap.appendChild(el('div', {class:'home-intro'},
    el('h1',{}, 'Obtaining the 20 Standard Views'),
    el('p',{}, 'Tap any view to open its full reference card. Lines trace the probe path between views.')
  ));

  const mapWrap = el('div', {class:'navmap-scroll'});
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('viewBox','0 0 1040 770');
  svg.setAttribute('class','navmap-svg');

  const nodeById = {};
  NAV_NODES.forEach(n=>nodeById[n.slug||n.id]=n);

  // edges first (behind nodes)
  const gLines = document.createElementNS(svgNS,'g');
  NAV_EDGES.forEach(([a,b])=>{
    const na = nodeById[a], nb = nodeById[b];
    if(!na||!nb) return;
    const line = document.createElementNS(svgNS,'line');
    line.setAttribute('x1', na.x); line.setAttribute('y1', na.y);
    line.setAttribute('x2', nb.x); line.setAttribute('y2', nb.y);
    line.setAttribute('class','navmap-edge');
    gLines.appendChild(line);
  });
  svg.appendChild(gLines);
  mapWrap.appendChild(svg);

  // HTML nodes absolutely positioned over the svg (percentage based on viewBox 1040x770)
  const nodeLayer = el('div', {class:'navmap-nodes'});
  NAV_NODES.forEach(n=>{
    const leftPct = (n.x/1040*100).toFixed(2)+'%';
    const topPct = (n.y/770*100).toFixed(2)+'%';
    if(n.kind==='landmark'){
      nodeLayer.appendChild(el('div', {class:'navnode navnode-landmark', style:`left:${leftPct};top:${topPct}`},
        el('div',{class:'navnode-label'}, n.label)
      ));
      return;
    }
    const card = CARDS_BY_SLUG[n.slug];
    const cat = catOf(n.slug);
    const btn = el('button', {
      class:'navnode',
      style:`left:${leftPct};top:${topPct};--cat-color:${CAT_COLOR[cat]}`,
      onclick: ()=>{ location.hash = '#/view/'+n.slug; }
    },
      el('div',{class:'navnode-num'}, '#'+n.num),
      el('div',{class:'navnode-label'}, n.label),
      card ? el('div',{class:'navnode-angle'}, card.omniplane_bar ? card.omniplane_bar.split('·')[0].replace('Omniplane','').trim() : '') : null
    );
    nodeLayer.appendChild(btn);
  });
  mapWrap.appendChild(nodeLayer);
  wrap.appendChild(mapWrap);

  const legend = el('div', {class:'navmap-legend'},
    el('span',{class:'legend-item'}, el('i',{style:`background:${CAT_COLOR.ME}`}), 'Mid-Esophageal'),
    el('span',{class:'legend-item'}, el('i',{style:`background:${CAT_COLOR.UE}`}), 'Upper Esophageal'),
    el('span',{class:'legend-item'}, el('i',{style:`background:${CAT_COLOR.TG}`}), 'Transgastric'),
  );
  wrap.appendChild(legend);

  const quickLinks = el('div', {class:'home-quicklinks'},
    el('button',{class:'quicklink', onclick:()=>location.hash='#/probe'}, 'Probe Manipulation Reference'),
    el('button',{class:'quicklink', onclick:()=>location.hash='#/sweep'}, 'The Systematic Sweep'),
    el('button',{class:'quicklink', onclick:()=>location.hash='#/appendix'}, 'Appendix — Grading & Formulas'),
  );
  wrap.appendChild(quickLinks);

  return wrap;
}

function sectionBlock(color, label, items){
  return el('div',{class:'section-block'},
    el('div',{class:'section-hdr', style:`background:${color}`}, label),
    el('div',{class:'section-body'}, bulletList(items))
  );
}

const SECTION_COLORS = {
  normal: '#C2410C', probe: '#15803D', pathology: '#B91C1C', structures: '#1B3A6B'
};

function renderCard(slug){
  const c = CARDS_BY_SLUG[slug];
  const wrap = el('div', {class:'view view-card'});
  if(!c){
    wrap.appendChild(el('p',{}, 'View not found.'));
    return wrap;
  }
  const idx = CARDS.findIndex(x=>x.slug===slug);
  const prev = CARDS[(idx-1+CARDS.length)%CARDS.length];
  const next = CARDS[(idx+1)%CARDS.length];

  wrap.appendChild(el('div',{class:'card-topbar'},
    el('span',{class:'card-badge'}, '#'+c.num),
    el('span',{class:'card-omni'}, c.omniplane_bar||''),
    el('span',{class:'card-cat'}, c.category||'')
  ));

  wrap.appendChild(el('div',{class:'card-image-wrap'},
    el('img',{src:'images/'+c.image, alt:c.title, class:'card-image'})
  ));

  wrap.appendChild(el('div',{class:'card-titleblock'},
    el('div',{class:'card-subtitle'}, c.subtitle||''),
    el('h2',{class:'card-title'}, c.title)
  ));

  const sections = el('div',{class:'card-sections'});
  if(c.normal && c.normal.length) sections.appendChild(sectionBlock(SECTION_COLORS.normal, 'NORMAL VALUES', c.normal));
  if(c.probe && c.probe.length) sections.appendChild(sectionBlock(SECTION_COLORS.probe, 'PROBE MANIPULATION', c.probe));
  if(c.pathology && c.pathology.length) sections.appendChild(sectionBlock(SECTION_COLORS.pathology, 'KEY PATHOLOGY', c.pathology));
  if(c.structures && c.structures.length) sections.appendChild(sectionBlock(SECTION_COLORS.structures, 'STRUCTURES VISUALIZED', c.structures));
  wrap.appendChild(sections);

  wrap.appendChild(el('div',{class:'card-prevnext'},
    el('button',{class:'pn-btn', onclick:()=>location.hash='#/view/'+prev.slug}, '\u2190 #'+prev.num+' '+prev.title),
    el('button',{class:'pn-btn', onclick:()=>location.hash='#/view/'+next.slug}, '#'+next.num+' '+next.title+' \u2192'),
  ));

  return wrap;
}

function renderProbe(){
  const wrap = el('div',{class:'view view-probe'});
  wrap.appendChild(el('h1',{}, 'Probe Manipulation Reference'));
  const table = el('div',{class:'probe-table'});
  REF.probe_ref.forEach((r,i)=>{
    table.appendChild(el('div',{class:'probe-row'+(i%2? ' alt':'')},
      el('div',{class:'probe-sym'}, r.sym+'  '+r.label),
      el('div',{class:'probe-desc'}, r.desc)
    ));
  });
  wrap.appendChild(table);
  wrap.appendChild(el('div',{class:'callout'},
    el('div',{class:'callout-hdr'},'DOPPLER PEARLS'),
    el('div',{class:'callout-body'}, REF.doppler_pearls)
  ));
  return wrap;
}

const PHASE_COLORS = {orange:'#C2410C', green:'#15803D', red:'#B91C1C', navy:'#1B3A6B'};

function renderSweep(){
  const wrap = el('div',{class:'view view-sweep'});
  wrap.appendChild(el('h1',{}, 'The Systematic Sweep'));
  wrap.appendChild(el('p',{class:'sweep-intro'}, 'One continuous probe path for the comprehensive exam \u2014 advance once, sweep the omniplane angle, withdraw once.'));
  REF.sweep_phases.forEach(ph=>{
    wrap.appendChild(el('div',{class:'phase-card'},
      el('div',{class:'phase-hdr', style:`background:${PHASE_COLORS[ph.color]}`}, `${ph.label} \u2014 ${ph.title}    (${ph.angles})`),
      el('div',{class:'phase-body'},
        el('p',{}, ph.desc),
        el('p',{class:'phase-mapping'}, ph.mapping)
      )
    ));
  });
  wrap.appendChild(el('div',{class:'callout'},
    el('div',{class:'callout-hdr'},'SOURCE'),
    el('div',{class:'callout-body'},
      'Kothavale AA, Yeon SB, Manning WJ. A systematic approach to performing a comprehensive transesophageal echocardiogram. A call to order. BMC Cardiovasc Disord. 2009;9:18.',
      el('br'),
      'Hahn RT, et al. Guidelines for Performing a Comprehensive Transesophageal Echocardiographic Examination. J Am Soc Echocardiogr. 2013;26:921\u201364.'
    )
  ));
  return wrap;
}

function renderAppendix(){
  const wrap = el('div',{class:'view view-appendix'});
  wrap.appendChild(el('h1',{}, 'Appendix'));
  const items = [
    {img:'appendix_images/valve_grading_1.png', label:'Valve Grading \u2014 Mitral / Aortic'},
    {img:'appendix_images/valve_grading_2.png', label:'Valve Grading \u2014 Right-Sided & Stenosis'},
    {img:'appendix_images/hemodynamics.png', label:'Hemodynamic Formulas & Pressure Estimates'},
    {img:'appendix_images/pa_catheter.png', label:'PA Catheter Waveforms'},
    {img:'appendix_images/checklist.png', label:'Advanced TEE Checklist'},
  ];
  items.forEach(it=>{
    wrap.appendChild(el('div',{class:'appendix-item'},
      el('h3',{}, it.label),
      el('img',{src:it.img, alt:it.label, class:'appendix-image'})
    ));
  });
  return wrap;
}

// ===== Router =====

function setTopbar(title, showBack){
  const bar = document.getElementById('topbar-title');
  bar.textContent = title;
  document.getElementById('back-btn').style.visibility = showBack ? 'visible' : 'hidden';
}

function route(){
  const hash = location.hash || '#/';
  const app = document.getElementById('app');
  app.innerHTML = '';
  document.querySelectorAll('.tabbar-btn').forEach(b=>b.classList.remove('active'));

  let view, title, showBack=true, tab=null;
  if(hash === '#/' || hash === ''){
    view = renderHome(); title='TEE FlipBook'; showBack=false; tab='home';
  } else if(hash.startsWith('#/view/')){
    const slug = hash.replace('#/view/','');
    view = renderCard(slug);
    const c = CARDS_BY_SLUG[slug];
    title = c ? ('#'+c.num+' '+c.title) : 'View';
  } else if(hash === '#/probe'){
    view = renderProbe(); title='Probe Reference'; tab='probe';
  } else if(hash === '#/sweep'){
    view = renderSweep(); title='Systematic Sweep'; tab='sweep';
  } else if(hash === '#/appendix'){
    view = renderAppendix(); title='Appendix'; tab='appendix';
  } else {
    view = renderHome(); title='TEE FlipBook'; showBack=false; tab='home';
  }
  app.appendChild(view);
  setTopbar(title, showBack);
  if(tab){
    const btn = document.querySelector(`.tabbar-btn[data-tab="${tab}"]`);
    if(btn) btn.classList.add('active');
  }
  window.scrollTo(0,0);
}

window.addEventListener('hashchange', route);

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('back-btn').addEventListener('click', ()=>{ location.hash = '#/'; });
  document.querySelectorAll('.tabbar-btn').forEach(b=>{
    b.addEventListener('click', ()=>{ location.hash = b.dataset.href; });
  });
  await loadData();
  route();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
