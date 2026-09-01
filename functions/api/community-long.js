function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
function clean(value,max){return String(value??'').trim().slice(0,max);}
async function digest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function verifyFounderToken(token,env){
  if(!token||!env?.FOUNDER_SESSION_SECRET)return false;
  try{const decoded=atob(String(token)),parts=decoded.split(':');if(parts.length!==4||parts[0]!=='founder')return false;const issued=Number(parts[1]),expires=Number(parts[2]),sig=parts[3];const payload=`founder:${issued}:${expires}`;const expected=await digest(`${payload}:${env.FOUNDER_SESSION_SECRET}`);return Date.now()<expires&&sig===expected;}catch{return false;}
}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS community_comments (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,author TEXT NOT NULL,text TEXT NOT NULL,timestamp INTEGER NOT NULL,reply_to TEXT,is_founder INTEGER NOT NULL DEFAULT 0,FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE)`).run();
  try{await db.prepare(`ALTER TABLE community_comments ADD COLUMN is_founder INTEGER NOT NULL DEFAULT 0`).run();}catch{}
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id,timestamp ASC)`).run();
}
export async function onRequestPost({request,env}){
  if(!env?.DB)return json({error:'D1 database binding DB is not configured.'},503);
  try{
    await ensure(env.DB);
    const body=await request.json();
    if(clean(body.action,30)!=='create_comment')return json({error:'Unknown community action.'},400);
    const c=body.comment||{};
    const id=clean(c.id,120),postId=clean(c.postId,120),text=String(c.text??'').trim();
    const founder=await verifyFounderToken(body.founderToken,env);
    let author=clean(c.author,120);
    if(founder)author='Founder · Yutani Pretorius · @yutanipretorius';
    if(!id||!postId||!text||!author)return json({error:'Name, username and comment are required.'},400);
    const post=await env.DB.prepare('SELECT id FROM community_posts WHERE id=?').bind(postId).first();
    if(!post)return json({error:'Post not found.'},404);
    await env.DB.prepare(`INSERT OR IGNORE INTO community_comments (id,post_id,author,text,timestamp,reply_to,is_founder) VALUES (?,?,?,?,?,?,?)`).bind(id,postId,author,text,Number(c.timestamp)||Date.now(),clean(c.replyTo,120)||null,founder?1:0).run();
    return json({ok:true,synced:true,id,isFounder:founder});
  }catch(error){return json({error:'Unable to save community comment.'},500);}
}
