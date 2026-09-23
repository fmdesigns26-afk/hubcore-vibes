function json(data,status=200){
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}});
}

function keyFromParams(params){
  const raw=params?.path;
  const value=Array.isArray(raw)?raw.join('/'):String(raw||'');
  try{return decodeURIComponent(value).replace(/^\/+/, '');}
  catch{return value.replace(/^\/+/, '');}
}

function contentType(object){
  return object?.httpMetadata?.contentType || 'application/octet-stream';
}

function baseHeaders(object){
  const headers=new Headers();
  headers.set('Content-Type',contentType(object));
  headers.set('Accept-Ranges','bytes');
  headers.set('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');
  if(object?.httpEtag)headers.set('ETag',object.httpEtag);
  if(object?.uploaded)headers.set('Last-Modified',new Date(object.uploaded).toUTCString());
  return headers;
}

function parseRange(header,size){
  const match=/^bytes=(\d*)-(\d*)$/i.exec(String(header||'').trim());
  if(!match)return null;
  let start=match[1]?Number(match[1]):null;
  let end=match[2]?Number(match[2]):null;
  if(start===null&&end===null)return null;
  if(start===null){
    const suffix=Math.min(size,Math.max(0,end||0));
    start=Math.max(0,size-suffix);end=size-1;
  }else{
    if(!Number.isFinite(start)||start<0||start>=size)return {invalid:true};
    if(end===null||!Number.isFinite(end)||end>=size)end=size-1;
    if(end<start)return {invalid:true};
  }
  return {start,end,length:end-start+1};
}

async function serve(request,env,params,headOnly=false){
  if(!env?.MEDIA)return json({error:'HubCore media storage is not connected.'},503);
  const key=keyFromParams(params);
  if(!key||!key.startsWith('reels/')||key.includes('..'))return json({error:'Media not found.'},404);

  const meta=await env.MEDIA.head(key);
  if(!meta)return json({error:'Media not found.'},404);

  const headers=baseHeaders(meta);
  const range=parseRange(request.headers.get('Range'),Number(meta.size||0));
  if(range?.invalid){
    headers.set('Content-Range',`bytes */${meta.size}`);
    return new Response(null,{status:416,headers});
  }

  if(headOnly){
    headers.set('Content-Length',String(meta.size||0));
    return new Response(null,{status:200,headers});
  }

  if(range){
    const object=await env.MEDIA.get(key,{range:{offset:range.start,length:range.length}});
    if(!object)return json({error:'Media not found.'},404);
    headers.set('Content-Length',String(range.length));
    headers.set('Content-Range',`bytes ${range.start}-${range.end}/${meta.size}`);
    return new Response(object.body,{status:206,headers});
  }

  const object=await env.MEDIA.get(key);
  if(!object)return json({error:'Media not found.'},404);
  headers.set('Content-Length',String(meta.size||0));
  return new Response(object.body,{status:200,headers});
}

export async function onRequestGet({request,env,params}){
  try{return await serve(request,env,params,false);}
  catch(error){console.error('HubCore media GET error',error);return json({error:'Unable to load media.'},500);}
}

export async function onRequestHead({request,env,params}){
  try{return await serve(request,env,params,true);}
  catch(error){console.error('HubCore media HEAD error',error);return new Response(null,{status:500});}
}
