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

  /* HOME: Featured grid */
  window.CG_renderFeatured = function(){
    const grid = document.getElementById('featuredGrid');
    if(!grid) return;

    const featured = allProducts.filter(p => p.featured);
    const count = featured.length >= 8 ? 8 : (featured.length >= 4 ? 4 : featured.length);

    if(count === 0){
      grid.innerHTML = '<div style="grid-column:1/-1;color:#555;">No featured items yet.</div>';
      return;
    }

    grid.innerHTML = featured.slice(0, count).map(p => `
      <div class="card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
        <div class="card-body">
          <p class="title">${escapeHtml(p.title)}</p>
          <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
        </div>
      </div>
    `).join('');
  };

  /* SHOP */
  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elCount = document.getElementById('resultCount');
    const elTree = document.getElementById('filterTree');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');
    const elCountAll = document.getElementById('countAll');
    const elCountFeatured = document.getElementById('countFeatured');

    if(!elGrid || !elCount || !elTree) return;

    const state = {
      quick: 'all',      // all | featured
      category: null,
      theme: null,
      type: null,
      q: '',
      sort: 'az'
    };

    // Top counts always reflect totals for the quick filter buckets
    if(elCountAll) elCountAll.textContent = String(allProducts.length);
    if(elCountFeatured) elCountFeatured.textContent = String(allProducts.filter(p => p.featured).length);

    function setActiveQuick(){
      document.querySelectorAll('[data-quick]').forEach(a=>{
        a.classList.toggle('active', a.dataset.quick === state.quick);
      });
    }

    // Build “NHL-like” progressive tree:
    // - Always show Categories
    // - If a Category is selected: show its Themes underneath
    // - If a Theme is selected: show its Types underneath
    function renderTree(){
      const base = getBaseSet(state);

      const cats = uniq(base.map(p => p.category)).sort((a,b)=>a.localeCompare(b));

      const catCounts = new Map();
      for(const c of cats){
        catCounts.set(c, base.filter(p => p.category === c).length);
      }

      const themes = state.category
        ? uniq(base.filter(p => p.category === state.category).map(p => p.theme)).sort((a,b)=>a.localeCompare(b))
        : [];

      const themeCounts = new Map();
      for(const t of themes){
        themeCounts.set(t, base.filter(p => p.category === state.category && p.theme === t).length);
      }

      const types = (state.category && state.theme)
        ? uniq(base.filter(p => p.category === state.category && p.theme === state.theme).map(p => p.type)).sort((a,b)=>a.localeCompare(b))
        : [];

      const typeCounts = new Map();
      for(const tp of types){
        typeCounts.set(tp, base.filter(p => p.category===state.category && p.theme===state.theme && p.type===tp).length);
      }

      // Categories
      let html = cats.map(c => `
        <a class="pill ${state.category===c ? 'active':''}" href="#"
           data-level="category" data-cat="${escapeHtml(c)}">
          <span>${escapeHtml(c)}</span><span class="smallcount">${catCounts.get(c) || 0}</span>
        </a>
      `).join('');

      // Themes under selected category
      if(state.category){
        html += `<div class="divider"></div>`;
        html += themes.map(t => `
          <a class="pill treeChild ${state.theme===t ? 'active':''}" href="#"
             data-level="theme" data-cat="${escapeHtml(state.category)}" data-theme="${escapeHtml(t)}">
            <span>${escapeHtml(t)}</span><span class="smallcount">${themeCounts.get(t) || 0}</span>
          </a>
        `).join('');
      }

      // Types under selected theme
      if(state.category && state.theme){
        html += `<div class="divider"></div>`;
        html += types.map(tp => `
          <a class="pill treeGrandChild ${state.type===tp ? 'active':''}" href="#"
             data-level="type"
             data-cat="${escapeHtml(state.category)}"
             data-theme="${escapeHtml(state.theme)}"
             data-type="${escapeHtml(tp)}">
            <span>${escapeHtml(tp)}</span><span class="smallcount">${typeCounts.get(tp) || 0}</span>
          </a>
        `).join('');
      }

      elTree.innerHTML = html;
    }

    function applyFilters(){
      let items = [...getBaseSet(state)];

      // Progressive drilldown
      if(state.category) items = items.filter(p => p.category === state.category);
      if(state.theme) items = items.filter(p => p.theme === state.theme);
      if(state.type) items = items.filter(p => p.type === state.type);

      // Search
      if(state.q){
        const q = state.q.toLowerCase();
        items = items.filter(p => (p.title||'').toLowerCase().includes(q));
      }

      // Sort
      switch(state.sort){
        case 'za': items.sort((a,b)=>b.title.localeCompare(a.title)); break;
        case 'featured': items.sort((a,b)=>(b.featured - a.featured) || a.title.localeCompare(b.title)); break;
        default: items.sort((a,b)=>a.title.localeCompare(b.title)); break;
      }

      const path = [state.category, state.theme, state.type].filter(Boolean).join(" → ");
      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown${path?` in ${path}`:''}`;

      // IMPORTANT: only show title + View on eBay (no meta line)
      elGrid.innerHTML = items.map(p => `
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    // Quick filters (reset drilldown + rebuild)
    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        state.quick = a.dataset.quick || 'all';
        state.category = null;
        state.theme = null;
        state.type = null;
        state.q = '';
        if(elQ) elQ.value = '';
        setActiveQuick();
        renderTree();
        applyFilters();
      });
    });

    // Tree click: category/theme/type progressively filters immediately
    elTree.addEventListener('click', e=>{
      const a = e.target.closest('a[data-level]');
      if(!a) return;
      e.preventDefault();

      const level = a.dataset.level;

      if(level === 'category'){
        state.category = a.dataset.cat;
        state.theme = null;
        state.type = null;
      } else if(level === 'theme'){
        state.category = a.dataset.cat;
        state.theme = a.dataset.theme;
        state.type = null;
      } else if(level === 'type'){
        state.category = a.dataset.cat;
        state.theme = a.dataset.theme;
        state.type = a.dataset.type;
      }

      renderTree();
      applyFilters();
    });

    if(elQ) elQ.addEventListener('input', ()=>{ state.q = elQ.value.trim(); applyFilters(); });
    if(elSort) elSort.addEventListener('change', ()=>{ state.sort = elSort.value; applyFilters(); });

    // Init
    setActiveQuick();
    renderTree();
    applyFilters();
  };
})();
