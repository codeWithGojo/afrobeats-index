// Removes credentials from anything that is logged or stored.
const SECRET_ENV=/KEY|SECRET|TOKEN|PASSWORD/i;

function redact(value,env=process.env){
  let text=String(value instanceof Error?value.message:value??'');
  for(const [name,secret] of Object.entries(env)){
    if(SECRET_ENV.test(name)&&typeof secret==='string'&&secret.length>=8)text=text.split(secret).join('[redacted]');
  }
  return text
    .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi,'$1[redacted]')
    .replace(/([?&](?:key|api_key|apikey|token|access_token)=)[^&\s]+/gi,'$1[redacted]')
    .slice(0,2000);
}

module.exports={redact};
