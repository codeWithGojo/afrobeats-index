const CACHE='afri-official-v6';
const FILES=['/offline.html','/offline.js','/studio.css','/premium.css','/refinements.css','/reader-tools.css','/theme-init.js','/reader-model.js','/reader-languages.js','/reader-tools.js','/premium-ui.js','/refinements.js','/assets/fonts/inter-latin.woff2','/assets/fonts/space-grotesk-latin.woff2','/afr-index-favicon.svg','/data/current-lite.json','/fonts.css','/manifest.webmanifest','/assets/icon-192.png'];
async function saveEdition(){const cache=await caches.open(CACHE);
 // The offline page's CSS and scripts have build-time names (bundles), so read them from the page itself.
 const page=await fetch('/offline.html',{cache:'reload',credentials:'omit'}).then(r=>r.ok?r.text():'').catch(()=>'');
 const linked=[...page.matchAll(/(?:href|src)="(\/[^"?#]+\.(?:css|js))"/g)].map(m=>m[1]);
 for(const path of [...new Set([...FILES,...linked])]){const response=await fetch(path,{cache:'reload',credentials:'omit'});if(!response.ok)throw Error('The public edition could not finish downloading. Please retry online.');await cache.put(path,response);}return true;}
self.addEventListener('install',event=>{event.waitUntil(saveEdition().then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('afri-official-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SAVE_EDITION')event.waitUntil(saveEdition().then(()=>event.ports[0]?.postMessage({ok:true})).catch(error=>event.ports[0]?.postMessage({ok:false,error:error.message})));});
function publicNavigation(url){if(/\/(?:account|api|receipt|u)(?:\/|$)/.test(url.pathname))return false;if([...url.searchParams.keys()].some(key=>key!=='tab'&&key!=='tools'))return false;return /^\/(?:$|offline(?:\.html)?$|newsletter(?:\.html)?$|underground(?:\.html)?$|current\/|calendar\/|boards(?:\/|$)|studio(?:\/|$)|vs\/|collaborations$|quiz(?:\/|$)|week\/)/.test(url.pathname);}
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin)return;
 if(event.request.mode==='navigate'&&publicNavigation(url)){event.respondWith(fetch(event.request).catch(async()=>{const cached=await caches.match('/offline.html');return cached||new Response('No saved edition is available. Reconnect and save the public chart from Reading tools.',{status:503,headers:{'Content-Type':'text/plain'}});}));return;}
 // Chart data: stale-while-revalidate. Serve the cached copy at once, refresh it in the background.
 if(/^\/data\/(current|current-lite|boards|rank-history|african-artists|my-index-templates|upcoming-releases)\.json$/.test(url.pathname)&&!url.search){
  event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(url.pathname);const fresh=fetch(event.request).then(response=>{if(response.ok)cache.put(url.pathname,response.clone());return response;}).catch(()=>cached);if(cached){event.waitUntil(fresh);return cached;}return fresh;}));
  return;
 }
 if((!FILES.includes(url.pathname)&&!url.pathname.startsWith('/assets/css/'))||url.search)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)));}return response;}).catch(()=>caches.match(url.pathname)));
});
self.addEventListener('push',event=>{let message={};try{message=event.data?.json()||{};}catch{}event.waitUntil(self.registration.showNotification(message.title||'Afri Index',{body:message.body||'A new edition is available.',icon:'/assets/icon-192.png',badge:'/assets/icon-192.png',tag:'afri-weekly-edition',data:{url:typeof message.url==='string'&&/^\/week\/\d{4}-W\d{2}$/.test(message.url)?message.url:'/discover'}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(event.notification.data?.url||'/discover'));});
