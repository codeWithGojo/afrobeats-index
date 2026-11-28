/* Personal stats providers. Every provider implements the same interface so new sources slot in:
   { id, label, available(flags) -> {ok, reason}, connect(), connected(), disconnect(),
     topArtists(range), topTracks(range), recent(sinceMs) }
   range is 'short_term' | 'medium_term' | 'long_term'. Results are raw names; matching happens in stats-model.js. */
(function(){
 'use strict';
 const CONFIG=window.AFRI_MUSIC_CONFIG||{};
 const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const random=n=>b64(crypto.getRandomValues(new Uint8Array(n))).slice(0,n);
 const redirect=()=>location.origin+'/stats';
 const store={get:(k,local)=>{try{return (local?localStorage:sessionStorage).getItem(k);}catch{return null;}},set:(k,v,local)=>{try{(local?localStorage:sessionStorage).setItem(k,v);}catch{}},del:k=>{try{localStorage.removeItem(k);sessionStorage.removeItem(k);}catch{}}};

 // Spotify: OAuth Authorization Code with PKCE, minimum scopes. Development Mode allows 5 allowlisted users.
 const spotify={
  id:'spotify',label:'Spotify',scopes:'user-top-read user-read-recently-played',token:null,expires:0,
  available(flags){return CONFIG.spotifyClientId?{ok:true,beta:true,reason:flags?.spotify?.note}:{ok:false,reason:'Spotify is not configured.'};},
  async connect({keep=false}={}){
   const verifier=random(64),state=random(24),challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
   store.set('afri_stats_verifier',verifier);store.set('afri_stats_state',state);store.set('afri_stats_keep',keep?'1':'');
   const url=new URL('https://accounts.spotify.com/authorize');
   url.search=new URLSearchParams({client_id:CONFIG.spotifyClientId,response_type:'code',redirect_uri:redirect(),scope:this.scopes,code_challenge_method:'S256',code_challenge:challenge,state}).toString();
   location.assign(url);
  },
  async finish(code,state){
   const verifier=store.get('afri_stats_verifier'),expected=store.get('afri_stats_state'),keep=store.get('afri_stats_keep')==='1';
   store.del('afri_stats_verifier');store.del('afri_stats_state');store.del('afri_stats_keep');
   if(!verifier||state!==expected)throw Error('Spotify sign-in could not be verified. Try again.');
   await this.tokenRequest({grant_type:'authorization_code',code,redirect_uri:redirect(),code_verifier:verifier},keep);
  },
  async tokenRequest(params,keep){
   const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CONFIG.spotifyClientId,...params})});
   const t=await r.json().catch(()=>({}));if(!r.ok||!t.access_token)throw Error('Spotify could not finish signing in.');
   this.token=t.access_token;this.expires=Date.now()+(t.expires_in||3600)*1000-6e4;
   // The refresh token is kept only if you chose ongoing tracking, and only in this browser.
   if(t.refresh_token)store.set('afri_stats_refresh',t.refresh_token,keep||!!store.get('afri_stats_refresh',true));
  },
  connected(){return !!this.token||!!store.get('afri_stats_refresh',true)||!!store.get('afri_stats_refresh');},
  disconnect(){this.token=null;store.del('afri_stats_refresh');},
  async ensure(){if(this.token&&Date.now()<this.expires)return;const rt=store.get('afri_stats_refresh',true)||store.get('afri_stats_refresh');if(!rt)throw Error('Connect Spotify first.');await this.tokenRequest({grant_type:'refresh_token',refresh_token:rt},!!store.get('afri_stats_refresh',true));},
  async api(path){
   await this.ensure();const r=await fetch('https://api.spotify.com/v1'+path,{headers:{Authorization:'Bearer '+this.token}});
   if(r.status===403)throw Error('Spotify allows only allowlisted accounts during the beta. Ask to be added, or use Last.fm or a history file.');
   if(r.status===429)throw Error('Spotify is busy. Try again in a few minutes.');
   if(!r.ok)throw Error('Spotify could not return your listening data.');return r.json();
  },
  async topArtists(range){return ((await this.api(`/me/top/artists?limit=50&time_range=${range}`)).items||[]).map((a,i)=>({name:a.name,rank:i+1}));},
  async topTracks(range){return ((await this.api(`/me/top/tracks?limit=50&time_range=${range}`)).items||[]).map((t,i)=>({title:t.name,artists:(t.artists||[]).map(a=>a.name),album:t.album?.album_type==='single'?null:t.album?.name||null,rank:i+1}));},
  async recent(since=0){const d=await this.api(`/me/player/recently-played?limit=50${since?'&after='+since:''}`);return (d.items||[]).map(x=>({playedAt:x.played_at,title:x.track?.name,artist:(x.track?.artists||[]).map(a=>a.name).join(', ')}));},
 };

 // Last.fm: public profiles by username, through our server proxy. No password is ever asked for.
 const lastfm={
  id:'lastfm',label:'Last.fm',user:null,
  available(flags){return flags?.lastfm?{ok:true}:{ok:false,reason:'Last.fm is not configured yet.'};},
  async connect({user}={}){if(!/^[A-Za-z][A-Za-z0-9_-]{1,14}$/.test(user||''))throw Error('Enter a valid Last.fm username.');this.user=user;store.set('afri_stats_lastfm',user,true);},
  connected(){this.user=this.user||store.get('afri_stats_lastfm',true);return !!this.user;},
  disconnect(){this.user=null;store.del('afri_stats_lastfm');},
  async call(q){const r=await fetch('/api/product?'+new URLSearchParams({service:'stats',action:'lastfm',user:this.user,...q}));const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Last.fm could not answer.');return d;},
  async topArtists(range){return (await this.call({kind:'artists',range})).items;},
  async topTracks(range){return (await this.call({kind:'tracks',range})).items;},
  async recent(since=0){const out=[];for(let page=1;page<=10;page++){const d=await this.call({kind:'recent',from:String(Math.floor(since/1000)),page:String(page)});out.push(...d.items);if(page>=d.totalPages)break;}return out;},
 };

 // Apple Music: placeholder behind APPLE_MUSIC_ENABLED. MusicKit needs a developer token from the server.
 const apple={id:'apple',label:'Apple Music',available(flags){return flags?.appleMusic?{ok:false,reason:'Apple Music is enabled but MusicKit is not wired yet.'}:{ok:false,soon:true,reason:'Coming soon'};},connected:()=>false};

 /* Spotify Extended Streaming History import. The file is read in this browser only.
    Accepts the my_spotify_data.zip download or the JSON files inside it. */
 async function readHistory(file){
  const name=file.name.toLowerCase();
  if(name.endsWith('.json'))return JSON.parse(await file.text());
  if(!name.endsWith('.zip'))throw Error('Choose the .zip from Spotify or the JSON files inside it.');
  const buf=new DataView(await file.arrayBuffer());let eocd=-1;
  for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--)if(buf.getUint32(i,true)===0x06054b50){eocd=i;break;}
  if(eocd<0)throw Error('This zip file could not be read.');
  const entries=buf.getUint16(eocd+10,true);let p=buf.getUint32(eocd+16,true);const items=[];
  for(let n=0;n<entries;n++){
   if(buf.getUint32(p,true)!==0x02014b50)throw Error('This zip file could not be read.');
   const method=buf.getUint16(p+10,true),size=buf.getUint32(p+20,true),nameLen=buf.getUint16(p+28,true),extra=buf.getUint16(p+30,true),comment=buf.getUint16(p+32,true),local=buf.getUint32(p+42,true);
   const entry=new TextDecoder().decode(new Uint8Array(buf.buffer,p+46,nameLen));p+=46+nameLen+extra+comment;
   if(!/streaming_?history.*\.json$/i.test(entry)||/video/i.test(entry))continue;
   const start=local+30+buf.getUint16(local+26,true)+buf.getUint16(local+28,true),bytes=new Uint8Array(buf.buffer,start,size);
   let text;
   if(method===0)text=new TextDecoder().decode(bytes);
   else if(method===8&&typeof DecompressionStream==='function')text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
   else throw Error('This browser cannot open the zip. Unzip it and choose the JSON files instead.');
   const rows=JSON.parse(text);if(Array.isArray(rows))items.push(...rows);
  }
  if(!items.length)throw Error('No streaming history files were found in this zip.');
  return items;
 }
 window.AfriStatsProviders={spotify,lastfm,apple,readHistory,list:[spotify,lastfm,apple]};
})();
