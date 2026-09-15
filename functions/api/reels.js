function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
const uid=(prefix)=>prefix+'-'+crypto.randomUUID();
const enc=new TextEncoder();async function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}async function digest(v){return hex(await crypto.subtle.digest('SHA-256',enc.encode(v)))}
async function member(request,db){const a=request.headers.get('Authorization')||'';if(!a.startsWith('Bearer '))return null;return db.prepare(`SELECT u.id,u.name,u.username,u.profile_photo FROM hubcore_sessions s JOIN hubcore_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(await digest(a.slice(7)),Date.now()).first()}
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
export async function onRequestGet({env}){if(!env?.DB)return json({error:'Reel storage is unavailable.',uploadReady:false},503);try{await ensure(env.DB);return json({reels:await read(env.DB),uploadReady:Boolean(env?.MEDIA)});}catch(e){return json({error:'Unable to load Reel Vibes.',uploadReady:false},500);}}
export async function onRequestPost({request,env}){if(!env?.DB)return json({error:'Reel storage is unavailable.'},503);try{
  await ensure(env.DB); const b=await request.json(); const action=clean(b.action,30);
  if(action==='create_reel'){
    const u=await member(request,env.DB);if(!u)return json({error:'Please sign up or log in before publishing a Reel Vibe.'},401);
    const title=clean(b.title,120),caption=clean(b.caption,800),videoUrl=clean(b.videoUrl,1200);
    if(!title||!videoUrl)return json({error:'A Reel title and uploaded video are required.'},400);
    if(!videoUrl.startsWith('/api/media/')){let url;try{url=new URL(videoUrl);if(url.protocol!=='https:')throw 0;}catch{return json({error:'Use an uploaded video or secure https video link.'},400);}}
    const id=uid('reel');await env.DB.prepare(`INSERT INTO reels (id,author,handle,title,caption,video_url,theme,featured,created_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id,u.name,'@'+u.username,title,caption,videoUrl,'creator',0,Date.now()).run();return json({ok:true,id});
  }
  if(action==='comment'){
    const u=await member(request,env.DB);if(!u)return json({error:'Please sign up or log in before commenting.'},401);
    const reelId=clean(b.reelId,120),text=clean(b.text,1000);if(!reelId||!text)return json({error:'Write a comment first.'},400);
    const exists=await env.DB.prepare('SELECT id FROM reels WHERE id=?').bind(reelId).first();if(!exists)return json({error:'Reel not found.'},404);
    const id=uid('rc'),author=`${u.name} · @${u.username}`;await env.DB.prepare(`INSERT INTO reel_comments (id,reel_id,author,text,created_at) VALUES (?,?,?,?,?)`).bind(id,reelId,author,text,Date.now()).run();return json({ok:true,id});
  }
  if(action==='like'||action==='share'){
    const reelId=clean(b.reelId,120),column=action==='like'?'likes':'shares';if(!reelId)return json({error:'Reel is required.'},400);
    await env.DB.prepare(`UPDATE reels SET ${column}=${column}+1 WHERE id=?`).bind(reelId).run();const row=await env.DB.prepare(`SELECT ${column} AS total FROM reels WHERE id=?`).bind(reelId).first();if(!row)return json({error:'Reel not found.'},404);return json({ok:true,total:Number(row.total)});
  }
  return json({error:'Unknown reel action.'},400);
}catch(e){console.error('Reel Vibes API error',e);return json({error:'Unable to save Reel Vibes data.'},500);}}
