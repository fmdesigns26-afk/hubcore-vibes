function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8',...headers}});}
function clean(v,max=200){return String(v??'').trim().slice(0,max);}
async function digest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function onRequestPost({request,env}){
  if(!env?.FOUNDER_PASSWORD||!env?.FOUNDER_SESSION_SECRET)return json({error:'Founder login is not configured.'},503);
  try{
    const body=await request.json(),password=clean(body.password,200);
    const expected=await digest(env.FOUNDER_PASSWORD),actual=await digest(password);
    if(actual!==expected)return json({error:'Incorrect founder password.'},401);
    const issued=Date.now(),expires=issued+1000*60*60*12;
    const payload=`founder:${issued}:${expires}`;
    const sig=await digest(`${payload}:${env.FOUNDER_SESSION_SECRET}`);
    const token=btoa(`${payload}:${sig}`);
    return json({ok:true,token,profile:{name:'Yutani Pretorius',handle:'@yutanipretorius',role:'Founder'}});
  }catch{return json({error:'Unable to sign in.'},500);}
}
