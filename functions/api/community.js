function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
function cleanText(value,max){return String(value??'').trim().slice(0,max);}
async function ensureSchema(db){await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS community_posts (id TEXT PRIMARY KEY,name TEXT NOT NULL,handle TEXT NOT NULL,avatar TEXT NOT NULL,timestamp INTEGER NOT NULL,text TEXT NOT NULL,reactions_json TEXT NOT NULL DEFAULT '{"like":0,"hub":0,"fire":0,"inspire":0}')`),
  db.prepare(`CREATE TABLE IF NOT EXISTS community_comments (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,author TEXT NOT NULL,text TEXT NOT NULL,timestamp INTEGER NOT NULL,reply_to TEXT,FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_posts_timestamp ON community_posts(timestamp DESC)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id,timestamp ASC)`)
]);}
async function removeLegacyDemoData(db){
  await db.prepare(`DELETE FROM community_comments WHERE id IN ('c-1','c-2') OR post_id IN ('seed-1','seed-2')`).run();
  await db.prepare(`DELETE FROM community_posts WHERE id IN ('seed-1','seed-2')`).run();
}
async function readPosts(db){
  const posts=await db.prepare(`SELECT id,name,handle,avatar,timestamp,text,reactions_json FROM community_posts ORDER BY timestamp DESC LIMIT 100`).all();
  const ids=posts.results.map(p=>p.id);let comments=[];
  if(ids.length){const ph=ids.map(()=>'?').join(',');const result=await db.prepare(`SELECT id,post_id,author,text,timestamp,reply_to FROM community_comments WHERE post_id IN (${ph}) ORDER BY timestamp ASC`).bind(...ids).all();comments=result.results;}
  const map=new Map();
  for(const c of comments){if(!map.has(c.post_id))map.set(c.post_id,[]);map.get(c.post_id).push({id:c.id,author:c.author,text:c.text,timestamp:Number(c.timestamp),replyTo:c.reply_to||null});}
  return posts.results.map(p=>({id:p.id,name:p.name,handle:p.handle,avatar:p.avatar,timestamp:Number(p.timestamp),text:p.text,reactions:JSON.parse(p.reactions_json||'{"like":0,"hub":0,"fire":0,"inspire":0}'),comments:map.get(p.id)||[]}));
}
export async function onRequestGet(context){const {env}=context;if(!env?.DB)return json({error:'D1 database binding DB is not configured.'},503);try{await ensureSchema(env.DB);await removeLegacyDemoData(env.DB);return json({posts:await readPosts(env.DB),serverTime:Date.now()});}catch(error){return json({error:'Unable to load community data.'},500);}}
export async function onRequestPost(context){
  const {request,env}=context;if(!env?.DB)return json({error:'D1 database binding DB is not configured.'},503);
  try{
    await ensureSchema(env.DB);await removeLegacyDemoData(env.DB);const body=await request.json();const action=cleanText(body.action,30);
    if(action==='create_post'){
      const p=body.post||{},id=cleanText(p.id,120),text=cleanText(p.text,280),name=cleanText(p.name,80),handle=cleanText(p.handle,80);
      if(!id||!text||!name||!handle)return json({error:'Name, username and post text are required.'},400);
      await env.DB.prepare(`INSERT OR IGNORE INTO community_posts (id,name,handle,avatar,timestamp,text,reactions_json) VALUES (?,?,?,?,?,?,?)`).bind(id,name,handle,cleanText(p.avatar,20)||name.slice(0,2).toUpperCase(),Number(p.timestamp)||Date.now(),text,JSON.stringify({like:0,hub:0,fire:0,inspire:0})).run();
      return json({ok:true,synced:true,id});
    }
    if(action==='create_comment'){
      const c=body.comment||{},id=cleanText(c.id,120),postId=cleanText(c.postId,120),text=cleanText(c.text,180),author=cleanText(c.author,120);
      if(!id||!postId||!text||!author)return json({error:'Name, username and comment are required.'},400);
      await env.DB.prepare(`INSERT OR IGNORE INTO community_comments (id,post_id,author,text,timestamp,reply_to) VALUES (?,?,?,?,?,?)`).bind(id,postId,author,text,Number(c.timestamp)||Date.now(),cleanText(c.replyTo,120)||null).run();
      return json({ok:true,synced:true,id});
    }
    if(action==='set_reaction'){
      const postId=cleanText(body.postId,120),reaction=cleanText(body.reaction,20),delta=Math.max(-1,Math.min(1,Number(body.delta)||0));
      if(!postId||!['like','hub','fire','inspire'].includes(reaction)||!delta)return json({error:'Invalid reaction.'},400);
      const current=await env.DB.prepare('SELECT reactions_json FROM community_posts WHERE id=?').bind(postId).first();if(!current)return json({error:'Post not found.'},404);
      const reactions=JSON.parse(current.reactions_json||'{}');reactions[reaction]=Math.max(0,Number(reactions[reaction]||0)+delta);
      await env.DB.prepare('UPDATE community_posts SET reactions_json=? WHERE id=?').bind(JSON.stringify(reactions),postId).run();return json({ok:true,synced:true,reactions});
    }
    if(action==='delete_comment'){const id=cleanText(body.commentId,120);if(!id)return json({error:'Comment id is required.'},400);await env.DB.prepare('DELETE FROM community_comments WHERE id=?').bind(id).run();return json({ok:true,synced:true});}
    return json({error:'Unknown community action.'},400);
  }catch(error){return json({error:'Unable to save community data.'},500);}
}
