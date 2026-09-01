function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,max)=>String(v??'').trim().slice(0,max);
async function digest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function verifyFounderToken(token,env){
  if(!token||!env?.FOUNDER_SESSION_SECRET)return false;
  try{const decoded=atob(String(token)),parts=decoded.split(':');if(parts.length!==5||parts[0]!=='founder')return false;const issued=Number(parts[1]),expires=Number(parts[2]),sig=parts[3]+':'+parts[4];const payload=`founder:${issued}:${expires}`;const expected=await digest(`${payload}:${env.FOUNDER_SESSION_SECRET}`);return Date.now()<expires&&sig===expected;}catch{return false;}
}
async function ensure(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY,visitor_id TEXT NOT NULL,event_name TEXT NOT NULL,country TEXT NOT NULL DEFAULT 'XX',path TEXT NOT NULL DEFAULT '/',timestamp INTEGER NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events(event_name,timestamp DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_country_time ON analytics_events(country,timestamp DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_visitor_time ON analytics_events(visitor_id,timestamp DESC)`)
  ]);
}
const ALLOWED=new Set(['page_view','early_access','play_teaser','reality_switch','investors','enter_community','community_open','early_access_submit','investor_submit']);
function founderTokenFromRequest(request){const auth=request.headers.get('Authorization')||'';return auth.startsWith('Bearer ')?auth.slice(7).trim():'';}
function daysFromUrl(request){const raw=Number(new URL(request.url).searchParams.get('days')||30);return [1,7,30,90].includes(raw)?raw:30;}
export async function onRequestPost({request,env}){
  if(!env?.DB)return json({error:'Analytics database is not connected.'},503);
  try{
    await ensure(env.DB);
    const body=await request.json(),eventName=clean(body.eventName,40),visitorId=clean(body.visitorId,120),path=clean(body.path||'/',300)||'/';
    if(!ALLOWED.has(eventName)||!visitorId)return json({error:'Invalid analytics event.'},400);
    const country=clean(request.cf?.country||'XX',2).toUpperCase()||'XX';
    const now=Date.now();
    await env.DB.prepare('INSERT INTO analytics_events (id,visitor_id,event_name,country,path,timestamp) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),visitorId,eventName,country,path,now).run();
    return json({ok:true},201);
  }catch{return json({error:'Unable to record analytics.'},500);}
}
export async function onRequestGet({request,env}){
  if(!env?.DB)return json({error:'Analytics database is not connected.'},503);
  const token=founderTokenFromRequest(request);if(!await verifyFounderToken(token,env))return json({error:'Founder access required.'},401);
  try{
    await ensure(env.DB);const days=daysFromUrl(request),since=Date.now()-days*86400000;
    const [events,countries,summary]=await Promise.all([
      env.DB.prepare(`SELECT event_name,COUNT(*) AS clicks,COUNT(DISTINCT visitor_id) AS people FROM analytics_events WHERE timestamp>=? GROUP BY event_name ORDER BY people DESC`).bind(since).all(),
      env.DB.prepare(`SELECT country,COUNT(*) AS events,COUNT(DISTINCT visitor_id) AS visitors FROM analytics_events WHERE timestamp>=? AND event_name='page_view' GROUP BY country ORDER BY visitors DESC,events DESC`).bind(since).all(),
      env.DB.prepare(`SELECT COUNT(*) AS page_views,COUNT(DISTINCT visitor_id) AS unique_visitors FROM analytics_events WHERE timestamp>=? AND event_name='page_view'`).bind(since).first()
    ]);
    const eventMap={};for(const row of events.results||[])eventMap[row.event_name]={people:Number(row.people||0),clicks:Number(row.clicks||0)};
    return json({ok:true,days,summary:{uniqueVisitors:Number(summary?.unique_visitors||0),pageViews:Number(summary?.page_views||0)},events:eventMap,countries:(countries.results||[]).map(r=>({country:r.country||'XX',visitors:Number(r.visitors||0),pageViews:Number(r.events||0)})),updatedAt:Date.now()});
  }catch{return json({error:'Unable to load analytics.'},500);}
}
