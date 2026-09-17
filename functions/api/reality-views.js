function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,max)=>String(v??'').trim().slice(0,max);
const VIDEO_IDS=new Set(['trailer-1','trailer-2']);
const SEPT_1_2026=Date.UTC(2026,8,1,0,0,0,0);

async function ensure(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS reality_video_views (id TEXT PRIMARY KEY,video_id TEXT NOT NULL,visitor_id TEXT NOT NULL,session_id TEXT NOT NULL,country TEXT NOT NULL DEFAULT 'XX',timestamp INTEGER NOT NULL,UNIQUE(video_id,session_id))`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reality_video_views_video_time ON reality_video_views(video_id,timestamp DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_reality_video_views_visitor ON reality_video_views(visitor_id,video_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reality_video_view_meta (key TEXT PRIMARY KEY,value INTEGER NOT NULL)`)
  ]);
  await db.prepare(`INSERT OR IGNORE INTO reality_video_view_meta (key,value) VALUES ('tracking_started_at',?)`).bind(Date.now()).run();
}

async function totals(db){
  const [rows,meta]=await Promise.all([
    db.prepare(`SELECT video_id,COUNT(*) AS views,COUNT(DISTINCT visitor_id) AS viewers FROM reality_video_views GROUP BY video_id`).all(),
    db.prepare(`SELECT value FROM reality_video_view_meta WHERE key='tracking_started_at'`).first()
  ]);
  const videos={
    'trailer-1':{views:0,viewers:0},
    'trailer-2':{views:0,viewers:0}
  };
  for(const row of rows.results||[]){
    if(videos[row.video_id])videos[row.video_id]={views:Number(row.views||0),viewers:Number(row.viewers||0)};
  }
  let legacy={playsSinceSep1:0,peopleSinceSep1:0};
  try{
    const old=await db.prepare(`SELECT COUNT(*) AS plays,COUNT(DISTINCT visitor_id) AS people FROM analytics_events WHERE event_name='play_teaser' AND timestamp>=?`).bind(SEPT_1_2026).first();
    legacy={playsSinceSep1:Number(old?.plays||0),peopleSinceSep1:Number(old?.people||0)};
  }catch{}
  return {videos,legacy,trackingStartedAt:Number(meta?.value||Date.now()),updatedAt:Date.now()};
}

export async function onRequestGet({env}){
  if(!env?.DB)return json({error:'Video view database is not connected.'},503);
  try{
    await ensure(env.DB);
    return json({ok:true,...await totals(env.DB)});
  }catch(error){
    console.error('Reality video views GET failed',error);
    return json({error:'Unable to load Reality Switch video views.'},500);
  }
}

export async function onRequestPost({request,env}){
  if(!env?.DB)return json({error:'Video view database is not connected.'},503);
  try{
    await ensure(env.DB);
    const body=await request.json();
    const videoId=clean(body.videoId,30),visitorId=clean(body.visitorId,120),sessionId=clean(body.sessionId,120);
    if(!VIDEO_IDS.has(videoId)||!visitorId||!sessionId)return json({error:'Invalid video view event.'},400);
    const country=clean(request.cf?.country||'XX',2).toUpperCase()||'XX';
    await env.DB.prepare(`INSERT OR IGNORE INTO reality_video_views (id,video_id,visitor_id,session_id,country,timestamp) VALUES (?,?,?,?,?,?)`).bind(crypto.randomUUID(),videoId,visitorId,sessionId,country,Date.now()).run();
    return json({ok:true,...await totals(env.DB)},201);
  }catch(error){
    console.error('Reality video views POST failed',error);
    return json({error:'Unable to record Reality Switch video view.'},500);
  }
}
