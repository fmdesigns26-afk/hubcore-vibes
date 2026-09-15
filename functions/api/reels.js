function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
const uid=(prefix)=>prefix+'-'+crypto.randomUUID();
async function ensure(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS reels (id TEXT PRIMARY KEY, author TEXT NOT NULL, handle TEXT NOT NULL DEFAULT '', title TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '', theme TEXT NOT NULL DEFAULT 'creator', featured INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, likes INTEGER NOT NULL DEFAULT 0, shares INTEGER NOT NULL DEFAULT 0)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reel_comments (id TEXT PRIMARY KEY, reel_id TEXT NOT NULL, author TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(reel_id) REFERENCES reels(id) ON DELETE CASCADE)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reels_created ON reels(featured DESC,created_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reel_comments ON reel_comments(reel_id,created_at ASC)`)
  ]);
  await db.prepare(`DELETE FROM reel_comments WHERE reel_id IN ('trend-pov','hubcore-tour','trend-food')`).run();
  await db.prepare(`DELETE FROM reels WHERE id IN ('trend-pov','hubcore-tour','trend-food')`).run();
}
async function read(db){
  const reels=await db.prepare(`SELECT id,author,handle,title,caption,video_url,theme,featured,created_at,likes,shares FROM reels ORDER BY featured DESC,created_at DESC LIMIT 60`).all();
  const comments=await db.prepare(`SELECT id,reel_id,author,text,created_at FROM reel_comments ORDER BY created_at ASC LIMIT 600`).all();
  const map=new Map(); for(const c of comments.results||[]){if(!map.has(c.reel_id))map.set(c.reel_id,[]);map.get(c.reel_id).push({id:c.id,author:c.author,text:c.text,createdAt:Number(c.created_at)});}
  return (reels.results||[]).map(r=>({id:r.id,author:r.author,handle:r.handle,title:r.title,caption:r.caption,videoUrl:r.video_url,theme:r.theme,featured:Boolean(r.featured),createdAt:Number(r.created_at),likes:Number(r.likes),shares:Number(r.shares),comments:map.get(r.id)||[]}));
}
export async function onRequestGet({env}){if(!env?.DB)return json({error:'Reel storage is unavailable.'},503);try{await ensure(env.DB);return json({reels:await read(env.DB)});}catch(e){return json({error:'Unable to load Reel Vibes.'},500);}}
export async function onRequestPost({request,env}){if(!env?.DB)return json({error:'Reel storage is unavailable.'},503);try{
  await ensure(env.DB); const b=await request.json(); const action=clean(b.action,30);
  if(action==='create_reel'){
    const author=clean(b.author,80),handle=clean(b.handle,80),title=clean(b.title,120),caption=clean(b.caption,800),videoUrl=clean(b.videoUrl,1200);
    if(!author||!title||!videoUrl)return json({error:'Creator name, title and video link are required.'},400);
    if(!videoUrl.startsWith('/api/media/')){let u;try{u=new URL(videoUrl);if(u.protocol!=='https:')throw 0;}catch{return json({error:'Use an uploaded video or secure https video link.'},400);}}
    const id=uid('reel');await env.DB.prepare(`INSERT INTO reels (id,author,handle,title,caption,video_url,theme,featured,created_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id,author,handle,title,caption,videoUrl,'creator',0,Date.now()).run();return json({ok:true,id});
  }
  if(action==='comment'){
    const reelId=clean(b.reelId,120),author=clean(b.author,80),text=clean(b.text,1000);if(!reelId||!author||!text)return json({error:'Name and comment are required.'},400);
    const exists=await env.DB.prepare('SELECT id FROM reels WHERE id=?').bind(reelId).first();if(!exists)return json({error:'Reel not found.'},404);
    const id=uid('rc');await env.DB.prepare(`INSERT INTO reel_comments (id,reel_id,author,text,created_at) VALUES (?,?,?,?,?)`).bind(id,reelId,author,text,Date.now()).run();return json({ok:true,id});
  }
  if(action==='like'||action==='share'){
    const reelId=clean(b.reelId,120),column=action==='like'?'likes':'shares';if(!reelId)return json({error:'Reel is required.'},400);
    await env.DB.prepare(`UPDATE reels SET ${column}=${column}+1 WHERE id=?`).bind(reelId).run();const row=await env.DB.prepare(`SELECT ${column} AS total FROM reels WHERE id=?`).bind(reelId).first();if(!row)return json({error:'Reel not found.'},404);return json({ok:true,total:Number(row.total)});
  }
  return json({error:'Unknown reel action.'},400);
}catch(e){return json({error:'Unable to save Reel Vibes data.'},500);}}
