(() => {
  const config = window.MOBILE_CONFIG;
  const desktopLink = document.querySelector('.desktop-link');
  if (location.pathname.endsWith('mobile-china.html')) desktopLink.href = 'china.html?desktop=1';
  if (location.pathname.endsWith('mobile-italy.html')) desktopLink.href = 'italy.html?desktop=1';
  if (location.pathname.endsWith('mobile-world.html')) desktopLink.href = 'world.html?desktop=1';
  const $ = s => document.querySelector(s);
  const state = { filter: 'all', query: '', detail: null };
  const map = L.map('map', { zoomControl: true }).setView(config.center, config.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
  const markers = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 42 }); map.addLayer(markers);
  const data = (config.data() || []).filter(x => Number.isFinite(+x.lat) && Number.isFinite(+x.lng));
  const color = item => config.colors[item.kind] || '#64748b';
  const normalize = item => ({ ...item, label: item.name || item.zh || item.en, sublabel: config.sublabel(item), kind: config.kind(item), wiki: item.wiki || (item.qid ? `https://www.wikidata.org/wiki/${item.qid}` : '') });
  const sites = data.map(normalize);
  const icon = item => L.divIcon({ className:'', iconSize:[20,20], iconAnchor:[10,10], html:`<span style="display:block;width:16px;height:16px;border:3px solid #fff;border-radius:50%;background:${color(item)};box-shadow:0 1px 4px #0008"></span>` });
  const markerBySite = new Map(sites.map(s => [s, L.marker([s.lat,s.lng], {icon:icon(s)}).on('click', () => openDetail(s))]));
  function updateLabels(){
    const show = map.getZoom() >= (config.labelZoom || 8);
    sites.forEach(s => {
      const marker = markerBySite.get(s);
      if (show) {
        if (!marker.getTooltip()) marker.bindTooltip(esc(s.label), { permanent:true, direction:'top', offset:[0,-10], className:'mobile-label', opacity:.96 });
        marker.openTooltip();
      } else if (marker.getTooltip()) { marker.closeTooltip(); marker.unbindTooltip(); }
    });
  }
  function visible(){ const q=state.query.trim().toLowerCase(), bounds=map.getBounds(); return sites.filter(s => bounds.contains([s.lat,s.lng]) && (state.filter==='all'||s.kind===state.filter) && (!q || `${s.label} ${s.sublabel}`.toLowerCase().includes(q))); }
  function render(){ const matching=visible(); markers.clearLayers(); markers.addLayers(matching.map(s=>markerBySite.get(s))); $('#resultMeta').textContent=`当前视野内 ${matching.length} 个地点`; $('#results').innerHTML=matching.length?matching.map((s,i)=>`<button class="result" data-i="${i}"><i class="dot" style="background:${color(s)}"></i><span><strong>${esc(s.label)}</strong><span>${esc(s.sublabel)}</span></span></button>`).join(''):'<div class="empty">当前视野内没有匹配的地点</div>'; [...document.querySelectorAll('.result')].forEach(b=>b.onclick=()=>openDetail(matching[+b.dataset.i])); }
  function openDetail(s){ state.detail=s; $('#results').style.display='none'; $('#resultMeta').style.display='none'; $('#detail').classList.add('show'); $('#sheet').classList.add('expanded'); $('#detail').innerHTML=`<button class="detail-back" type="button">← 返回列表</button><h2>${esc(s.label)}</h2><div class="meta">${esc(s.sublabel)}</div>${s.intro?`<p>${esc(s.intro)}</p>`:''}<div class="detail-actions"><button class="action secondary" id="locate" type="button">在地图定位</button>${s.wiki?`<a class="action" target="_blank" rel="noopener" href="${escAttr(s.wiki)}">查看资料</a>`:''}</div>`; $('.detail-back').onclick=closeDetail; $('#locate').onclick=()=>{map.flyTo([s.lat,s.lng],Math.max(map.getZoom(),12),{duration:.5}); $('#sheet').classList.remove('expanded');}; map.flyTo([s.lat,s.lng],Math.max(map.getZoom(),10),{duration:.5}); }
  function closeDetail(){state.detail=null; $('#detail').classList.remove('show'); $('#detail').innerHTML=''; $('#results').style.display='block'; $('#resultMeta').style.display='block';}
  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));} function escAttr(v){return esc(v);}
  $('#search').oninput=e=>{state.query=e.target.value;render()}; document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('on',x===b));render()}); $('#handle').onclick=()=>$('#sheet').classList.toggle('expanded'); map.on('moveend',render); map.on('zoomend',updateLabels); render(); updateLabels();
})();
