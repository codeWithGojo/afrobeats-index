const {data,db}=require('../lib/shared.cjs');
module.exports=async(req,res)=>{
 let artists=data.artists;
 try{const metrics=await db('artist_metrics?select=artist_slug,monthly_listeners,observed_at,approximate'),map=new Map(metrics.map(m=>[m.artist_slug,m]));artists=artists.map(a=>{const m=map.get(a.slug);return m?.monthly_listeners?{...a,monthlyListeners:m.monthly_listeners,monthlyListenersLastUpdatedAt:m.observed_at,monthlyListenersApproximate:m.approximate}:a;});}catch{}
 const events={},awards=structuredClone(data.awards||{});
 for(const r of data.events||[]){if(!r.artist_slug)continue;if(['tour','festival'].includes(r.kind)){events[r.artist_slug]||={provider:'Source-linked live listings',updatedAt:r.verified_at,events:[]};events[r.artist_slug].events.push({title:r.title,date:r.event_date,city:r.details.city,venue:r.details.venue,sourceUrl:r.source_url,soldOut:r.details.sold_out});}else if(['award','nomination'].includes(r.kind)){const a=awards[r.artist_slug]||=[];const category=r.title.split(' · ').slice(1).join(' · ');if(!a.some(x=>x.name===r.details.body&&x.category===category&&x.year===r.details.year))a.push({name:r.details.body,category,year:r.details.year,work:r.details.work,result:r.details.result,sourceUrl:r.source_url,lastVerifiedAt:r.verified_at});}}
 res.setHeader('Cache-Control','public,max-age=60,s-maxage=300');res.json({...data.site,artists,events,awards});
};
