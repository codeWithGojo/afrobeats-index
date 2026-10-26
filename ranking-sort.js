/* Display sorting only; published artist ranks and scores are immutable inputs. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriRankingSort=factory();})(typeof window==='undefined'?globalThis:window,function(){
 const modes=['index','daily','total','movers'];
 const mode=s=>modes.includes(s)?s:'index';
 const movement=a=>Number.isFinite(a.previousRank)?a.previousRank-a.rank:null;
 const value=(a,s)=>s==='daily'?a.dailySpotifyStreams:s==='total'?(a.trackedAudioStreams??a.totalSpotifyStreams):s==='movers'?movement(a):a.score;
 const ordered=(artists,s='index')=>[...artists].sort((a,b)=>{s=mode(s);const x=value(a,s),y=value(b,s);return (x==null&&y==null?0:x==null?1:y==null?-1:y-x)||a.rank-b.rank||a.slug.localeCompare(b.slug);});
 const compact=n=>{if(!Number.isFinite(n))return '—';const abs=Math.abs(n),d=abs>=1e9?1e9:abs>=1e6?1e6:abs>=1e3?1e3:1;return (n/d).toFixed(d===1?0:1)+(d===1e9?'B':d===1e6?'M':d===1e3?'K':'');};
 const metric=(a,s)=>{s=mode(s);const n=value(a,s);return s==='index'?Number(n).toFixed(1):s==='movers'?(n==null?'NEW':n>0?'+'+n:String(n)):compact(n);};
 return{mode,ordered,metric,movement,value,compact};
});
