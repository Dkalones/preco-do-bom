(() => {
'use strict';
if (window.__pdbPreparacoesReady) return;
window.__pdbPreparacoesReady = true;
S.preparacoes = Array.isArray(S.preparacoes) ? S.preparacoes : [];
const $p = s => document.querySelector(s);
const idp = () => 'p' + Date.now() + Math.random().toString(36).slice(2,7);
const prepById = id => S.preparacoes.find(p => p.id === id);
const money = n => brl(Number.isFinite(n) ? n : 0);
const fam = u => FAM[u] || null;
function prepCost(id, stack=[]) {
  const p=prepById(id);
  if(!p || stack.includes(id)) return {cost:0,valid:false};
  let total=0,valid=true;
  (p.ings||[]).forEach(g=>{const c=rcost(g);if(Number.isFinite(c))total+=c;else valid=false;});
  (p.parts||[]).forEach(x=>{
    const child=prepCost(x.id,[...stack,id]), cp=prepById(x.id);
    if(!child.valid || !cp){valid=false;return;}
    total += child.unitCost * num(x.q);
  });
  const yieldQty=num(p.rend);
  if(yieldQty<=0)valid=false;
  return {cost:total,unitCost:yieldQty>0?total/yieldQty:0,valid};
}
function usedPrepCost(it) {
  let total=0,valid=true;
  (it.preps||[]).forEach(x=>{
    const p=prepById(x.id),c=prepCost(x.id);
    if(!p||!c.valid){valid=false;return;}
    total += c.unitCost*num(x.q);
  });
  return {total,valid};
}
const baseCalc=calc;
calc=function(it){
  const c=baseCalc(it),extra=usedPrepCost(it),total=c.total+extra.total,un=total/(num(it.rend)||1)+(S.cfg.fm==='R$'?num(S.cfg.fixo):0);
  const perc=c.perc,sug=perc<100?un/(1-perc/100):NaN,dv=perc+num(S.cfg.deliv),sugD=dv<100?un/(1-dv/100):NaN;
  const ad=num(it.final)>0?num(it.final):(S.cfg.a90&&isFinite(sug)?r90(sug):sug);
  const luc=ad-un-ad*c.tx/100,pd=ad-(S.cfg.dm==='R$'?num(S.cfg.desc):ad*num(S.cfg.desc)/100),lucD=pd-un-pd*c.tx/100;
  return {...c,ing:c.ing+extra.total,total,un,sug,sugD,ad,luc,pd,lucD,mg:ad>0?luc/ad*100:NaN,cmv:ad>0?un/ad*100:NaN,prepValid:extra.valid,prepCost:extra.total};
};
const oldRenderEd=renderEd;
renderEd=function(){
  oldRenderEd();
  const it=cur(); if(!it)return;
  it.preps=Array.isArray(it.preps)?it.preps:[];
  const options=S.preparacoes.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.nome)+' · '+esc(p.tipo||'Preparação')+'</option>').join('');
  const rows=it.preps.map((x,i)=>{
    const p=prepById(x.id),cost=p?prepCost(p.id):{unitCost:0,valid:false};
    return '<div class="ing" data-prep-row="'+i+'"><div><label>Preparação</label><select data-prep-field="id"><option value="">Selecione</option>'+S.preparacoes.map(z=>'<option value="'+esc(z.id)+'" '+(z.id===x.id?'selected':'')+'>'+esc(z.nome)+'</option>').join('')+'</select></div><div><label>Consumo ('+(p?esc(p.un):'unidade')+')</label><input type="number" min="0" step="any" data-prep-field="q" value="'+esc(x.q??'')+'"></div><div><label>Custo estimado</label><div style="padding:10px 0;font-weight:700">'+(p&&cost.valid?money(cost.unitCost*num(x.q)): '—')+'</div></div><button class="x" type="button" data-prep-remove="'+i+'">✕</button></div>';
  }).join('');
  const card=document.createElement('div');card.className='card';card.id='pdb-product-preps';card.innerHTML='<h2>Preparações / componentes</h2><p class="tip">Adicione massas, recheios, molhos e outras bases. O custo entra automaticamente na ficha técnica e acompanha alterações nas preparações.</p>'+rows+'<button type="button" id="pdb-add-product-prep">+ Adicionar preparação</button>'+(S.preparacoes.length?'':'<p class="tip">Ainda não há preparações cadastradas. Acesse Produção → Preparações para criar a primeira.</p>');
  const cards=$p('#ed').querySelectorAll('.card');const ingredients=[...cards].find(c=>c.textContent.includes('Ingredientes / insumos'));
  if(ingredients)ingredients.insertAdjacentElement('afterend',card);else $p('#ed').appendChild(card);
};
const oldShow=show;
show=function(v){oldShow(v);if(v==='preparacoes')renderPreparacoes();};
function ingredientRows(p){
 return (p.ings||[]).map((g,i)=>'<div class="ing" data-ping="'+i+'"><div><label>Insumo</label><input list="pdb-prep-insumos" data-ping-field="n" value="'+esc(g.n||'')+'" placeholder="Farinha, frango..."></div><div><label>Preço pago (R$)</label><input type="number" min="0" step=".01" data-ping-field="preco" value="'+esc(g.preco??'')+'"></div><div><label>Qtd. comprada</label><input type="number" min="0" step="any" data-ping-field="qtd" value="'+esc(g.qtd??'')+'"></div><div><label>Unid.</label><select data-ping-field="un">'+opts(g.un||'kg')+'</select></div><div><label>Qtd. usada</label><input type="number" min="0" step="any" data-ping-field="uso" value="'+esc(g.uso??'')+'"></div><div><label>Unid. uso</label><select data-ping-field="uun">'+opts(g.uun||g.un||'g')+'</select></div><div><label>Perda %</label><input type="number" min="0" max="95" data-ping-field="perda" value="'+esc(g.perda||0)+'"></div><div><label>Custo</label><b>'+money(rcost(g)||0)+'</b></div><button type="button" class="x" data-ping-remove="'+i+'">✕</button></div>').join('');
}
function renderPreparacoes(){
 const root=$p('#v-preparacoes');if(!root)return;
 const list=S.preparacoes.map(p=>{const c=prepCost(p.id);return '<button class="item '+(p.id===S._prepSel?'on':'')+'" data-prep-select="'+esc(p.id)+'"><div><b>'+esc(p.nome)+'</b><small>'+esc(p.tipo||'Preparação')+' · rendimento '+esc(p.rend)+' '+esc(p.un)+'</small></div><div class="pr">'+money(c.cost)+'<em>'+money(c.unitCost)+' / '+esc(p.un)+'</em></div></button>'}).join('');
 const p=prepById(S._prepSel);
 root.innerHTML='<div class="ph"><div><h1>Preparações</h1><p class="sub2">Cadastre massas, recheios e bases reutilizáveis em várias receitas.</p></div><button class="p" id="pdb-new-prep">+ Nova preparação</button></div><div class="layout"><div class="card"><h2>Biblioteca</h2><p class="tip">Uma preparação pode ser usada em vários produtos e também pode conter outra preparação.</p>'+ (list||'<p class="tip">Nenhuma preparação cadastrada ainda.</p>')+'</div><div id="pdb-prep-editor">'+(p?editorHtml(p):'<div class="card empty"><h2>Monte sua biblioteca</h2><p>Crie uma preparação para começar a reutilizar massas, recheios e outras bases.</p></div>')+'</div></div>';
}
function editorHtml(p){
 const parts=(p.parts||[]).map((x,i)=>'<div class="ing" data-ppart="'+i+'"><div><label>Preparação incluída</label><select data-ppart-field="id"><option value="">Selecione</option>'+S.preparacoes.filter(z=>z.id!==p.id&&!wouldCycle(p.id,z.id)).map(z=>'<option value="'+esc(z.id)+'" '+(z.id===x.id?'selected':'')+'>'+esc(z.nome)+' ('+esc(z.un)+')</option>').join('')+'</select></div><div><label>Quantidade usada ('+(prepById(x.id)?.un||'un')+')</label><input type="number" min="0" step="any" data-ppart-field="q" value="'+esc(x.q??'')+'"></div><button class="x" type="button" data-ppart-remove="'+i+'">✕</button></div>').join('');
 return '<div class="card"><h2>Ficha da preparação</h2><div class="g2"><div><label>Nome</label><input data-pf="nome" value="'+esc(p.nome)+'" placeholder="Ex.: Massa tradicional"></div><div><label>Tipo</label><select data-pf="tipo">'+['Massa','Recheio','Molho','Cobertura','Empanamento','Calda','Outro'].map(x=>'<option '+(p.tipo===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div><label>Rendimento total</label><input type="number" min="0.001" step="any" data-pf="rend" value="'+esc(p.rend)+'"></div><div><label>Unidade do rendimento</label><select data-pf="un">'+opts(p.un||'g')+'</select></div></div><h3 style="margin-top:18px">Insumos diretos</h3><datalist id="pdb-prep-insumos">'+Object.values(S.lib).map(l=>'<option value="'+esc(l.n)+'">').join('')+'</datalist>'+ingredientRows(p)+'<button type="button" id="pdb-add-ping">+ Adicionar insumo</button><h3 style="margin-top:18px">Outras preparações</h3><p class="tip">Use esta opção para criar bases compostas. O sistema bloqueia dependências circulares.</p>'+parts+'<button type="button" id="pdb-add-ppart">+ Incluir preparação</button><div class="res" style="margin-top:16px"><h2>Custo da preparação</h2><div class="row"><span>Custo total do lote</span><b>'+money(prepCost(p.id).cost)+'</b></div><div class="row"><span>Custo por '+esc(p.un)+'</span><b>'+money(prepCost(p.id).unitCost)+'</b></div></div><div class="ex" style="margin-top:14px"><button class="x" type="button" id="pdb-delete-prep">Excluir preparação</button></div></div>';
}
function wouldCycle(parent,child,seen=[]){if(parent===child)return true;if(seen.includes(child))return false;const c=prepById(child);return !!c&&(c.parts||[]).some(x=>x.id===parent||wouldCycle(parent,x.id,[...seen,child]));}
function newPrep(){const p={id:idp(),nome:'',tipo:'Massa',rend:1,un:'g',ings:[],parts:[]};S.preparacoes.push(p);S._prepSel=p.id;save();renderPreparacoes();}
document.addEventListener('click',e=>{
 const t=e.target;
 if(t.id==='pdb-new-prep'){newPrep();return;}
 if(t.dataset.prepSelect){S._prepSel=t.dataset.prepSelect;renderPreparacoes();return;}
 if(t.id==='pdb-add-ping'){const p=prepById(S._prepSel);if(p){p.ings.push(newIng());save();renderPreparacoes();}return;}
 if(t.dataset.pingRemove!==undefined){const p=prepById(S._prepSel);if(p){p.ings.splice(+t.dataset.pingRemove,1);save();renderPreparacoes();}return;}
 if(t.id==='pdb-add-ppart'){const p=prepById(S._prepSel);if(p){p.parts.push({id:'',q:0});save();renderPreparacoes();}return;}
 if(t.dataset.ppartRemove!==undefined){const p=prepById(S._prepSel);if(p){p.parts.splice(+t.dataset.ppartRemove,1);save();renderPreparacoes();}return;}
 if(t.id==='pdb-delete-prep'){const id=S._prepSel;if(confirm('Excluir esta preparação? Produtos ou outras preparações que a utilizam ficarão com referência inválida.')){S.preparacoes=S.preparacoes.filter(p=>p.id!==id);S.items.forEach(it=>it.preps=(it.preps||[]).filter(x=>x.id!==id));S.preparacoes.forEach(p=>p.parts=(p.parts||[]).filter(x=>x.id!==id));S._prepSel=null;save();renderPreparacoes();}return;}
 if(t.id==='pdb-add-product-prep'){const it=cur();if(it){it.preps=it.preps||[];it.preps.push({id:'',q:0,un:'g'});save();renderEd();}return;}
 if(t.dataset.prepRemove!==undefined){const it=cur();if(it){it.preps.splice(+t.dataset.prepRemove,1);save();renderEd();}return;}
});
document.addEventListener('input',e=>{
 const t=e.target,p=prepById(S._prepSel);if(!p)return;
 if(t.dataset.pf){p[t.dataset.pf]=t.value;save();}
 if(t.dataset.pingField){const g=p.ings[+t.closest('[data-ping]').dataset.ping],f=t.dataset.pingField;g[f]=t.value;if(f==='n'){const key=g.n.trim().toLowerCase();if(S.lib[key])Object.assign(g,S.lib[key],{n:g.n});}save();}
 if(t.dataset.ppartField){p.parts[+t.closest('[data-ppart]').dataset.ppart][t.dataset.ppartField]=t.value;save();}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.pf){const p=prepById(S._prepSel);if(p){p[t.dataset.pf]=t.value;save();renderPreparacoes();}}
 if(t.dataset.pingField){const p=prepById(S._prepSel);if(p){const g=p.ings[+t.closest('[data-ping]').dataset.ping],f=t.dataset.pingField;g[f]=t.value;const key=(g.n||'').trim().toLowerCase();if(key&&num(g.preco)>0)S.lib[key]={n:g.n,preco:g.preco,qtd:g.qtd,un:g.un};save();renderPreparacoes();}}
 if(t.dataset.ppartField){const p=prepById(S._prepSel);if(p){const x=p.parts[+t.closest('[data-ppart]').dataset.ppart],f=t.dataset.ppartField;x[f]=t.value;if(f==='id'&&wouldCycle(p.id,x.id)){x.id='';toast('Essa combinação criaria uma dependência circular.');}save();renderPreparacoes();}}
 if(t.dataset.prepField){const it=cur(),x=it?.preps?.[+t.closest('[data-prep-row]').dataset.prepRow];if(x){x[t.dataset.prepField]=t.value;if(t.dataset.prepField==='id'){const p=prepById(x.id);x.un=p?.un||'g';}save();renderEd();}}
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.prepField==='q'){const it=cur(),x=it?.preps?.[+t.closest('[data-prep-row]').dataset.prepRow];if(x){x.q=t.value;refresh();}}});
const side=[...document.querySelectorAll('.side .nav-group')].find(g=>g.textContent.includes('PRODUÇÃO'));
if(side){const b=document.createElement('button');b.dataset.v='preparacoes';b.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 10h18l-2 9H5l-2-9z"/><path d="M7 10l5-6 5 6"/><path d="M8 14h8"/></svg><span>Preparações</span>';b.style.cssText='display:flex;align-items:center;gap:12px';const ref=side.querySelector('[data-v="insumos"]');ref?.insertAdjacentElement('beforebegin',b);b.addEventListener('click',()=>show('preparacoes'));}
const view=document.createElement('section');view.className='view';view.id='v-preparacoes';view.hidden=true;document.querySelector('.content').appendChild(view);

})();
