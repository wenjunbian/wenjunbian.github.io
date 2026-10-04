/* Progressive navigation for the standalone file; no network or storage. */
(()=>{
 const pages=[...document.querySelectorAll('[data-site-page]')],single=document.body.dataset.siteMode==='single';
 function show(){
  const hash=decodeURIComponent(location.hash.slice(1));
  let active='about',target=null;
  if(hash.startsWith('page-')&&pages.some(p=>p.dataset.sitePage===hash.slice(5)))active=hash.slice(5);
  else if(hash){target=document.getElementById(hash);active=target?.closest('[data-site-page]')?.dataset.sitePage||'about';}
  for(const page of pages)page.hidden=single&&page.dataset.sitePage!==active;
  for(const link of document.querySelectorAll('[data-nav-page]')){
   const selected=single?link.dataset.navPage===active:link.dataset.navPage===document.body.dataset.currentPage;
   link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  if(target){const cards=target.closest('.publication-layout');if(cards){cards.classList.remove('list-mode');const btn=cards.closest('.site-page').querySelector('[data-toggle-view]');if(btn){btn.textContent='List view';btn.setAttribute('aria-pressed','false');}}for(let parent=target;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}else if(single)window.scrollTo(0,0);
 }
 document.documentElement.classList.add('js');
 try{show();}catch{for(const p of pages)p.hidden=false;}
 window.addEventListener('hashchange',()=>{try{show();}catch{}});
 document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href]');if(anchor&&anchor.hash&&anchor.hash===location.hash){try{show();}catch{}}
  const button=event.target.closest('[data-toggle-view]');if(!button)return;
  const layout=button.closest('.site-page').querySelector('.publication-layout'),list=layout.classList.toggle('list-mode');
  button.textContent=list?'Card view':'List view';button.setAttribute('aria-pressed',String(list));
 });
})();

/* About hover cards also support touch, keyboard, Escape and overflow-safe placement. */
(()=>{
 const wraps=[...document.querySelectorAll('[data-popover]')];
 function setExpanded(w,open){w.querySelector('[data-popover-toggle]')?.setAttribute('aria-expanded',String(open));}
 function fit(w){const panel=w.querySelector('.hover-panel');if(!panel)return;if(matchMedia('(max-width:760px)').matches){panel.style.setProperty('--popup-shift','0px');return;}panel.style.setProperty('--popup-shift','0px');const r=panel.getBoundingClientRect(),width=Math.min(document.documentElement.clientWidth,window.visualViewport?.width||innerWidth);const shift=r.left<14?14-r.left:r.right>width-14?width-14-r.right:0;panel.style.setProperty('--popup-shift',shift+'px');}
 function close(w){w.classList.remove('is-open');w.classList.add('dismissed');setExpanded(w,false);}
 wraps.forEach(w=>{
  const trigger=w.querySelector('[data-popover-toggle]');
  trigger.addEventListener('click',()=>{const wasOpen=w.classList.contains('is-open');wraps.filter(x=>x!==w).forEach(close);w.classList.toggle('is-open',!wasOpen);w.classList.toggle('dismissed',wasOpen);setExpanded(w,!wasOpen);if(!wasOpen)fit(w);});
  w.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;w.classList.remove('dismissed');setExpanded(w,true);fit(w);});
  w.addEventListener('pointerleave',()=>{if(!w.classList.contains('is-open')&&!w.contains(document.activeElement))setExpanded(w,false);});
  w.addEventListener('focusin',()=>{w.classList.remove('dismissed');setExpanded(w,true);fit(w);});
  w.addEventListener('focusout',()=>{setTimeout(()=>{if(!w.contains(document.activeElement)&&!w.classList.contains('is-open')){w.classList.add('dismissed');setExpanded(w,false);}},0);});
 });
 document.addEventListener('click',e=>{if(!e.target.closest('[data-popover]'))wraps.forEach(close);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){wraps.forEach(close);}});
 window.addEventListener('resize',()=>wraps.forEach(fit));
 function toast(text){const el=document.querySelector('.site-toast');el.textContent=text;el.classList.add('visible');clearTimeout(el.timer);el.timer=setTimeout(()=>el.classList.remove('visible'),2200);}
 document.addEventListener('click',async e=>{
  const copy=e.target.closest('[data-copy-text]');if(!copy)return;
  const value=copy.dataset.copyText;let success=false;
  try{await navigator.clipboard.writeText(value);success=true;}catch{
   const ta=document.createElement('textarea');ta.value=value;ta.setAttribute('aria-label','Email address');ta.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(ta);ta.select();try{success=document.execCommand('copy');}catch{}ta.remove();copy.focus();
  }
  if(success){copy.textContent='Copied';toast('Email copied');setTimeout(()=>copy.textContent='Copy',1800);}else{const link=copy.parentElement.querySelector('a');const range=document.createRange();range.selectNodeContents(link);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);toast('Select the address and copy it');}
 });
 const top=document.querySelector('[data-back-to-top]');
 const updateTop=()=>top?.classList.toggle('visible',scrollY>450);
 window.addEventListener('scroll',updateTop,{passive:true});updateTop();
 top?.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
 const menu=document.querySelector('.site-menu'),key='academic-menu:'+document.querySelector('.brand')?.textContent.trim();
 try{menu.scrollLeft=Number(sessionStorage.getItem(key))||0;menu.addEventListener('scroll',()=>{try{sessionStorage.setItem(key,String(menu.scrollLeft));}catch{}},{passive:true});}catch{}
 document.querySelectorAll('.portrait').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const fallback=img.nextElementSibling;if(fallback)fallback.hidden=false;}));
})();

/* Hover opens a preview; clicking pins it. Touch and keyboard use native summaries. */
(()=>{
 document.querySelectorAll('.pub-card,.pub-list-entry').forEach(card=>{
  const details=card.querySelector('.pub-details'),toggle=details?.querySelector(':scope > summary');
  if(!details||!toggle)return;
  let pinned=details.open,hovered=false,dismissed=false,timer;
  const sync=()=>toggle.setAttribute('aria-expanded',String(details.open));sync();
  const close=()=>{details.open=false;sync();};
  card.addEventListener('pointerenter',event=>{
   if(event.pointerType!=='mouse'||!matchMedia('(hover:hover)').matches)return;
   hovered=true;dismissed=false;clearTimeout(timer);
   timer=setTimeout(()=>{if(hovered&&!dismissed){details.open=true;sync();}},180);
  });
  card.addEventListener('pointerleave',()=>{hovered=false;dismissed=false;clearTimeout(timer);if(!pinned&&!card.contains(document.activeElement))close();});
  toggle.addEventListener('click',event=>{
   event.preventDefault();clearTimeout(timer);
   // A click on an automatically opened preview keeps it open for reading.
   pinned=!pinned;dismissed=!pinned;details.open=pinned;sync();
  });
  card.addEventListener('focusout',()=>setTimeout(()=>{if(!pinned&&!hovered&&!card.contains(document.activeElement))close();},0));
  card.addEventListener('keydown',event=>{if(event.key==='Escape'){clearTimeout(timer);pinned=false;dismissed=true;toggle.focus({preventScroll:true});close();event.stopPropagation();}});
  details.addEventListener('toggle',sync);
 });
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-citation]');if(!button)return;
  let copied=false;
  try{await navigator.clipboard.writeText(button.dataset.copyCitation);copied=true;}catch{
   const field=document.createElement('textarea');field.value=button.dataset.copyCitation;field.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(field);field.select();try{copied=document.execCommand('copy');}catch{}field.remove();button.focus({preventScroll:true});
  }
  const status=button.nextElementSibling;status.textContent=copied?'Citation copied':'Select the citation above to copy';
  if(!copied){const range=document.createRange();range.selectNodeContents(button.previousElementSibling);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}
 });
})();

/* Native dialog keeps focus inside the figure viewer and returns it on close. */
(()=>{
 let viewer,opener;
 function create(){
  viewer=document.createElement('dialog');viewer.className='figure-lightbox';viewer.setAttribute('aria-labelledby','figure-viewer-title');
  viewer.innerHTML='<div class="figure-lightbox-bar"><b id="figure-viewer-title">Paper figure</b><button type="button" data-figure-size aria-pressed="false">Zoom in</button><a data-figure-save download="paper-figure.png">Save image</a><button type="button" data-figure-close aria-label="Close figure">Close ×</button></div><div class="figure-lightbox-view"><img class="figure-lightbox-image" alt=""></div><p class="figure-lightbox-caption"></p>';
  document.body.append(viewer);
  viewer.querySelector('[data-figure-close]').onclick=()=>viewer.close();
  viewer.querySelector('[data-figure-size]').onclick=event=>{const zoomed=viewer.classList.toggle('zoomed');event.target.textContent=zoomed?'Fit to screen':'Zoom in';event.target.setAttribute('aria-pressed',String(zoomed));};
  viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();});
  viewer.addEventListener('close',()=>{document.body.classList.remove('figure-lightbox-open');opener?.focus({preventScroll:true});});
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-figure-zoom]');if(!trigger)return;event.preventDefault();if(!viewer)create();opener=trigger;
  viewer.classList.remove('zoomed');const size=viewer.querySelector('[data-figure-size]');size.textContent='Zoom in';size.setAttribute('aria-pressed','false');
  const source=trigger.querySelector('img');const img=viewer.querySelector('img');img.src=source.src;img.alt=source.alt;viewer.querySelector('.figure-lightbox-caption').textContent=trigger.dataset.caption;
  const save=viewer.querySelector('[data-figure-save]');save.href=source.src;save.download=source.src.startsWith('data:image/jpeg')?'paper-figure.jpg':'paper-figure.png';
  viewer.showModal();document.body.classList.add('figure-lightbox-open');viewer.querySelector('.figure-lightbox-view').scrollTo(0,0);
 });
})();
