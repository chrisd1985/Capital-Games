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

  // ---------- Featured (Home) ----------
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
          <p class="meta">${escapeHtml(p.category)} • ${escapeHtml(p.theme)}</p>
          <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
        </div>
      </div>
    `).join('');
  };

  // ---------- Shop ----------
  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elCount = document.getElementById('resultCount');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');

    const elCategory = document.getElementById('categoryList');
    const elTheme = document.getElementById('themeList');
    const elType = document.getElementById('typeList');

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

    // top counts
    if(elCountAll) elCountAll.textContent = String(allProducts.length);
    if(elCountFeatured) elCountFeatured.textContent = String(allProducts.filter(p=>p.featured).length);

    function setActiveQuick(val){
      document.querySelectorAll('[data-quick]').forEach(a=>{
        a.classList.toggle('active', a.dataset.quick === val);
      });
    }

    function countFor(filterFn){
      return allProducts.filter(filterFn).length;
    }

    function renderCategoryList(){
      const cats = uniq(allProducts.map(p=>p.category)).sort((a,b)=>a.localeCompare(b));
      elCategory.innerHTML = cats.map(cat => {
        const n = countFor(p => p.category === cat);
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
      const themes = uniq(allProducts.filter(p=>p.category===state.category).map(p=>p.theme))
        .sort((a,b)=>a.localeCompare(b));
      elTheme.innerHTML = themes.map(th => {
        const n = countFor(p => p.category===state.category && p.theme===th);
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
      const types = uniq(allProducts
        .filter(p=>p.category===state.category && p.theme===state.theme)
        .map(p=>p.type)).sort((a,b)=>a.localeCompare(b));
      elType.innerHTML = types.map(t => {
        const n = countFor(p => p.category===state.category && p.theme===state.theme && p.type===t);
        const active = state.type === t;
        return `
          <a class="pill ${active?'active':''}" href="#" data-type="${escapeHtml(t)}">
            <span>${escapeHtml(t)}</span><span class="smallcount">${n}</span>
          </a>
        `;
      }).join('');
    }

    function applyFilters(){
      let items = [...allProducts];

      if(state.quick === 'featured') items = items.filter(p=>p.featured);
      if(state.category) items = items.filter(p=>p.category===state.category);
      if(state.theme) items = items.filter(p=>p.theme===state.theme);
      if(state.type) items = items.filter(p=>p.type===state.type);

      if(state.q){
        const q = state.q.toLowerCase();
        items = items.filter(p => (p.title||'').toLowerCase().includes(q));
      }

      switch(state.sort){
        case 'za': items.sort((a,b)=>b.title.localeCompare(a.title)); break;
        case 'cat': items.sort((a,b)=>(a.category+a.title).localeCompare(b.category+b.title)); break;
        case 'theme': items.sort((a,b)=>(a.theme+a.title).localeCompare(b.theme+b.title)); break;
        case 'featured': items.sort((a,b)=>(b.featured - a.featured) || a.title.localeCompare(b.title)); break;
        default: items.sort((a,b)=>a.title.localeCompare(b.title)); break;
      }

      const path = [state.category, state.theme, state.type].filter(Boolean).join(" → ");
      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown${path?` in ${path}`:''}`;

      elGrid.innerHTML = items.map(p=>`
        <div class="card">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}${p.featured?'<span class="badge">Featured</span>':''}</p>
            <p class="meta">${escapeHtml(p.category)} • ${escapeHtml(p.theme)} • ${escapeHtml(p.type)}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    // Event handlers
    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        state.quick = a.dataset.quick;
        setActiveQuick(state.quick);
        applyFilters();
      });
    });

    elCategory.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-cat]');
      if(!a) return;
      e.preventDefault();
      state.category = a.dataset.cat;
      // reset lower levels
      state.theme = null;
      state.type = null;
      // refresh lists
      renderCategoryList();
      renderThemeList();
      renderTypeList();
      applyFilters();
    });

    elTheme.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-theme]');
      if(!a) return;
      e.preventDefault();
      state.theme = a.dataset.theme;
      state.type = null;
      renderThemeList();
      renderTypeList();
      applyFilters();
    });

    elType.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-type]');
      if(!a) return;
      e.preventDefault();
      state.type = a.dataset.type;
      renderTypeList();
      applyFilters();
    });

    if(elQ){
      elQ.addEventListener('input', ()=>{
        state.q = elQ.value.trim();
        applyFilters();
      });
    }
    if(elSort){
      elSort.addEventListener('change', ()=>{
        state.sort = elSort.value;
        applyFilters();
      });
    }

    // Initial render
    setActiveQuick(state.quick);
    renderCategoryList();
    renderThemeList();
    renderTypeList();
    applyFilters();
  };
})();