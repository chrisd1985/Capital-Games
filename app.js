(function(){
  const allProducts = (window.PRODUCTS || [])
    .map(p => ({
      ...p,
      status: (p.status || '').toLowerCase(),
      category: p.category || 'Other',
      theme: p.theme || 'General',
      type: p.type || 'Misc',
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

  // ---------- Shop / Category pages ----------
  function getInitialFiltersFromBody(){
    const b = document.body;
    return {
      quick: b.dataset.quick || 'all', // all | featured
      category: b.dataset.category || null,
      theme: b.dataset.theme || null,
      type: b.dataset.type || null
    };
  }

  window.CG_initShop = function(){
    const elGrid = document.getElementById('shopGrid');
    const elCount = document.getElementById('resultCount');
    const elTree = document.getElementById('categoryTree');
    const elQ = document.getElementById('q');
    const elSort = document.getElementById('sort');
    if(!elGrid || !elCount || !elTree) return;

    const init = getInitialFiltersFromBody();
    const state = {
      quick: init.quick,
      category: init.category,
      theme: init.theme,
      type: init.type,
      q: '',
      sort: 'az'
    };

    function setActiveQuick(val){
      document.querySelectorAll('[data-quick]').forEach(a=>{
        a.classList.toggle('active', a.dataset.quick === val);
      });
    }

    function buildTree(){
      const categories = uniq(allProducts.map(p => p.category)).sort((a,b)=>a.localeCompare(b));
      elTree.innerHTML = categories.map(cat => {
        const themes = uniq(allProducts.filter(p => p.category===cat).map(p => p.theme)).sort((a,b)=>a.localeCompare(b));
        const themeHtml = themes.map(th => {
          const types = uniq(allProducts.filter(p => p.category===cat && p.theme===th).map(p => p.type)).sort((a,b)=>a.localeCompare(b));
          const typeHtml = types.map(t => `
            <a class="pill subpill" href="#" data-cat="${escapeHtml(cat)}" data-theme="${escapeHtml(th)}" data-type="${escapeHtml(t)}">${escapeHtml(t)}</a>
          `).join('');
          return `
            <details ${state.category===cat && state.theme===th ? 'open' : ''}>
              <summary>${escapeHtml(th)}</summary>
              ${typeHtml}
            </details>
          `;
        }).join('');
        return `
          <details ${state.category===cat ? 'open' : ''}>
            <summary>${escapeHtml(cat)}</summary>
            ${themeHtml}
          </details>
        `;
      }).join('');
    }

    function applyFilters(){
      let items = [...allProducts];

      if(state.quick === 'featured'){
        items = items.filter(p => p.featured);
      }
      if(state.category){
        items = items.filter(p => p.category === state.category);
      }
      if(state.theme){
        items = items.filter(p => p.theme === state.theme);
      }
      if(state.type){
        items = items.filter(p => p.type === state.type);
      }
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

      elCount.textContent = `${items.length} item${items.length===1?'':'s'} shown`;

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

    // Events: quick filters
    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        state.quick = a.dataset.quick;
        setActiveQuick(state.quick);
        applyFilters();
      });
    });

    // Events: tree clicks (event delegation)
    elTree.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-cat]');
      if(!a) return;
      e.preventDefault();
      state.category = a.dataset.cat || null;
      state.theme = a.dataset.theme || null;
      state.type = a.dataset.type || null;

      // visual active pills
      elTree.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
      a.classList.add('active');

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

    // initialize UI
    setActiveQuick(state.quick);
    buildTree();

    // mark active leaf if initial filters provided
    if(state.category && state.theme && state.type){
      const selector = `a[data-cat="${CSS.escape(state.category)}"][data-theme="${CSS.escape(state.theme)}"][data-type="${CSS.escape(state.type)}"]`;
      const leaf = elTree.querySelector(selector);
      if(leaf) leaf.classList.add('active');
    }

    applyFilters();
  };
})();