(function musicReceiptFeature(){
  "use strict";

  const CONFIG=window.AFRI_MUSIC_CONFIG||{};
  const RANGE_LABELS={short_term:"Last 4 weeks",medium_term:"Last 6 months",long_term:"All-time"};
  const SOURCE_LABELS={spotify:"Spotify",apple:"Apple Music",youtube:"YouTube Music",audiomack:"Audiomack",manual:"Manual picks"};

  class MusicSourceAdapter{
    constructor(id,label){this.id=id;this.label=label;}
    async connect(){return true;}
    async getTopTracks(){throw new Error(`${this.label} does not expose personal top tracks here.`);}
    async getTopArtists(){throw new Error(`${this.label} does not expose personal top artists here.`);}
  }

  class SpotifyAdapter extends MusicSourceAdapter{
    constructor(){super("spotify","Spotify");this.accessToken=null;}
    get clientId(){return CONFIG.spotifyClientId||"";}
    async connect(){
      if(!this.clientId)throw new Error("Add a Spotify app Client ID first.");
      const verifier=randomString(64),challenge=await sha256base64(verifier),oauthState=randomString(24);
      sessionStorage.setItem("afri_spotify_verifier",verifier);sessionStorage.setItem("afri_spotify_state",oauthState);
      const url=new URL("https://accounts.spotify.com/authorize");
      url.search=new URLSearchParams({client_id:this.clientId,response_type:"code",redirect_uri:redirectUri(),scope:"user-top-read",code_challenge_method:"S256",code_challenge:challenge,state:oauthState}).toString();
      location.assign(url.toString());
    }
    async finishConnection(code,state){
      const verifier=sessionStorage.getItem("afri_spotify_verifier"),expected=sessionStorage.getItem("afri_spotify_state");
      if(!verifier||!expected||state!==expected)throw new Error("Spotify sign-in could not be verified. Please try again.");
      const response=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:this.clientId,grant_type:"authorization_code",code,redirect_uri:redirectUri(),code_verifier:verifier})});
      if(!response.ok)throw new Error("Spotify did not complete the connection.");
      const token=await response.json();this.accessToken=token.access_token;sessionStorage.removeItem("afri_spotify_verifier");sessionStorage.removeItem("afri_spotify_state");
      return true;
    }
    async request(path){
      if(!this.accessToken)throw new Error("Connect Spotify before loading your receipt.");
      const response=await fetch(`https://api.spotify.com/v1${path}`,{headers:{Authorization:`Bearer ${this.accessToken}`}});
      if(!response.ok)throw new Error(response.status===401?"Your Spotify session expired. Reconnect and try again.":"Spotify could not return your listening data.");
      return response.json();
    }
    async getTopTracks(timeRange){
      const data=await this.request(`/me/top/tracks?limit=50&time_range=${timeRange}`);
      return (data.items||[]).map((track,index)=>({title:track.name,artists:(track.artists||[]).map(a=>a.name),artist:(track.artists||[]).map(a=>a.name).join(", "),rank:index+1,plays:null,source:"spotify"}));
    }
    async getTopArtists(timeRange){
      const data=await this.request(`/me/top/artists?limit=50&time_range=${timeRange}`);
      return (data.items||[]).map((artist,index)=>({name:artist.name,rank:index+1,source:"spotify"}));
    }
  }

  class AppleMusicAdapter extends MusicSourceAdapter{
    constructor(){super("apple","Apple Music");this.music=null;}
    async connect(){
      let developerToken=CONFIG.appleDeveloperToken||"";
      if(!developerToken&&CONFIG.appleDeveloperTokenEndpoint){const response=await fetch(CONFIG.appleDeveloperTokenEndpoint,{credentials:"same-origin"});if(response.ok){const payload=await response.json();developerToken=payload.token||payload.developerToken||"";}}
      if(!developerToken)throw new Error("Apple Music connection is not configured yet. Use import or manual picks for now.");
      await loadScript("https://js-cdn.music.apple.com/musickit/v3/musickit.js");
      if(!window.MusicKit)throw new Error("MusicKit could not load.");
      window.MusicKit.configure({developerToken,app:{name:"Afri Index",build:"2026.09"}});
      this.music=window.MusicKit.getInstance();await this.music.authorize();return true;
    }
    async recent(){
      if(!this.music)throw new Error("Connect Apple Music before loading your receipt.");
      const response=await this.music.api.music("/v1/me/recent/played/tracks",{limit:50});
      return response?.data?.data||response?.data||[];
    }
    async getTopTracks(){
      const items=await this.recent();
      return items.map((item,index)=>({title:item.attributes?.name||"Unknown track",artist:item.attributes?.artistName||"Unknown artist",artists:[item.attributes?.artistName||""],rank:index+1,plays:null,source:"apple"}));
    }
    async getTopArtists(){
      const items=await this.recent(),seen=new Set();
      return items.map(item=>item.attributes?.artistName).filter(name=>name&&!seen.has(normalize(name))&&seen.add(normalize(name))).map((name,index)=>({name,rank:index+1,source:"apple"}));
    }
  }

  class ImportOnlyAdapter extends MusicSourceAdapter{
    constructor(id,label,reason){super(id,label);this.reason=reason;}
    async connect(){throw new Error(this.reason);}
  }

  const adapters={
    spotify:new SpotifyAdapter(),
    apple:new AppleMusicAdapter(),
    youtube:new ImportOnlyAdapter("youtube","YouTube Music","YouTube Music has no official personal top-tracks API. Paste or export your history, or use manual picks."),
    audiomack:new ImportOnlyAdapter("audiomack","Audiomack","Audiomack personal listening access is limited. Import your data or use manual picks."),
    manual:new ImportOnlyAdapter("manual","Manual picks","Choose artists directly from the Afri Index database.")
  };
  window.AFRI_MUSIC_SOURCES=adapters;

  const ui={};
  const receiptState={source:"spotify",range:"short_term",selected:[],tracks:[],artists:[],filteredOut:0,blob:null};

  function normalize(value){return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim();}
  function redirectUri(){return `${location.origin}${location.pathname}`;}
  function randomString(length){const bytes=crypto.getRandomValues(new Uint8Array(length));return Array.from(bytes,b=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[b%66]).join("");}
  async function sha256base64(value){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
  function loadScript(src){return new Promise((resolve,reject)=>{const old=document.querySelector(`script[src="${src}"]`);if(old){old.addEventListener("load",resolve,{once:true});if(window.MusicKit)resolve();return;}const script=document.createElement("script");script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error("The platform library could not load."));document.head.append(script);});}

  function artistDatabase(){
    const merged=[...(window.AFRI_EMBEDDED_STATE?.artists||[]),...(window.AFRI_CURRENT_ARTISTS||[])],map=new Map();
    merged.forEach(a=>{if(!a?.name)return;const key=normalize(a.name);if(!map.has(key))map.set(key,{name:a.name,slug:a.slug||key.replace(/ /g,"-"),aliases:[a.name,...(a.aliases||[]),...(a.aka?[a.aka]:[])]});});
    return [...map.values()];
  }
  function knownArtist(name){
    const n=normalize(name);if(!n)return null;
    return artistDatabase().find(a=>a.aliases.some(alias=>{const k=normalize(alias);return n===k||n.startsWith(`${k} `)||n.endsWith(` ${k}`);}))||null;
  }
  function trackIsAfrican(track){return (track.artists?.length?track.artists:[track.artist]).some(knownArtist);}
  function filterAfrican(tracks,artists){
    const keptTracks=tracks.filter(trackIsAfrican),keptArtists=artists.filter(a=>knownArtist(a.name));
    return {tracks:keptTracks,artists:keptArtists,filteredOut:(tracks.length-keptTracks.length)+(artists.length-keptArtists.length)};
  }

  function setStatus(message,type=""){
    ui.status.textContent=message;ui.status.className=`receipt-status${type?` is-${type}`:""}`;
  }
  function setSource(id){
    receiptState.source=id;document.querySelectorAll("[data-receipt-source]").forEach(button=>{const selected=button.dataset.receiptSource===id;button.classList.toggle("is-selected",selected);button.setAttribute("aria-pressed",String(selected));});
    renderConnectPanel();ui.manual.hidden=!(id==="manual"||id==="youtube"||id==="audiomack");setStatus(id==="manual"?"Choose at least one artist, then generate your receipt.":`Ready for ${SOURCE_LABELS[id]}.`);
  }
  function renderConnectPanel(){
    const source=receiptState.source;
    if(source==="spotify"){
      const configured=Boolean(adapters.spotify.clientId);
      ui.connect.innerHTML=`<p>Spotify can provide your top 50 tracks and artists for all three periods. Afri Index filters that list against its African artist database.</p><button type="button" class="connect-action" id="receipt-connect"${configured?"":" disabled"}>${adapters.spotify.accessToken?"Reload Spotify data":configured?"Connect Spotify":"Spotify setup pending"}</button><p class="receipt-source-note">${configured?"One click opens Spotify’s secure sign-in. Afri Index never sees your password.":"Spotify sign-in will be available as soon as the Afri Index Spotify app is approved and configured."}</p>`;
    }else if(source==="apple"){
      ui.connect.innerHTML=`<p>Apple Music uses MusicKit authorization. Apple exposes recent listening rather than Spotify-style lifetime top lists, so the selected period is labelled as the nearest available range.</p><button type="button" class="connect-action" id="receipt-connect">Connect Apple Music</button>`;
    }else{
      ui.connect.innerHTML=`<p>${source==="youtube"?"YouTube Music has no official public API for personal top tracks.":source==="audiomack"?"Audiomack does not consistently expose personal top listening through its public API.":"Build a receipt directly from verified Afri Index artists."} Use the manual picker or import CSV, JSON, or pasted history.</p>`;
    }
    ui.connect.querySelector("#receipt-connect")?.addEventListener("click",connectCurrent);
  }
  async function connectCurrent(){
    const adapter=adapters[receiptState.source];
    setStatus(`Connecting to ${adapter.label}…`);
    try{
      if(receiptState.source==="spotify"&&!adapter.accessToken){await adapter.connect();return;}
      if(receiptState.source==="apple"&&!adapter.music)await adapter.connect();
      await loadFromAdapter(adapter);
    }catch(error){setStatus(error.message,"error");ui.manual.hidden=false;}
  }
  async function loadFromAdapter(adapter){
    setStatus(`Loading your ${adapter.label} listening data…`);
    const [tracks,artists]=await Promise.all([adapter.getTopTracks(receiptState.range),adapter.getTopArtists(receiptState.range)]),filtered=filterAfrican(tracks,artists);
    Object.assign(receiptState,filtered);setStatus(`${filtered.tracks.length} African tracks and ${filtered.artists.length} African artists matched. ${filtered.filteredOut} unmatched entries were left out.`,filtered.tracks.length||filtered.artists.length?"success":"error");if(!filtered.tracks.length&&!filtered.artists.length)ui.manual.hidden=false;renderConnectPanel();
  }

  function renderArtistSearch(query=""){
    const q=normalize(query);if(!q){ui.results.replaceChildren();return;}
    const selected=new Set(receiptState.selected.map(a=>a.slug));
    const hits=artistDatabase().filter(a=>!selected.has(a.slug)&&normalize(a.name).includes(q)).slice(0,8);
    ui.results.replaceChildren(...hits.map(a=>{const button=document.createElement("button");button.type="button";button.role="option";button.textContent=a.name;button.addEventListener("click",()=>addArtist(a));return button;}));
  }
  function addArtist(artist){if(receiptState.selected.length>=10){setStatus("A receipt can include up to 10 manually selected artists.","error");return;}if(!receiptState.selected.some(a=>a.slug===artist.slug))receiptState.selected.push(artist);ui.artistSearch.value="";renderArtistSearch();renderSelected();}
  function renderSelected(){
    ui.selected.replaceChildren(...receiptState.selected.map(a=>{const token=document.createElement("span");token.className="artist-token";token.append(document.createTextNode(a.name));const remove=document.createElement("button");remove.type="button";remove.setAttribute("aria-label",`Remove ${a.name}`);remove.textContent="×";remove.addEventListener("click",()=>{receiptState.selected=receiptState.selected.filter(x=>x.slug!==a.slug);renderSelected();});token.append(remove);return token;}));ui.manualCount.textContent=`${receiptState.selected.length} / 10`;
  }

  function parseDelimitedLine(line){
    const cells=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){cells.push(value.trim());value="";}else value+=ch;}cells.push(value.trim());return cells;
  }
  function parseImport(text){
    const clean=text.trim();if(!clean)return [];
    try{const parsed=JSON.parse(clean),items=Array.isArray(parsed)?parsed:(parsed.items||parsed.tracks||[]);return items.map((item,index)=>({title:item.title||item.track||item.name,artist:item.artist||item.artistName||(item.artists||[]).join(", "),artists:item.artists||[item.artist||item.artistName],plays:Number(item.plays||item.playCount)||null,rank:index+1,source:"import"})).filter(x=>x.title&&x.artist);}catch{}
    const lines=clean.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),csv=lines.some(line=>line.includes(","));
    if(csv){const data=lines.map(parseDelimitedLine),head=data[0].map(normalize),hasHead=head.some(x=>["track","title","song","artist","plays","play count"].includes(x)),rows=hasHead?data.slice(1):data;return rows.map((cells,index)=>{const titleIndex=hasHead?Math.max(0,head.findIndex(x=>["track","title","song"].includes(x))):0,artistIndex=hasHead?Math.max(1,head.findIndex(x=>x==="artist")):1,playsIndex=hasHead?head.findIndex(x=>["plays","play count"].includes(x)):2;return {title:cells[titleIndex],artist:cells[artistIndex],artists:[cells[artistIndex]],plays:playsIndex>=0?Number(cells[playsIndex])||null:null,rank:index+1,source:"import"};}).filter(x=>x.title&&x.artist);}
    return lines.map((line,index)=>{const parts=line.split(/\s+[—–-]\s+/);return {title:parts[0],artist:parts.slice(1).join(" - "),artists:[parts.slice(1).join(" - ")],plays:null,rank:index+1,source:"import"};}).filter(x=>x.title&&x.artist);
  }
  function importData(text){
    const tracks=parseImport(text),filtered=filterAfrican(tracks,[]);receiptState.tracks=filtered.tracks;receiptState.artists=uniqueArtists(filtered.tracks);receiptState.filteredOut=filtered.filteredOut;
    if(!tracks.length)setStatus("No readable rows were found. Try “Track, Artist, Plays” CSV columns.","error");else if(!filtered.tracks.length)setStatus("The import worked, but none of its artists matched the Afri Index African artist database.","error");else setStatus(`${filtered.tracks.length} African tracks imported. ${filtered.filteredOut} unmatched tracks were left out.`,"success");
  }
  function uniqueArtists(tracks){const seen=new Set(),list=[];tracks.forEach(track=>(track.artists?.length?track.artists:[track.artist]).forEach(name=>{const match=knownArtist(name);if(match&&!seen.has(match.slug)){seen.add(match.slug);list.push({name:match.name,rank:list.length+1,source:"derived"});}}));return list;}

  function collectManualData(){
    const picked=receiptState.selected.map((a,index)=>({name:a.name,rank:index+1,source:"manual"})),typed=parseImport(ui.trackList.value),filtered=filterAfrican(typed,[]);
    const tracks=filtered.tracks.length?filtered.tracks:picked.map((a,index)=>({title:"Top artist selection",artist:a.name,artists:[a.name],rank:index+1,plays:null,source:"manual"}));
    return {tracks,artists:picked.length?picked:uniqueArtists(tracks),filteredOut:filtered.filteredOut};
  }
  function currentReceiptData(){
    if(["manual","youtube","audiomack"].includes(receiptState.source)&&receiptState.selected.length){return collectManualData();}
    return {tracks:receiptState.tracks,artists:receiptState.artists.length?receiptState.artists:uniqueArtists(receiptState.tracks),filteredOut:receiptState.filteredOut};
  }

  function generateReceipt(){
    const data=currentReceiptData(),tracks=data.tracks.slice(0,10),artists=data.artists.slice(0,10);
    if(["manual","youtube","audiomack"].includes(receiptState.source)&&receiptState.selected.length>0&&receiptState.selected.length<5&&!receiptState.tracks.length){setStatus("Choose at least 5 artists for a manual receipt.","error");return;}
    if(!tracks.length&&!artists.length){setStatus("Connect a service, import listening data, or choose at least 5 artists first.","error");return;}
    drawReceipt(tracks,artists);ui.canvas.toBlob(blob=>{receiptState.blob=blob;[ui.download,ui.share,ui.tweet,ui.print].forEach(button=>button.disabled=false);},"image/png");
    setStatus(`Receipt ready with ${tracks.length} track${tracks.length===1?"":"s"} and ${artists.length} artist${artists.length===1?"":"s"}.`,"success");ui.outputNote.textContent=`${SOURCE_LABELS[receiptState.source]} · ${RANGE_LABELS[receiptState.range]} · African matches only`;
  }
  function drawReceipt(tracks,artists){
    const width=720,rowHeight=70,height=Math.max(1120,620+tracks.length*rowHeight+artists.length*42),canvas=ui.canvas,ctx=canvas.getContext("2d");canvas.width=width;canvas.height=height;ctx.clearRect(0,0,width,height);ctx.fillStyle="#f5f0df";ctx.fillRect(18,18,width-36,height-36);ctx.fillStyle="#111";ctx.textBaseline="top";
    ctx.textAlign="center";ctx.font="900 28px Arial";ctx.fillText("AFR / INDEX",width/2,70);ctx.font="700 16px monospace";ctx.fillText("MUSIC RECEIPT",width/2,112);ctx.font="14px monospace";ctx.fillText(`${SOURCE_LABELS[receiptState.source].toUpperCase()}  ·  ${RANGE_LABELS[receiptState.range].toUpperCase()}`,width/2,143);dash(ctx,48,183,width-48,183);
    ctx.textAlign="left";ctx.font="700 15px monospace";ctx.fillText("QTY  TRACK / ARTIST",50,205);ctx.textAlign="right";ctx.fillText("PRICE",width-50,205);dash(ctx,48,238,width-48,238);let y=258;
    tracks.forEach((track,index)=>{ctx.textAlign="left";ctx.font="700 18px monospace";ctx.fillText(String(index+1).padStart(2,"0"),50,y);drawEllipsis(ctx,String(track.title).toUpperCase(),95,y,430);ctx.font="14px monospace";ctx.fillStyle="#4d4b44";drawEllipsis(ctx,String(track.artist),95,y+27,430);ctx.fillStyle="#111";ctx.textAlign="right";ctx.font="700 16px monospace";ctx.fillText(track.plays?compactNumber(track.plays):`AFR ${(index+1).toFixed(2)}`,width-50,y+8);y+=rowHeight;});
    dash(ctx,48,y+2,width-48,y+2);y+=24;ctx.textAlign="left";ctx.font="700 15px monospace";ctx.fillText("TOP AFRICAN ARTISTS",50,y);y+=32;artists.slice(0,5).forEach((artist,index)=>{ctx.font="16px monospace";drawEllipsis(ctx,`${index+1}. ${artist.name}`,58,y,520);ctx.textAlign="right";ctx.fillText("MATCHED",width-50,y);y+=42;ctx.textAlign="left";});
    dash(ctx,48,y,width-48,y);y+=25;ctx.font="14px monospace";ctx.textAlign="left";ctx.fillText("AFRICAN MATCHES",50,y);ctx.textAlign="right";ctx.font="700 18px monospace";ctx.fillText(String(tracks.length).padStart(2,"0"),width-50,y);y+=40;ctx.font="13px monospace";ctx.textAlign="left";ctx.fillText(`ISSUED ${new Date().toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}`,50,y);y+=38;drawBarcode(ctx,50,y,width-100,92,receiptSeed(tracks,artists));y+=108;ctx.textAlign="center";ctx.font="700 15px monospace";ctx.fillText("THANKS FOR SHOPPING AT AFRI INDEX",width/2,y);ctx.font="12px monospace";ctx.fillText("AFRI-INDEX.VERCEL.APP  ·  VERIFIED AFRICAN MATCHES",width/2,y+27);
  }
  function dash(ctx,x1,y1,x2,y2){ctx.save();ctx.setLineDash([8,7]);ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
  function drawEllipsis(ctx,text,x,y,maxWidth){let value=text;if(ctx.measureText(value).width<=maxWidth){ctx.fillText(value,x,y);return;}while(value.length&&ctx.measureText(`${value}…`).width>maxWidth)value=value.slice(0,-1);ctx.fillText(`${value}…`,x,y);}
  function compactNumber(value){return new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(value).toUpperCase();}
  function receiptSeed(tracks,artists){return normalize([...tracks.map(t=>t.title),...artists.map(a=>a.name)].join(""));}
  function drawBarcode(ctx,x,y,width,height,seed){ctx.save();ctx.fillStyle="#111";let cursor=x;for(let i=0;cursor<x+width;i++){const code=seed.charCodeAt(i%Math.max(1,seed.length))||37,bar=2+(code+i)%6,gap=2+(code*i)%4;if((code+i)%3!==0)ctx.fillRect(cursor,y,bar,height-((code+i)%4)*8);cursor+=bar+gap;}ctx.restore();}
  function receiptText(){const data=currentReceiptData(),names=data.artists.slice(0,5).map(a=>a.name).join(", ");return `My Afri Index Music Receipt: ${names||"African music on repeat"}. ${RANGE_LABELS[receiptState.range]} via ${SOURCE_LABELS[receiptState.source]}. #AfriIndex #Afrobeats`;}
  function download(){if(!receiptState.blob)return;const url=URL.createObjectURL(receiptState.blob),a=document.createElement("a");a.href=url;a.download=`afri-index-music-receipt-${new Date().toISOString().slice(0,10)}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function share(){if(!receiptState.blob)return;const file=new File([receiptState.blob],"afri-index-music-receipt.png",{type:"image/png"}),text=receiptText();try{if(navigator.canShare?.({files:[file]})){await navigator.share({title:"My Afri Index Music Receipt",text,files:[file]});}else if(navigator.share){await navigator.share({title:"My Afri Index Music Receipt",text});}else{await navigator.clipboard.writeText(text);download();setStatus("Caption copied and receipt downloaded. Add both to your Instagram Story or post.","success");}}catch(error){if(error.name!=="AbortError")setStatus("Sharing was blocked. Download the PNG and share it from your gallery.","error");}}
  function tweet(){window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(receiptText())}`,"_blank","noopener,noreferrer");}
  function printReceipt(){const url=ui.canvas.toDataURL("image/png"),win=window.open("","_blank");if(!win){setStatus("Allow pop-ups to print the receipt.","error");return;}win.opener=null;win.document.write(`<title>Afri Index Music Receipt</title><style>body{margin:0;display:grid;place-items:center;background:#eee}img{width:min(100%,720px)}@media print{body{background:white}}</style><img src="${url}" onload="print()" alt="Afri Index Music Receipt">`);win.document.close();}
  function escapeHtml(value){return String(value).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));}

  async function handleSpotifyCallback(){
    const params=new URLSearchParams(location.search),code=params.get("code"),oauthState=params.get("state"),error=params.get("error");if(!code&&!error)return;
    history.replaceState({},document.title,redirectUri()+location.hash);
    if(error){setSource("spotify");setStatus("Spotify permission was not granted. You can reconnect or use manual mode.","error");return;}
    try{await adapters.spotify.finishConnection(code,oauthState);setSource("spotify");window.showTab?.("receipt");await loadFromAdapter(adapters.spotify);}catch(err){setSource("spotify");window.showTab?.("receipt");setStatus(err.message,"error");}
  }
  function bind(){
    ui.connect=document.getElementById("receipt-connect-panel");ui.manual=document.getElementById("receipt-manual-panel");ui.status=document.getElementById("receipt-status");ui.artistSearch=document.getElementById("receipt-artist-search");ui.results=document.getElementById("receipt-artist-results");ui.selected=document.getElementById("receipt-selected-artists");ui.manualCount=document.getElementById("manual-count");ui.trackList=document.getElementById("receipt-track-list");ui.importText=document.getElementById("receipt-import-text");ui.file=document.getElementById("receipt-file-input");ui.canvas=document.getElementById("music-receipt-canvas");ui.download=document.getElementById("receipt-download");ui.share=document.getElementById("receipt-share");ui.tweet=document.getElementById("receipt-tweet");ui.print=document.getElementById("receipt-print");ui.outputNote=document.getElementById("receipt-output-note");
    if(!ui.canvas)return;
    document.querySelectorAll("[data-receipt-source]").forEach(button=>button.addEventListener("click",()=>setSource(button.dataset.receiptSource)));
    document.querySelectorAll("[data-receipt-range]").forEach(button=>button.addEventListener("click",()=>{receiptState.range=button.dataset.receiptRange;document.querySelectorAll("[data-receipt-range]").forEach(b=>{const selected=b===button;b.classList.toggle("is-selected",selected);b.setAttribute("aria-pressed",String(selected));});setStatus(`${RANGE_LABELS[receiptState.range]} selected. Reload connected data or generate from your picks.`);}));
    ui.artistSearch.addEventListener("input",()=>renderArtistSearch(ui.artistSearch.value));
    document.getElementById("receipt-import-button").addEventListener("click",()=>importData(ui.importText.value));
    ui.file.addEventListener("change",async()=>{const file=ui.file.files?.[0];if(file){ui.importText.value=await file.text();importData(ui.importText.value);}});
    document.getElementById("receipt-generate").addEventListener("click",generateReceipt);ui.download.addEventListener("click",download);ui.share.addEventListener("click",share);ui.tweet.addEventListener("click",tweet);ui.print.addEventListener("click",printReceipt);
    renderConnectPanel();drawReceipt([],[]);handleSpotifyCallback();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();
