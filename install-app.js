/* Install is always a user action; no automatic prompt or permission request. */
(()=>{
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 navigator.serviceWorker.register('/sw.js').catch(()=>{});
 let prompt=null;const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 const button=document.createElement('button');button.type='button';button.className='app-install';button.setAttribute('aria-label','Install app');button.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg><span class="app-install-label">Install app</span>';
 const attach=()=>{const slot=['#more-menu>div','header .header-tools','header nav','header'].map(selector=>document.querySelector(selector)).find(Boolean);if(slot){slot.append(button);return true;}return false;};
 if(!attach()){const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});}
 button.hidden=installed();
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=installed();});
 window.addEventListener('appinstalled',()=>{button.hidden=true;prompt=null;});
 button.addEventListener('click',async()=>{
  if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;return;}
  const dialog=document.createElement('dialog');dialog.className='app-install-dialog';dialog.setAttribute('aria-label','Install this app');
  const apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const heading=document.createElement('h2');heading.textContent='Keep it on your home screen.';
  const text=document.createElement('p');text.textContent=apple?'In Safari, tap Share, then Add to Home Screen. If you opened this inside another app, open the site in Safari first.':'Open your browser menu and choose Install app or Add to Home screen. If that option is unavailable, use Chrome or Edge to install this site.';
  const close=document.createElement('button');close.type='button';close.textContent='Got it';close.addEventListener('click',()=>dialog.close());dialog.append(heading,text,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.showModal();
 });
})();
