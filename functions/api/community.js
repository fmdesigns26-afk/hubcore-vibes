function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
function cleanText(value,max){return String(value??'').trim().slice(0,max);}
async function digest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function verifyFounderToken(token,env){
  if(!token||!env?.FOUNDER_SESSION_SECRET)return false;
  try{const decoded=atob(String(token)),parts=decoded.split(':');if(parts.length!==4||parts[0]!=='founder')return false;const issued=Number(parts[1]),expires=Number(parts[2]),sig=parts[3];const payload=`founder:${issued}:${expires}`;const expected=await digest(`${payload}:${env.FOUNDER_SESSION_SECRET}`);return Date.now()<expires&&sig===expected;}catch{return false;}
}
async function ensureSchema(db){await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS community_posts (id TEXT PRIMARY KEY,name TEXT NOT NULL,handle TEXT NOT NULL,avatar TEXT NOT NULL,timestamp INTEGER NOT NULL,text TEXT NOT NULL,reactions_json TEXT NOT NULL DEFAULT '{"like":0,"hub":0,"fire":0,"inspire":0}',is_founder INTEGER NOT NULL DEFAULT 0)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS community_comments (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,author TEXT NOT NULL,text TEXT NOT NULL,timestamp INTEGER NOT NULL,reply_to TEXT,is_founder INTEGER NOT NULL DEFAULT 0,FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS community_shares (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,timestamp INTEGER NOT NULL,channel TEXT,FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_posts_timestamp ON community_posts(timestamp DESC)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id,timestamp ASC)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_shares_post_id ON community_shares(post_id,timestamp DESC)`)
]);
  try{await db.prepare(`ALTER TABLE community_posts ADD COLUMN is_founder INTEGER NOT NULL DEFAULT 0`).run();}catch{}
  try{await db.prepare(`ALTER TABLE community_comments ADD COLUMN is_founder INTEGER NOT NULL DEFAULT 0`).run();}catch{}
}
async function removeLegacyDemoData(db){
  await db.prepare(`DELETE FROM community_comments WHERE id IN ('c-1','c-2') OR post_id IN ('seed-1','seed-2')`).run();
  await db.prepare(`DELETE FROM community_shares WHERE post_id IN ('seed-1','seed-2')`).run();
  await db.prepare(`DELETE FROM community_posts WHERE id IN ('seed-1','seed-2')`).run();
}
async function readPosts(db){
  const posts=await db.prepare(`SELECT id,name,handle,avatar,timestamp,text,reactions_json,is_founder FROM community_posts ORDER BY timestamp DESC LIMIT 100`).all();
  const ids=posts.results.map(p=>p.id);let comments=[],shares=[];
  if(ids.length){
    const ph=ids.map(()=>'?').join(',');
    const [commentResult,shareResult]=await Promise.all([
      db.prepare(`SELECT id,post_id,author,text,timestamp,reply_to,is_founder FROM community_comments WHERE post_id IN (${ph}) ORDER BY timestamp ASC`).bind(...ids).all(),
      db.prepare(`SELECT post_id,COUNT(*) AS count FROM community_shares WHERE post_id IN (${ph}) GROUP BY post_id`).bind(...ids).all()
    ]);
    comments=commentResult.results||[];shares=shareResult.results||[];
  }
  const commentMap=new Map(),shareMap=new Map();
  for(const c of comments){if(!commentMap.has(c.post_id))commentMap.set(c.post_id,[]);commentMap.get(c.post_id).push({id:c.id,author:c.author,text:c.text,timestamp:Number(c.timestamp),replyTo:c.reply_to||null,isFounder:Boolean(c.is_founder)});}
  for(const s of shares){shareMap.set(s.post_id,Number(s.count||0));}
  return posts.results.map(p=>({id:p.id,name:p.name,handle:p.handle,avatar:p.avatar,timestamp:Number(p.timestamp),text:p.text,isFounder:Boolean(p.is_founder),reactions:JSON.parse(p.reactions_json||'{"like":0,"hub":0,"fire":0,"inspire":0}'),comments:commentMap.get(p.id)||[],shares:shareMap.get(p.id)||0}));
}
export async function onRequestGet(context){const {env}=context;if(!env?.DB)return json({error:'D1 database binding DB is not configured.'},503);try{await ensureSchema(env.DB);await removeLegacyDemoData(env.DB);return json({posts:await readPosts(env.DB),serverTime:Date.now()});}catch(error){return json({error:'Unable to load community data.'},500);}}
export async function onRequestPost(context){
  const {request,env}=context;if(!env?.DB)return json({error:'D1 database binding DB is not configured.'},503);
  try{
    await ensureSchema(env.DB);await removeLegacyDemoData(env.DB);const body=await request.json();const action=cleanText(body.action,30);const founder=await verifyFounderToken(body.founderToken,env);
    if(action==='create_post'){
      const p=body.post||{},id=cleanText(p.id,120),text=cleanText(p.text,280);let name=cleanText(p.name,80),handle=cleanText(p.handle,80);
      if(founder){name='Yutani Pretorius';handle='@yutanipretorius';}
      if(!id||!text||!name||!handle)return json({error:'Name, username and post text are required.'},400);
      await env.DB.prepare(`INSERT OR IGNORE INTO community_posts (id,name,handle,avatar,timestamp,text,reactions_json,is_founder) VALUES (?,?,?,?,?,?,?,?)`).bind(id,name,handle,founder?'YP':(cleanText(p.avatar,20)||name.slice(0,2).toUpperCase()),Number(p.timestamp)||Date.now(),text,JSON.stringify({like:0,hub:0,fire:0,inspire:0}),founder?1:0).run();
      return json({ok:true,synced:true,id,isFounder:founder});
    }
    if(action==='create_comment'){
      const c=body.comment||{},id=cleanText(c.id,120),postId=cleanText(c.postId,120),text=cleanText(c.text,20000);let author=cleanText(c.author,120);
      if(founder)author='Founder · Yutani Pretorius · @yutanipretorius';
      if(!id||!postId||!text||!author)return json({error:'Name, username and comment are required.'},400);
      await env.DB.prepare(`INSERT OR IGNORE INTO community_comments (id,post_id,author,text,timestamp,reply_to,is_founder) VALUES (?,?,?,?,?,?,?)`).bind(id,postId,author,text,Number(c.timestamp)||Date.now(),cleanText(c.replyTo,120)||null,founder?1:0).run();
      return json({ok:true,synced:true,id,isFounder:founder});
    }
    if(action==='set_reaction'){
      const postId=cleanText(body.postId,120),reaction=cleanText(body.reaction,20),delta=Math.max(-1,Math.min(1,Number(body.delta)||0));
      if(!postId||!['like','hub','fire','inspire'].includes(reaction)||!delta)return json({error:'Invalid reaction.'},400);
      const current=await env.DB.prepare('SELECT reactions_json FROM community_posts WHERE id=?').bind(postId).first();if(!current)return json({error:'Post not found.'},404);
      const reactions=JSON.parse(current.reactions_json||'{}');reactions[reaction]=Math.max(0,Number(reactions[reaction]||0)+delta);
      await env.DB.prepare('UPDATE community_posts SET reactions_json=? WHERE id=?').bind(JSON.stringify(reactions),postId).run();return json({ok:true,synced:true,reactions});
    }
    if(action==='record_share'){
      const id=cleanText(body.id,120),postId=cleanText(body.postId,120),channel=cleanText(body.channel,40);
      if(!id||!postId)return json({error:'Share id and post id are required.'},400);
      const exists=await env.DB.prepare('SELECT id FROM community_posts WHERE id=?').bind(postId).first();if(!exists)return json({error:'Post not found.'},404);
      await env.DB.prepare('INSERT OR IGNORE INTO community_shares (id,post_id,timestamp,channel) VALUES (?,?,?,?)').bind(id,postId,Date.now(),channel||null).run();
      const total=await env.DB.prepare('SELECT COUNT(*) AS count FROM community_shares WHERE post_id=?').bind(postId).first();
      return json({ok:true,synced:true,shares:Number(total?.count||0)});
    }
    if(action==='delete_comment'){const id=cleanText(body.commentId,120);if(!id)return json({error:'Comment id is required.'},400);await env.DB.prepare('DELETE FROM community_comments WHERE id=?').bind(id).run();return json({ok:true,synced:true});}
    return json({error:'Unknown community action.'},400);
  }catch(error){return json({error:'Unable to save community data.'},500);}
}
