const {test}=require('node:test');
const assert=require('node:assert/strict');
const {providers,activeProvider,billingConfigured}=require('../lib/payment-providers.cjs');
const {handler,hashMatches}=require('../lib/product-flutterwave-webhook.cjs');

const json=(status,body)=>({ok:status<300,status,json:async()=>body});
const REF='afri_123e4567-e89b-12d3-a456-426614174000';
const env={FLW_SECRET_KEY:'FLWSECK_TEST-x',FLW_SECRET_HASH:'my-webhook-hash',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_x',AFRI_PRO_AMOUNT:'500000'};

test('the active provider follows the explicit setting, then Flutterwave, then Paystack',()=>{
  assert.equal(activeProvider({}),null);
  assert.equal(activeProvider({PAYSTACK_SECRET_KEY:'sk'}).id,'paystack');
  assert.equal(activeProvider({...env,PAYSTACK_SECRET_KEY:'sk'}).id,'flutterwave');
  assert.equal(activeProvider({...env,PAYSTACK_SECRET_KEY:'sk',AFRI_PAYMENT_PROVIDER:'paystack'}).id,'paystack');
  assert.equal(activeProvider({AFRI_PAYMENT_PROVIDER:'flutterwave',FLW_SECRET_KEY:'k'}),null,'a webhook hash is required');
  assert.equal(billingConfigured(env),true);
  assert.equal(billingConfigured({...env,AFRI_PRO_AMOUNT:'50.5'}),false);
  assert.equal(billingConfigured({...env,SUPABASE_SERVICE_ROLE_KEY:''}),false);
});

test('Flutterwave checkout sends naira from the kobo order and accepts only Flutterwave-hosted links',async()=>{
  let sent;
  const ok=async(url,init)=>{sent={url,body:JSON.parse(init.body),auth:init.headers.Authorization};return json(200,{status:'success',data:{link:'https://checkout.flutterwave.com/v3/hosted/pay/abc'}});};
  const url=await providers.flutterwave.start({amount:500000,currency:'NGN',reference:REF,email:'fan@example.com'},env,ok);
  assert.equal(url,'https://checkout.flutterwave.com/v3/hosted/pay/abc');
  assert.equal(sent.url,'https://api.flutterwave.com/v3/payments');
  assert.equal(sent.body.amount,5000);assert.equal(sent.body.tx_ref,REF);assert.equal(sent.body.customer.email,'fan@example.com');
  assert.equal(sent.auth,'Bearer FLWSECK_TEST-x');
  await assert.rejects(providers.flutterwave.start({amount:1,currency:'NGN',reference:REF,email:'a@b.co'},env,async()=>json(200,{status:'success',data:{link:'https://evil.example/pay'}})),/Unexpected checkout URL/);
  await assert.rejects(providers.flutterwave.start({amount:1,currency:'NGN',reference:REF,email:'a@b.co'},env,async()=>json(400,{status:'error'})),/could not start checkout/);
});

function request(body,headers={}){
  const raw=Buffer.from(typeof body==='string'?body:JSON.stringify(body));
  return {method:'POST',headers,async *[Symbol.asyncIterator](){yield raw;}};
}
function response(){const r={code:null,status(c){r.code=c;return r;},end(){return r;},setHeader(){}};return r;}
const verifyOk=(over={})=>async()=>json(200,{status:'success',data:{status:'successful',tx_ref:REF,amount:5000,currency:'NGN',...over}});

test('the webhook grants Pro only for an authenticated, re-verified, matching payment',async()=>{
  const calls=[];const callRpc=async(path,init)=>{calls.push({path,body:init.body});return true;};
  const event={event:'charge.completed',data:{id:987,tx_ref:REF,status:'successful',amount:5000,currency:'NGN'}};
  const good=response();
  await handler({fetchImpl:verifyOk(),callRpc,env})(request(event,{'verif-hash':'my-webhook-hash'}),good);
  assert.equal(good.code,200);
  assert.deepEqual(calls[0],{path:'rpc/fulfill_pro_payment',body:{ref:REF,paid_amount:500000,paid_currency:'NGN'}});

  calls.length=0;
  const forged=response();await handler({fetchImpl:verifyOk(),callRpc,env})(request(event,{'verif-hash':'guess'}),forged);
  assert.equal(forged.code,401);
  const missing=response();await handler({fetchImpl:verifyOk(),callRpc,env})(request(event),missing);
  assert.equal(missing.code,401);
  // The webhook body claims success, but Flutterwave says otherwise: nothing is granted.
  const failed=response();await handler({fetchImpl:verifyOk({status:'failed'}),callRpc,env})(request(event,{'verif-hash':'my-webhook-hash'}),failed);
  assert.equal(failed.code,200);
  const swapped=response();await handler({fetchImpl:verifyOk({tx_ref:'afri_00000000-0000-0000-0000-000000000000'}),callRpc,env})(request(event,{'verif-hash':'my-webhook-hash'}),swapped);
  assert.equal(swapped.code,400);
  const other=response();await handler({fetchImpl:verifyOk(),callRpc,env})(request({event:'transfer.completed',data:{}},{'verif-hash':'my-webhook-hash'}),other);
  assert.equal(other.code,200);
  assert.equal(calls.length,0);

  const notConfigured=response();await handler({fetchImpl:verifyOk(),callRpc,env:{}})(request(event,{'verif-hash':'x'}),notConfigured);
  assert.equal(notConfigured.code,503);
  const huge=response();await handler({fetchImpl:verifyOk(),callRpc,env})(request('x'.repeat(300000),{'verif-hash':'my-webhook-hash'}),huge);
  assert.equal(huge.code,413);
  const underpaid=response();await handler({fetchImpl:verifyOk({amount:50}),callRpc:async()=>false,env})(request(event,{'verif-hash':'my-webhook-hash'}),underpaid);
  assert.equal(underpaid.code,400,'the database refuses an amount that does not match the order');
});

test('the webhook secret comparison is exact',()=>{
  assert.equal(hashMatches('abc','abc'),true);
  assert.equal(hashMatches('abc','abcd'),false);
  assert.equal(hashMatches('','abc'),false);
  assert.equal(hashMatches('abc',''),false);
});
