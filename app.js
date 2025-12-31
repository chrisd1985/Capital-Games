
(function(){
  const all = (window.PRODUCTS||[]).filter(p=>p.status==='active');
  const state={quick:'all',cat:null,theme:null,type:null};

  const grid=document.getElementById('shopGrid');
  const tree=document.getElementById('filterTree');
  const rc=document.getElementById('resultCount');

  document.getElementById('countAll').textContent=all.length;
  document.getElementById('countFeatured').textContent=all.filter(p=>p.featured).length;

  function base(){
    return state.quick==='featured'?all.filter(p=>p.featured):all;
  }

  function buildTree(){
    const b=base();
    const cats=[...new Set(b.map(p=>p.category))];
    tree.innerHTML=cats.map(c=>{
      const themes=[...new Set(b.filter(p=>p.category===c).map(p=>p.theme))];
      return `
        <div>
          <strong data-cat="${c}">${c}</strong>
          ${themes.map(t=>{
            const types=[...new Set(b.filter(p=>p.category===c&&p.theme===t).map(p=>p.type))];
            return `
              <div style="margin-left:12px">
                <em data-theme="${t}" data-cat="${c}">${t}</em>
                ${types.map(tp=>`
                  <div style="margin-left:12px">
                    <a href="#" data-type="${tp}" data-theme="${t}" data-cat="${c}">${tp}</a>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  }

  function apply(){
    let items=base();
    if(state.cat) items=items.filter(p=>p.category===state.cat);
    if(state.theme) items=items.filter(p=>p.theme===state.theme);
    if(state.type) items=items.filter(p=>p.type===state.type);
    rc.textContent=`${items.length} items shown`;
    grid.innerHTML=items.map(p=>`
      <div class="card">
        <img src="${p.image}">
        <p>${p.title}</p>
        <a href="${p.link}" target="_blank">View on eBay</a>
      </div>
    `).join('');
  }

  document.querySelectorAll('[data-quick]').forEach(a=>{
    a.onclick=e=>{
      e.preventDefault();
      state.quick=a.dataset.quick;
      state.cat=state.theme=state.type=null;
      buildTree(); apply();
    };
  });

  tree.onclick=e=>{
    const el=e.target;
    if(el.dataset.cat && !el.dataset.theme){
      state.cat=el.dataset.cat; state.theme=state.type=null;
    }
    if(el.dataset.theme){
      state.cat=el.dataset.cat; state.theme=el.dataset.theme; state.type=null;
    }
    if(el.dataset.type){
      state.cat=el.dataset.cat; state.theme=el.dataset.theme; state.type=el.dataset.type;
    }
    apply();
  };

  buildTree(); apply();
})();
