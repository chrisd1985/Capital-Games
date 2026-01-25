(function(){
  const allProducts = (window.PRODUCTS || [])
    .map(p => ({
      ...p,
      status: (p.status || '').toLowerCase(),
      category: (p.category || 'Other').trim(),
      theme: (p.theme || 'General').trim(),
      type: (p.type || 'Misc').trim(),
      featured: !!p.featured
    }))
    .filter(p => p.status === 'active');

  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }
  function uniq(arr){ return [...new Set(arr.filter(Boolean))]; }

  function getBaseSet(state){
    return state.quick === 'featured'
      ? allProducts.filter(p => p.featured)
      : allProducts;
  }

  window.CG_renderFeatured = function(){
    const featuredGrid = document.getElementById('featuredGrid');
    if(!featuredGrid) return;

    const featuredItems = allProducts.filter(p => p.featured);

    // 4 or 8 (never a lonely 5th)
    let displayCount = 0;
    if(featuredItems.length >= 8) displayCount = 8;
    else if(featuredItems.length >= 4) displayCount = 4;
    else displayCount = featuredItems.length;

    if(displayCount === 0){
      featuredGrid.innerHTML = '<div style="grid-column:1/-1;color:var(--muted);">No featured items yet.</div>';
      return;
    }

    featuredGrid.innerHTML = featuredItems.slice(0, displayCount).map(p => `
      <div class="card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
        <div class="card-body">
          <p class="title">${escapeHtml(p.title)}<span class="badge">Featured</span></p>
          ${p.price ? `<div class="price">${escapeHtml(p.price)}</div>` : ``}
          <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
        </div>
      </div>
    `).join('');
  };

  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elPerPage = document.getElementById('perPage');
    const elPagination = document.getElementById('pagination');
    const elCount = document.getElementById('resultCount');
    const elTree = document.getElementById('sidebarTree');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');
    const elCountAll = document.getElementById('countAll');
    const elCountFeatured = document.getElementById('countFeatured');

    if(!elGrid || !elCount || !elTree) return;

    // ✅ DEFAULT: featured first
    const state = {
      quick:'all',
      category:null, theme:null, type:null,
      q:'',
      sort:'featured',
      perPage:'all',
      page:1
    };
// Prefill from URL: shop.html?q=...
try{
  const params = new URLSearchParams(window.location.search);
  const qParam = (params.get('q') || '').trim();
  if(qParam){
    state.q = qParam;
    if(elQ) elQ.value = qParam;

    // Optional: make featured-first the default when coming from header search
    state.sort = 'featured';
    if(elSort) elSort.value = 'featured';
  }
}catch(e){}
    // Keep UI in sync with default state
    if(elSort) elSort.value = 'featured';

    if(elCountAll) elCountAll.textContent = String(allProducts.length);
    if(elCountFeatured) elCountFeatured.textContent = String(allProducts.filter(p=>p.featured).length);

    function setActiveQuick(val){
      document.querySelectorAll('[data-quick]').forEach(a=>{
        a.classList.toggle('active', a.dataset.quick === val);
      });
    }

    function renderSidebar(){
      const base = getBaseSet(state);
      const cats = uniq(base.map(p=>p.category)).sort((a,b)=>a.localeCompare(b));

      const html = cats.map(cat=>{
        const n = base.filter(p=>p.category===cat).length;
        const active = state.category === cat;

        let themesHtml = '';
        if(active){
          const themes = uniq(base.filter(p=>p.category===cat).map(p=>p.theme)).sort((a,b)=>a.localeCompare(b));
          themesHtml = `
            <div class="treeIndent treeBlock">
              ${themes.map(th=>{
                const tn = base.filter(p=>p.category===cat && p.theme===th).length;
                const thActive = state.theme === th;

                let typesHtml = '';
                if(thActive){
                  const types = uniq(base.filter(p=>p.category===cat && p.theme===th).map(p=>p.type)).sort((a,b)=>a.localeCompare(b));
                  typesHtml = `
                    <div class="treeIndent2 treeBlock">
                      ${types.map(tp=>{
                        const cn = base.filter(p=>p.category===cat && p.theme===th && p.type===tp).length;
                        const tpActive = state.type === tp;
                        return `
                          <a class="pill sub2 ${tpActive?'active':''}" href="#"
                             data-level="type" data-cat="${escapeHtml(cat)}" data-theme="${escapeHtml(th)}" data-type="${escapeHtml(tp)}">
                            <span>${escapeHtml(tp)}</span><span class="smallcount">${cn}</span>
                          </a>
                        `;
                      }).join('')}
                    </div>
                  `;
                }

                return `
                  <a class="pill sub ${thActive?'active':''}" href="#"
                     data-level="theme" data-cat="${escapeHtml(cat)}" data-theme="${escapeHtml(th)}">
                    <span>${escapeHtml(th)}</span><span class="smallcount">${tn}</span>
                  </a>
                  ${typesHtml}
                `;
              }).join('')}
            </div>
          `;
        }

        return `
          <a class="pill ${active?'active':''}" href="#" data-level="category" data-cat="${escapeHtml(cat)}">
            <span>${escapeHtml(cat)}</span><span class="smallcount">${n}</span>
          </a>
          ${themesHtml}
        `;
      }).join('');

      elTree.innerHTML = html || '<div style="color:var(--muted);font-size:.9rem;">No items found.</div>';
    }

    function renderPagination(totalPages){
      if(!elPagination) return;
      if(totalPages <= 1){
        elPagination.innerHTML = '';
        return;
      }
      const btn = (label, page, disabled=false, active=false) => (
        `<button class="pageBtn${active?' isActive':''}" ${disabled?'disabled':''} data-page="${page}">${label}</button>`
      );

      let html = '';
      html += btn('« First', 1, state.page===1);
      html += btn('‹ Prev', Math.max(1, state.page-1), state.page===1);

      const windowSize = 5;
      let start = Math.max(1, state.page - Math.floor(windowSize/2));
      let end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);

      for(let p=start; p<=end; p++){
        html += btn(String(p), p, false, p===state.page);
      }

      html += btn('Next ›', Math.min(totalPages, state.page+1), state.page===totalPages);
      html += btn('Last »', totalPages, state.page===totalPages);

      elPagination.innerHTML = html;
    }

    function applyFilters(){
      let items = [...getBaseSet(state)];

      if(state.category) items = items.filter(p=>p.category===state.category);
      if(state.theme) items = items.filter(p=>p.theme===state.theme);
      if(state.type) items = items.filter(p=>p.type===state.type);

      if(state.q){
        const q = state.q.toLowerCase();
        items = items.filter(p => (p.title||'').toLowerCase().includes(q));
      }

      switch(state.sort){
        case 'za':
          items.sort((a,b)=>b.title.localeCompare(a.title));
          break;
        case 'featured':
          items.sort((a,b)=>(b.featured - a.featured) || a.title.localeCompare(b.title));
          break;
        default:
          items.sort((a,b)=>a.title.localeCompare(b.title));
          break;
      }

      const total = items.length;
      const per = (state.perPage === 'all') ? total : Math.max(1, parseInt(state.perPage, 10) || 25);
      const totalPages = (per >= total || total === 0) ? 1 : Math.ceil(total / per);
      if(state.page > totalPages) state.page = totalPages;
      if(state.page < 1) state.page = 1;

      const startIdx = (state.page - 1) * per;
      const endIdx = Math.min(startIdx + per, total);
      const pageItems = items.slice(startIdx, endIdx);

      const path = [state.category, state.theme, state.type].filter(Boolean).join(' → ');
      elCount.textContent = `${items.length} item${items.length===1?'':'s'}${path ? ' • ' + path : ''}`;

      renderPagination(totalPages);

      elGrid.innerHTML = pageItems.map(p=>`
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}${p.featured?'<span class="badge">Featured</span>':''}</p>
            <p class="price">${escapeHtml(p.price || 'Price on eBay')}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    if(elPagination){
      elPagination.addEventListener('click', (e)=>{
        const b = e.target.closest('button[data-page]');
        if(!b) return;
        const next = parseInt(b.dataset.page, 10);
        if(!isNaN(next)){
          state.page = next;
          applyFilters();
          const top = document.querySelector('.searchRow');
          if(top) top.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    }

    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        state.quick = a.dataset.quick || 'all';
        state.category = null; state.theme = null; state.type = null;
        state.q = '';
        state.page = 1;
        if(elQ) elQ.value = '';
        setActiveQuick(state.quick);
        renderSidebar();
        applyFilters();
      });
    });

    elTree.addEventListener('click', e=>{
      const a = e.target.closest('a[data-level]');
      if(!a) return;
      e.preventDefault();
      const lvl = a.dataset.level;

      if(lvl === 'category'){
        const cat = a.dataset.cat;
        if(state.category === cat){
          state.category = null; state.theme = null; state.type = null;
        } else {
          state.category = cat; state.theme = null; state.type = null;
        }
      }

      if(lvl === 'theme'){
        const cat = a.dataset.cat;
        const th = a.dataset.theme;
        state.category = cat;
        if(state.theme === th){
          state.theme = null; state.type = null;
        } else {
          state.theme = th; state.type = null;
        }
      }

      if(lvl === 'type'){
        const cat = a.dataset.cat;
        const th = a.dataset.theme;
        const tp = a.dataset.type;
        state.category = cat; state.theme = th;
        state.type = (state.type === tp) ? null : tp;
      }

      renderSidebar();
      state.page = 1;
      applyFilters();
    });

    if(elQ){
      elQ.addEventListener('input', ()=>{
        state.q = elQ.value.trim();
        state.page = 1;
        applyFilters();
      });
    }

    if(elSort){
      elSort.addEventListener('change', ()=>{
        state.sort = elSort.value;
        state.page = 1;
        applyFilters();
      });
    }

    if(elPerPage){
      elPerPage.addEventListener('change', ()=>{
        state.perPage = elPerPage.value;
        state.page = 1;
        applyFilters();
      });
    }

    setActiveQuick(state.quick);
    renderSidebar();
    applyFilters();
  };
  // ===== Global header search (dropdown + redirect to shop filter) =====
function CG_escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function CG_initHeaderSearch(){
  const wrap = document.querySelector('.cg-headerSearch');
  if(!wrap) return;

  const input = wrap.querySelector('.cg-headerSearchInput');
  const btn = wrap.querySelector('.cg-headerSearchBtn');
  if(!input || !btn) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'cg-searchDropdown';
  dropdown.style.display = 'none';
  wrap.appendChild(dropdown);

  const PRODUCTS = (window.PRODUCTS || [])
    .map(p => ({
      ...p,
      status: (p.status || '').toLowerCase(),
      featured: !!p.featured,
      title: p.title || '',
      price: p.price || '',
      image: p.image || '',
      link: p.link || ''
    }))
    .filter(p => p.status === 'active');

  function closeDropdown(){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  function goToShop(q){
    const query = (q || '').trim();
    if(!query){
      window.location.href = './shop.html';
      return;
    }
    window.location.href = `./shop.html?q=${encodeURIComponent(query)}`;
  }

  function renderResults(q){
    const query = (q || '').trim().toLowerCase();
    if(query.length < 2){
      closeDropdown();
      return;
    }

    const matches = PRODUCTS
      .filter(p => p.title.toLowerCase().includes(query))
      .sort((a,b) => (b.featured - a.featured) || a.title.localeCompare(b.title))
      .slice(0, 6);

    if(matches.length === 0){
      dropdown.innerHTML = `
        <div class="cg-searchItem" style="cursor:default;">
          <div class="cg-searchMeta">
            <div class="cg-searchTitle">No matches</div>
            <div class="cg-searchSub">Try a different keyword.</div>
          </div>
        </div>
        <div class="cg-searchFooter" data-action="viewall">Search in shop →</div>
      `;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = `
      ${matches.map(p => `
        <div class="cg-searchItem" data-action="pick" data-title="${CG_escapeHtml(p.title)}">
          <img class="cg-searchThumb" src="${CG_escapeHtml(p.image)}" alt="">
          <div class="cg-searchMeta">
            <div class="cg-searchTitle">${CG_escapeHtml(p.title)}</div>
            <div class="cg-searchSub">
              ${p.price ? `<span>${CG_escapeHtml(p.price)}</span>` : `<span>Price on eBay</span>`}
              ${p.featured ? `<span style="font-weight:900;">Featured</span>` : ``}
            </div>
          </div>
        </div>
      `).join('')}
      <div class="cg-searchFooter" data-action="viewall">Search in shop →</div>
    `;
    dropdown.style.display = 'block';
  }

  // Input interactions
  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => renderResults(input.value), 120);
  });

  input.addEventListener('focus', () => renderResults(input.value));

  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      goToShop(input.value);
      closeDropdown();
    }
    if(e.key === 'Escape'){
      closeDropdown();
      input.blur();
    }
  });

  btn.addEventListener('click', () => {
    goToShop(input.value);
    closeDropdown();
  });

  // Click handling inside dropdown
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('[data-action]');
    if(!item) return;
    const action = item.dataset.action;

    if(action === 'pick'){
      // Put title in input and go to shop filtered
      const title = item.dataset.title || input.value;
      input.value = title;
      goToShop(title);
      closeDropdown();
      return;
    }

    if(action === 'viewall'){
      goToShop(input.value);
      closeDropdown();
      return;
    }
  });

  // Close if clicking outside
  document.addEventListener('click', (e) => {
    if(!wrap.contains(e.target)) closeDropdown();
  });
}
  document.addEventListener('DOMContentLoaded', () => {
  CG_initHeaderSearch();
});
})();
