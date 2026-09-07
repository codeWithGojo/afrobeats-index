const {PDFDocument,StandardFonts,rgb}=require('pdf-lib');
const {data,db}=require('../lib/shared.cjs');
const clean=s=>String(s??'').normalize('NFKD').replace(/[^\x20-\x7e]/g,'');
module.exports=async(req,res)=>{
 try{const week=String(req.query.week||'');if(!/^\d{4}-W\d{2}$/.test(week))return res.status(400).json({error:'Use week=YYYY-Www'});
 const found=await db('chart_editions?week=eq.'+week+'&select=data');if(!found.length)return res.status(404).json({error:'Edition not published'});
 const d=found[0].data,pdf=await PDFDocument.create(),serif=await pdf.embedFont(StandardFonts.TimesRoman),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),pages=Math.ceil(d.artists.length/12),ink=rgb(.08,.08,.08),lime=rgb(.84,.94,.29);
 for(let pageIndex=0;pageIndex<pages;pageIndex++){const page=pdf.addPage([595,842]);page.drawRectangle({x:35,y:752,width:525,height:54,color:lime});page.drawText('AFR / INDEX',{x:48,y:770,size:28,font:bold,color:ink});page.drawText('THE CURRENT EDITION',{x:36,y:718,size:27,font:serif});page.drawText(clean(week)+'  /  Published '+clean(d.asOf?.slice(0,10)),{x:36,y:695,size:10,font,color:ink});for(const [label,x] of [['RANK',36],['ARTIST',92],['SCORE',425],['MOVE',505]])page.drawText(label,{x,y:663,size:9,font:bold});
 d.artists.slice(pageIndex*12,pageIndex*12+12).forEach((a,i)=>{const y=630-i*43,move=Number.isFinite(a.previousRank)?a.previousRank-a.rank:null;page.drawText(String(a.rank).padStart(2,'0'),{x:36,y,size:14,font:serif});page.drawText(clean(a.name).slice(0,32),{x:92,y,size:14,font:bold});page.drawText(clean(a.country),{x:92,y:y-14,size:8,font});page.drawText(Number(a.score).toFixed(1),{x:425,y,size:12,font});page.drawText(move===null?'n/a':move===0?'--':(move>0?'+':'')+move,{x:505,y,size:12,font});page.drawLine({start:{x:36,y:y-23},end:{x:560,y:y-23},thickness:.3,color:rgb(.7,.7,.7)});});
 page.drawText('Movement compares available published rank snapshots.',{x:36,y:82,size:9,font});page.drawText('Official editorial ranking. Sources: afrobeats-index.vercel.app/week/'+week,{x:36,y:65,size:8,font});page.drawText('AFR/INDEX - '+week+' - Page '+(pageIndex+1)+' of '+pages,{x:36,y:35,size:9,font:bold});}
 pdf.setTitle('Afri Index '+week);const bytes=await pdf.save();res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="afri-index-'+week+'.pdf"');res.setHeader('Cache-Control','public,max-age=300');res.end(Buffer.from(bytes));
 }catch{res.status(503).json({error:'Edition export unavailable. Please retry.'});}
};
