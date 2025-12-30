
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

  /* ================= Featured (Home) ================= */
  window.CG_renderFeatured = function(){
    const grid = document.getElementById('featuredGrid');
    if(!grid) return;

    const featured = allProducts.filter(p => p.featured);
    const count = featured.length >= 8 ? 8 : (featured.length >= 4 ? 4 : featured.length);

    grid.innerHTML = featured.slice(0, count).map(p => `
      <div class="card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
        <div class="card-body">
          <p class="title">${escapeHtml(p.title)}</p>
          <p class="meta">${escapeHtml(p.category)} • ${escapeHtml(p.theme)}</p>
          <a class="btn" href="${escapeHtml(p.link)}" target="_blank">View on eBay</a>
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

    const state = {
      quick: 'all',
      category: null,
      theme: null,
      type: null,
      q: '',
      sort: 'az'
    };

    function renderCategoryList(){
      const baseSet =
        state.quick === 'featured'
          ? allProducts.filter(p => p.featured)
          : allProducts;

      const cats = uniq(baseSet.map(p => p.category)).sort((a,b)=>a.localeCompare(b));

      elCategory.innerHTML = cats.map(cat => {
        const n = baseSet.filter(p => p.category === cat).length;
        const active = state.category === cat;
        return `
          <a class="pill ${active?'active':''}" href="#" data-cat="${escapeHtml(cat)}">
            <span>${escapeHtml(cat)}</span>
            <span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function renderThemeList(){
      if(!state.category){
        elTheme.innerHTML = '<div style="color:#777;font-size:.9rem;">Select a category</div>';
        return;
      }
      const baseSet =
        state.quick === 'featured'
          ? allProducts.filter(p => p.featured)
          : allProducts;

      const themes = uniq(
        baseSet.filter(p => p.category === state.category).map(p => p.theme)
      ).sort((a,b)=>a.localeCompare(b));

      elTheme.innerHTML = themes.map(th => {
        const n = baseSet.filter(p => p.category===state.category && p.theme===th).length;
        const active = state.theme === th;
        return `
          <a class="pill ${active?'active':''}" href="#" data-theme="${escapeHtml(th)}">
            <span>${escapeHtml(th)}</span>
            <span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function renderTypeList(){
      if(!state.category || !state.theme){
        elType.innerHTML = '<div style="color:#777;font-size:.9rem;">Select a theme</div>';
        return;
      }
      const baseSet =
        state.quick === 'featured'
          ? allProducts.filter(p => p.featured)
          : allProducts;

      const types = uniq(
        baseSet
          .filter(p => p.category===state.category && p.theme===state.theme)
          .map(p => p.type)
      ).sort((a,b)=>a.localeCompare(b));

      elType.innerHTML = types.map(t => {
        const n = baseSet.filter(
          p => p.category===state.category && p.theme===state.theme && p.type===t
        ).length;
        const active = state.type === t;
        return `
          <a class="pill ${active?'active':''}" href="#" data-type="${escapeHtml(t)}">
            <span>${escapeHtml(t)}</span>
            <span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function applyFilters(){
      let items = [...allProducts];

      if(state.quick === 'featured') items = items.filter(p => p.featured);
      if(state.category) items = items.filter(p => p.category === state.category);
      if(state.theme) items = items.filter(p => p.theme === state.theme);
      if(state.type) items = items.filter(p => p.type === state.type);
      if(state.q){
        const q = state.q.toLowerCase();
        items = items.filter(p => p.title.toLowerCase().includes(q));
      }

      items.sort((a,b)=>{
        if(state.sort === 'za') return b.title.localeCompare(a.title);
        if(state.sort === 'featured') return (b.featured - a.featured) || a.title.localeCompare(b.title);
        return a.title.localeCompare(b.title);
      });

      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown`;

      elGrid.innerHTML = items.map(p => `
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}</p>
            <p class="meta">${escapeHtml(p.category)} • ${escapeHtml(p.theme)} • ${escapeHtml(p.type)}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        state.quick = a.dataset.quick;
        state.category = null;
        state.theme = null;
        state.type = null;
        state.q = '';
        renderCategoryList();
        renderThemeList();
        renderTypeList();
        applyFilters();
      });
    });

    elCategory.addEventListener('click', e=>{
      const a = e.target.closest('[data-cat]');
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
      const a = e.target.closest('[data-theme]');
      if(!a) return;
      e.preventDefault();
      state.theme = a.dataset.theme;
      state.type = null;
      renderThemeList();
      renderTypeList();
      applyFilters();
    });

    elType.addEventListener('click', e=>{
      const a = e.target.closest('[data-type]');
      if(!a) return;
      e.preventDefault();
      state.type = a.dataset.type;
      renderTypeList();
      applyFilters();
    });

    if(elQ) elQ.addEventListener('input', ()=>{ state.q = elQ.value; applyFilters(); });
    if(elSort) elSort.addEventListener('change', ()=>{ state.sort = elSort.value; applyFilters(); });

    renderCategoryList();
    renderThemeList();
    renderTypeList();
    applyFilters();
  };
})();
