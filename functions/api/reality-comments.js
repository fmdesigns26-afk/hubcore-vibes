function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}})}
const enc=new TextEncoder();
const choices=new Set(['Call Heisenberg and drop it off','Open the drive first']);
const clean=(v,n=1600)=>String(v??'').trim().slice(0,n);
async function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function digest(v){return hex(await crypto.subtle.digest('SHA-256',enc.encode(v)))}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS reality_switch_comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    choice TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_reality_comments_created ON reality_switch_comments(created_at DESC)').run();
}
async function member(request,db){
  const auth=request.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer '))return null;
  const tokenHash=await digest(auth.slice(7));
  return db.prepare(`SELECT u.id,u.name,u.username FROM hubcore_sessions s JOIN hubcore_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(tokenHash,Date.now()).first();
}
async function read(db){
  const rows=await db.prepare('SELECT id,name,username,choice,text,created_at FROM reality_switch_comments ORDER BY created_at DESC LIMIT 100').all();
  return (rows.results||[]).map(r=>({id:r.id,name:r.name,username:r.username,choice:r.choice||'',text:r.text,createdAt:Number(r.created_at||0)}));
}
export async function onRequestGet({env}){
  if(!env?.DB)return json({error:'Reality Switch comments are unavailable.'},503);
  try{await ensure(env.DB);return json({comments:await read(env.DB)});}catch(error){console.error('Reality comments GET error',error);return json({error:'Unable to load Reality Switch comments.'},500);}
}
export async function onRequestPost({request,env}){
  if(!env?.DB)return json({error:'Reality Switch comments are unavailable.'},503);
  try{
    await ensure(env.DB);
    const u=await member(request,env.DB);
    if(!u)return json({error:'Please sign up or log in before commenting.'},401);
    const body=await request.json();
    const text=clean(body.text,1600),choice=clean(body.choice,80);
    if(!text)return json({error:'Write your comment first.'},400);
    if(choice&&!choices.has(choice))return json({error:'Choose one of the two Reality Switch options.'},400);
    const id='reality-comment-'+crypto.randomUUID(),createdAt=Date.now();
    await env.DB.prepare('INSERT INTO reality_switch_comments (id,user_id,name,username,choice,text,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,u.id,u.name,u.username,choice,text,createdAt).run();
    return json({ok:true,comment:{id,name:u.name,username:u.username,choice,text,createdAt}},201);
  }catch(error){console.error('Reality comments POST error',error);return json({error:'Unable to save your Reality Switch comment.'},500);}
}
