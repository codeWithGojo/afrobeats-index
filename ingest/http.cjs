// HTTP with timeouts and exponential backoff. Retries network errors, 429 and 5xx only.
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function retryDelay(attempt,{baseDelayMs,maxDelayMs,retryAfter,random}){
  const header=Number(retryAfter);
  if(Number.isFinite(header)&&header>=0)return Math.min(maxDelayMs,header*1000);
  return Math.min(maxDelayMs,baseDelayMs*2**attempt)*(0.5+random()/2);
}

async function fetchWithRetry(url,options={}){
  const {timeoutMs=15000,retries=3,baseDelayMs=500,maxDelayMs=30000,fetchImpl=globalThis.fetch,sleep=wait,random=Math.random,init={}}=options;
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    try{
      const response=await fetchImpl(url,{...init,signal:AbortSignal.timeout(timeoutMs)});
      if(response.status===429||response.status>=500){
        lastError=Object.assign(new Error(`HTTP ${response.status}`),{status:response.status});
        if(attempt<retries){await sleep(retryDelay(attempt,{baseDelayMs,maxDelayMs,retryAfter:response.headers?.get?.('retry-after'),random}));continue;}
        throw lastError;
      }
      return response;
    }catch(error){
      if(error.status&&error.status<500&&error.status!==429)throw error;
      lastError=error;
      if(attempt>=retries)break;
      await sleep(retryDelay(attempt,{baseDelayMs,maxDelayMs,random}));
    }
  }
  throw lastError;
}

module.exports={fetchWithRetry,retryDelay};
