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

  /* ================= Featured (Home) ================= */
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

  /* ================= Shop ================= */
  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elCount = document.getElementById('resultCount');
    const elCategory = document.getElementById('categoryList');
    const elTheme = document.getElementById('themeList');
    const elType = document.getElementById('typeList');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');

    const elCountAll = document.getElementById('countAll');
    const elCountFeatured = document.getElementById('countFeatured');

    if(!elGrid || !elCount || !elCategory || !elTheme || !elType) return;

    const state = {
      quick: 'all',      // all | featured
      category: null,
      theme: null,
      type: null,
      q: '',
      sort: 'az'
    };

    // set top counts (always global, not per category selection)
    if(elCountAll) elCountAll.textContent = String(allProducts.length);
    if(elCountFeatured) elCountFeatured.textContent = String(allProducts.filter(p => p.featured).length);

    function setActiveQuick(val){
      document.querySelectorAll('[data-quick]').forEach(a=>{
        a.classList.toggle('active', a.dataset.quick === val);
      });
    }

    function renderCategoryList(){
      const base = getBaseSet(state);
      const cats = uniq(base.map(p => p.category)).sort((a,b)=>a.localeCompare(b));
      elCategory.innerHTML = cats.map(cat => {
        const n = base.filter(p => p.category === cat).length;
        const active = state.category === cat;
        return `
          <a class="pill ${active?'active':''}" href="#" data-cat="${escapeHtml(cat)}">
            <span>${escapeHtml(cat)}</span><span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function renderThemeList(){
      if(!state.category){
        elTheme.innerHTML = '<div style="color:#777;font-size:.9rem;">Select a category</div>';
        return;
      }
      const base = getBaseSet(state);
      const themes = uniq(base.filter(p => p.category === state.category).map(p => p.theme))
        .sort((a,b)=>a.localeCompare(b));
      elTheme.innerHTML = themes.map(th => {
        const n = base.filter(p => p.category===state.category && p.theme===th).length;
        const active = state.theme === th;
        return `
          <a class="pill ${active?'active':''}" href="#" data-theme="${escapeHtml(th)}">
            <span>${escapeHtml(th)}</span><span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function renderTypeList(){
      if(!state.category || !state.theme){
        elType.innerHTML = '<div style="color:#777;font-size:.9rem;">Select a theme</div>';
        return;
      }
      const base = getBaseSet(state);
      const types = uniq(
        base.filter(p => p.category===state.category && p.theme===state.theme).map(p => p.type)
      ).sort((a,b)=>a.localeCompare(b));
      elType.innerHTML = types.map(t => {
        const n = base.filter(p => p.category===state.category && p.theme===state.theme && p.type===t).length;
        const active = state.type === t;
        return `
          <a class="pill ${active?'active':''}" href="#" data-type="${escapeHtml(t)}">
            <span>${escapeHtml(t)}</span><span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function applyFilters(){
      let items = [...getBaseSet(state)];

      if(state.category) items = items.filter(p => p.category === state.category);
      if(state.theme) items = items.filter(p => p.theme === state.theme);
      if(state.type) items = items.filter(p => p.type === state.type);

      if(state.q){
        const q = state.q.toLowerCase();
        items = items.filter(p => (p.title||'').toLowerCase().includes(q));
      }

      switch(state.sort){
        case 'za': items.sort((a,b)=>b.title.localeCompare(a.title)); break;
        case 'featured': items.sort((a,b)=>(b.featured - a.featured) || a.title.localeCompare(b.title)); break;
        default: items.sort((a,b)=>a.title.localeCompare(b.title)); break;
      }

      const path = [state.category, state.theme, state.type].filter(Boolean).join(" → ");
      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown${path?` in ${path}`:''}`;

      elGrid.innerHTML = items.map(p => `
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}${p.featured?'<span class="badge">Featured</span>':''}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    // Quick filters reset the hierarchy + rebuild lists based on the new base set
    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        state.quick = a.dataset.quick || 'all';

        state.category = null;
        state.theme = null;
        state.type = null;
        state.q = '';
        if(elQ) elQ.value = '';

        setActiveQuick(state.quick);
        renderCategoryList();
        renderThemeList();
        renderTypeList();
        applyFilters();
      });
    });

    elCategory.addEventListener('click', e=>{
      const a = e.target.closest('a[data-cat]');
      if(!a) return;
      e.preventDefault();
      state.category = a.dataset.cat;
      state.theme = null;
      state.type = null;
      renderCategoryList();
      renderThemeList();
      renderTypeList();
      applyFilters();
    });

    elTheme.addEventListener('click', e=>{
      const a = e.target.closest('a[data-theme]');
      if(!a) return;
      e.preventDefault();
      state.theme = a.dataset.theme;
      state.type = null;
      renderThemeList();
      renderTypeList();
      applyFilters();
    });

    elType.addEventListener('click', e=>{
      const a = e.target.closest('a[data-type]');
      if(!a) return;
      e.preventDefault();
      state.type = a.dataset.type;
      renderTypeList();
      applyFilters();
    });

    if(elQ) elQ.addEventListener('input', ()=>{ state.q = elQ.value.trim(); applyFilters(); });
    if(elSort) elSort.addEventListener('change', ()=>{ state.sort = elSort.value; applyFilters(); });

    // Initial render
    setActiveQuick(state.quick);
    renderCategoryList();
    renderThemeList();
    renderTypeList();
    applyFilters();
  };
})();