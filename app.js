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
          <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
        </div>
      </div>
    `).join('');
  };

  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elCount = document.getElementById('resultCount');
    const elTree = document.getElementById('sidebarTree');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');
    const elPageSize = document.getElementById('pageSize');
    const elPagination = document.getElementById('pagination');
    const elCountAll = document.getElementById('countAll');
    const elCountFeatured = document.getElementById('countFeatured');

    if(!elGrid || !elCount || !elTree) return;

    const state = { quick:'all', category:null, theme:null, type:null, q:'', sort:'az', pageSize:25, page:1 };

    if(elCountAll) elCountAll.textContent = String(allProducts.length);
    if(elCountFeatured) elCountFeatured.textContent = String(allProducts.filter(p=>p.featured).length);

    if(elPageSize){
      state.pageSize = (elPageSize.value === 'all') ? 'all' : Number(elPageSize.value || 25);
    }

    function resetPage(){ state.page = 1; }

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
        case 'za': items.sort((a,b)=>b.title.localeCompare(a.title)); break;
        case 'featured': items.sort((a,b)=>(b.featured-a.featured) || a.title.localeCompare(b.title)); break;
        default: items.sort((a,b)=>a.title.localeCompare(b.title)); break;
      }

      const path = [state.category, state.theme, state.type].filter(Boolean).join(' → ');
      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown${path?` in ${path}`:''}`;

      elGrid.innerHTML = items.map(p=>`
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}${p.featured?'<span class="badge">Featured</span>':''}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    // Quick filters reset
    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        state.quick = a.dataset.quick || 'all';
        state.category = null; state.theme = null; state.type = null;
        state.q = '';
        if(elQ) elQ.value = '';
        setActiveQuick(state.quick);
        resetPage();
        renderSidebar();
        applyFilters();
      });
    });

    // Sidebar clicks
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

      resetPage();
      renderSidebar();
      applyFilters();
    });

    if(elQ) elQ.addEventListener('input', ()=>{ state.q = elQ.value.trim(); resetPage(); applyFilters(); });
    if(elSort) elSort.addEventListener('change', ()=>{ state.sort = elSort.value; resetPage(); applyFilters(); });
    if(elPageSize) elPageSize.addEventListener('change', ()=>{ state.pageSize = (elPageSize.value === 'all') ? 'all' : Number(elPageSize.value); resetPage(); applyFilters(); });
    if(elPagination) elPagination.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-page]');
      if(!btn || btn.disabled) return;
      const p = Number(btn.dataset.page);
      if(!Number.isFinite(p)) return;
      state.page = p;
      applyFilters();
    });

    setActiveQuick(state.quick);
    renderSidebar();
    applyFilters();
  };
})();
// NOTE: Paging patch did not apply automatically; please notify.
