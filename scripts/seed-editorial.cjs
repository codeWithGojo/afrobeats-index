const fs=require('fs');
const events=[];
function event(slug,kind,title,date,details,source){events.push({artist_slug:slug,kind,title,event_date:date,details,source_url:source,verified_at:'2026-09-07T00:00:00Z'});}
const grammys='https://musicinafrica.net/magazine/grammys-2026-tyla-wins-best-african-music-performance/';
for(const [slug,work,result] of [['tyla','Push 2 Start','winner'],['burna-boy','Love','nominee'],['davido','With You','nominee'],['omah-lay','With You','nominee'],['ayra-starr','Gimme Dat','nominee'],['wizkid','Gimme Dat','nominee']])event(slug,result==='winner'?'award':'nomination','Grammy Awards · Best African Music Performance','2026-02-01',{body:'Grammy Awards',work,result,year:2026,metric:'Awards',weight:8},grammys);
const next='https://www.grammy.com/news/2027-grammys-show-air-date-nominations-announced/';
event(null,'award','69th Grammy Awards','2027-02-07',{body:'Grammy Awards',status:'scheduled',venue:'Crypto.com Arena, Los Angeles',metric:'Awards'},next);
event(null,'nomination','2027 Grammy nominations announced','2026-11-16',{body:'Grammy Awards',status:'scheduled',metric:'Awards'},next);
const headies='https://theheadies.com/17th-headies-nominees-winners/';
for(const [slug,category,work] of [['tems','Best Recording of the Year','Burning'],['ayra-starr','Best R&B Single','Last Heartbreak Song'],['odumodublvck','Next Rated',''],['rema','Afrobeats Album of the Year','HEIS']])event(slug,'award','The Headies · '+category,null,{body:'The Headies',year:2025,work,result:'winner',metric:'Awards',weight:8},headies);
const trace='https://www.bizcommunity.com/article/trace-awards-2025-winners-announced-921004a';
for(const [slug,category,work] of [['rema','Album of the Year','HEIS'],['rema','Best Male Artist',''],['tyla','Best Female Artist',''],['diamond-platnumz','Best Global African Artist',''],['ayra-starr','Best West African Artist','']])event(slug,'award','Trace Awards · '+category,'2025-02-26',{body:'Trace Awards',year:2025,work,result:'winner',metric:'Awards',weight:8},trace);
const tt='https://www.turntablecharts.com/news/1206';
for(const [slug,category,work] of [['asake','No. 1 Artiste',''],['asake','No. 1 Song','Lonely At The Top'],['asake','No. 1 Album','Work of Art'],['tiwa-savage','No. 1 Music Video','Who Is Your Guy (Remix)']])event(slug,'award','TurnTable Music Awards · '+category,null,{body:'TurnTable Music Awards',year:2023,work,result:'winner',metric:'Awards',weight:8},tt);
// BET's current winners page explicitly lists Tems among the female R&B/pop nominees.
event('tems','nomination','BET Awards · Best Female R&B / Pop Artist',null,{body:'BET Awards',year:2026,result:'nominee',metric:'Awards',weight:8},'https://www.bet.com/bet-awards/nominees');
const tyla='https://www.ticketmaster.com/tyla-tickets/artist/798720';
for(const [date,city,venue] of [['2026-11-12','Wheatland, CA','Hard Rock Live Sacramento'],['2026-11-13','San Francisco, CA','Bill Graham Civic Auditorium'],['2026-11-17','Seattle, WA','WAMU Theater'],['2026-11-20','Denver, CO','Fillmore Auditorium'],['2026-11-22','Chicago, IL','Aragon Ballroom'],['2026-11-25','Boston, MA','MGM Music Hall at Fenway'],['2026-11-28','Brooklyn, NY','Brooklyn Paramount'],['2026-11-29','Brooklyn, NY','Brooklyn Paramount'],['2026-12-02','Washington, DC','The Anthem']])event('tyla','tour','Tyla · The A*Pop World Tour',date,{city,venue,status:'scheduled',sold_out:null,metric:'Live performance'},tyla);
event('tyla','tour','Tyla · The A*Pop World Tour','2026-10-15',{city:'London, UK',venue:'O2 Academy Brixton',status:'scheduled',sold_out:null,metric:'Live performance'},'https://www.livenation.co.uk/event/tyla-the-a-pop-world-tour-london-tickets-edp1687909');
event('asake','tour','Asake · In God We Trust World Tour','2026-10-24',{city:'Paris, France',venue:'Accor Arena',status:'scheduled',sold_out:null,metric:'Live performance'},'https://www.ticketmaster.com/asake-tickets/artist/3025951');
fs.writeFileSync('data/editorial-events.json',JSON.stringify(events,null,2)+'\n');
const credits=[
 ['rema','Calm Down','Calm_Down_(Rema_song)',['Andre Vibez','London']],
 ['rema','Calm Down (with Selena Gomez)','Calm_Down_(Rema_song)',['Andre Vibez','London']],
 ['wizkid','Essence (feat. Tems)','Essence_(Wizkid_song)',['P2J','Legendury Beatz']],
 ['asake','Lonely At The Top','Lonely_at_the_Top_(song)',['Blaisebeatz']],
 ['bnxn','Finesse','Finesse_(Pheelz_song)',['Miichkel']],
 ['ayra-starr','Rush','Rush_(Ayra_Starr_song)',['Hoops','Andre Vibez']],
 ['victony','Soweto','Soweto_(song)',['Tempoe']],
 ['burna-boy','Last Last','Last_Last',['Off & Out','Chopstix','MdS','Ruuben']]
].map(([artist,title,page,producers])=>({artist,title,producers,source:'https://en.wikipedia.org/wiki/'+page,verified_at:'2026-09-07',creditScope:'Listed production credits; no royalty ownership inferred'}));
fs.writeFileSync('data/production-credits.json',JSON.stringify(credits,null,2)+'\n');
