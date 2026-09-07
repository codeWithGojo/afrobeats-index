(async function receiptStore(){
 await import("/assets/account.js");
 const account=window.AfriAccount;
 'use strict';let latest=null,config;
 async function db(method,payload,path='receipts'){
  const session=await account.session();
  if(!session?.access_token||session.expires_at<Date.now()/1000)throw Error('Sign in through My board to save or publish a receipt.');
  config ||= await fetch('/community-config.json').then(r=>r.json());
  const r=await fetch(`${config.url}/rest/v1/${path}`,{method,headers:{apikey:config.key,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:payload?JSON.stringify(payload):undefined});
  const data=await r.json();if(!r.ok)throw Error(data.message||'Could not save your receipt.');return data;
 }
 async function save(isPublic){
  if(!latest)throw Error('Generate a receipt first.');
  const session=await account.session();
  config ||= await fetch('/community-config.json').then(r=>r.json());
  if(!session?.access_token)throw Error('Sign in through My board first.');
  const userResponse=await fetch(config.url+'/auth/v1/user',{headers:{apikey:config.key,Authorization:`Bearer ${session.access_token}`}});if(!userResponse.ok)throw Error('Your account session expired. Sign in again.');
  const user=await userResponse.json(),image=document.getElementById('music-receipt-canvas').toDataURL('image/png');
  const data=await db('POST',{user_id:user.id,payload:latest,image,public:isPublic});return data[0];
 }
 function start(){const actions=document.querySelector('.receipt-actions');if(!actions)return;const button=document.createElement('button');button.textContent='Publish share link';button.disabled=true;button.title='Publishes your receipt so anyone with its link can view it';actions.append(button);const accountLink=document.createElement('a');accountLink.href='/account';accountLink.textContent='Sign in / My saved receipts';actions.after(accountLink);const result=document.createElement('p');result.setAttribute('role','status');accountLink.after(result);
 window.addEventListener('afri:receipt-invalidated',()=>{latest=null;button.disabled=true;result.textContent='';});
 window.addEventListener('afri:receipt-generated',async event=>{latest=event.detail;button.disabled=false;result.textContent='';try{if(await account.session()){await save(false);result.textContent='Saved privately to My board.';}}catch(err){result.textContent=err.message;}});
 button.onclick=async()=>{button.disabled=true;try{const r=await save(true),url=location.origin+'/receipt/'+r.id;result.replaceChildren();const a=document.createElement('a');a.href=url;a.textContent=url;result.append('Public receipt: ',a);try{await navigator.clipboard.writeText(url);result.append(' · Link copied');}catch{}}catch(err){result.textContent=err.message;}finally{button.disabled=false;}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
