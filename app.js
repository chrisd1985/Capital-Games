
(function(){
  const allProducts = (window.PRODUCTS || []).filter(p => p.status === 'active');

  function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));}
  function uniq(a){return [...new Set(a)];}

  window.CG_initShop = function(){
    const grid = document.getElementById('shopGrid');
    const tree = document.getElementById('filterTree');
    const count = document.getElementById('resultCount');
    const qInput = document.getElementById('q');
    const countAll = document.getElementById('countAll');
    const countFeatured = document.getElementById('countFeatured');

    const state = { quick:'all', cat:null, theme:null, type:null, q:'' };

    countAll.textContent = allProducts.length;
    countFeatured.textContent = allProducts.filter(p=>p.featured).length;

    function baseSet(){
      return state.quick === 'featured'
        ? allProducts.filter(p=>p.featured)
        : allProducts;
    }

    function buildTree(){
      const base = baseSet();
      const cats = uniq(base.map(p=>p.category)).sort();

      tree.innerHTML = cats.map(cat=>{
        const themes = uniq(base.filter(p=>p.category===cat).map(p=>p.theme)).sort();
        return `
          <details ${state.cat===cat?'open':''}>
            <summary>${escapeHtml(cat)}</summary>
            ${themes.map(th=>{
              const types = uniq(base.filter(p=>p.category===cat && p.theme===th).map(p=>p.type)).sort();
              return `
                <details style="margin-left:14px" ${state.theme===th?'open':''}>
                  <summary>${escapeHtml(th)}</summary>
                  ${types.map(t=>`
                    <a href="#" class="pill" style="margin-left:28px"
                       data-cat="${escapeHtml(cat)}"
                       data-theme="${escapeHtml(th)}"
                       data-type="${escapeHtml(t)}">${escapeHtml(t)}</a>
                  `).join('')}
                </details>
              `;
            }).join('')}
          </details>
        `;
      }).join('');
    }

    function apply(){
      let items = baseSet();
      if(state.cat) items = items.filter(p=>p.category===state.cat);
      if(state.theme) items = items.filter(p=>p.theme===state.theme);
      if(state.type) items = items.filter(p=>p.type===state.type);
      if(state.q) items = items.filter(p=>p.title.toLowerCase().includes(state.q));

      count.textContent = `${items.length} items shown`;

      grid.innerHTML = items.map(p=>`
        <div class="card">
          <img src="${escapeHtml(p.image)}">
          <div class="card-body">
            <p class="title">${escapeHtml(p.title)}</p>
            <a class="btn" href="${escapeHtml(p.link)}" target="_blank">View on eBay</a>
          </div>
        </div>
      `).join('');
    }

    document.querySelectorAll('[data-quick]').forEach(a=>{
      a.onclick = e=>{
        e.preventDefault();
        state.quick = a.dataset.quick;
        state.cat = state.theme = state.type = null;
        buildTree();
        apply();
      };
    });

    tree.onclick = e=>{
      const a = e.target.closest('[data-type]');
      if(!a) return;
      e.preventDefault();
      state.cat = a.dataset.cat;
      state.theme = a.dataset.theme;
      state.type = a.dataset.type;
      apply();
    };

    qInput.oninput = ()=>{ state.q = qInput.value.toLowerCase(); apply(); };

    buildTree();
    apply();
  };
})();
