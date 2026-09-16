import { hubcoreEmailStatus, sendHubCoreEmail } from '../_lib/hubcore-email.js';

function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
const enc=new TextEncoder();
async function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function digest(v){return hex(await crypto.subtle.digest('SHA-256',enc.encode(v)));}

const PLANS={
  day:{code:'day',label:'24-hour Promo Vibe',amountCents:1000,durationDays:1,featured:false,paymentEnv:'VIBEPROMOTE_PAY_10_URL'},
  three:{code:'three',label:'3-day Promo Reel',amountCents:2900,durationDays:3,featured:false,paymentEnv:'VIBEPROMOTE_PAY_29_URL'},
  week:{code:'week',label:'7-day Promo Reel',amountCents:4900,durationDays:7,featured:false,paymentEnv:'VIBEPROMOTE_PAY_49_URL'},
  featured:{code:'featured',label:'Featured 7-day Promo',amountCents:9900,durationDays:7,featured:true,paymentEnv:'VIBEPROMOTE_PAY_99_URL'}
};

async function member(request,db){
  const a=request.headers.get('Authorization')||'';
  if(!a.startsWith('Bearer '))return null;
  return db.prepare(`SELECT u.id,u.name,u.username,u.email FROM hubcore_sessions s JOIN hubcore_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(await digest(a.slice(7)),Date.now()).first();
}

async function founderTokenValid(token,env){
  if(!token||!env?.FOUNDER_SESSION_SECRET)return false;
  try{
    const decoded=atob(String(token)),parts=decoded.split(':');
    if(parts.length!==4||parts[0]!=='founder')return false;
    const issued=Number(parts[1]),expires=Number(parts[2]),sig=parts[3];
    if(!Number.isFinite(issued)||!Number.isFinite(expires)||Date.now()>expires)return false;
    const payload=`founder:${issued}:${expires}`;
    return sig===await digest(`${payload}:${env.FOUNDER_SESSION_SECRET}`);
  }catch{return false;}
}

async function founder(request,env,body={}){
  const a=request.headers.get('Authorization')||'';
  const token=a.startsWith('Bearer ')?a.slice(7):clean(body.founderToken,2000);
  return founderTokenValid(token,env);
}

async function ensure(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS vibe_promotions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT '',
      author_handle TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL,
      business_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Other',
      destination_url TEXT NOT NULL DEFAULT '',
      media_url TEXT NOT NULL DEFAULT '',
      reel_id TEXT NOT NULL DEFAULT '',
      plan_code TEXT NOT NULL,
      plan_label TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      approved_at INTEGER,
      starts_at INTEGER,
      ends_at INTEGER,
      views INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_vibe_promos_public ON vibe_promotions(status,payment_status,featured,ends_at,created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_vibe_promos_user ON vibe_promotions(user_id,created_at DESC)`)
  ]);
}

function validUrl(value,{optional=true}={}){
  const s=clean(value,1200);
  if(!s&&optional)return '';
  try{const u=new URL(s);if(u.protocol!=='https:')return null;return u.toString();}catch{return null;}
}

function paymentUrl(env,plan){return clean(env?.[plan.paymentEnv],1200);}
function money(cents){return `R${(Number(cents||0)/100).toFixed(0)}`;}
function publicRow(r){return {id:r.id,businessName:r.business_name,title:r.title,description:r.description,category:r.category,destinationUrl:r.destination_url,mediaUrl:r.media_url,planCode:r.plan_code,planLabel:r.plan_label,amountCents:Number(r.amount_cents),featured:Boolean(r.featured),startsAt:Number(r.starts_at||0),endsAt:Number(r.ends_at||0),views:Number(r.views||0),clicks:Number(r.clicks||0)};}
function founderRow(r){return {...publicRow(r),contactEmail:r.contact_email,authorName:r.author_name,authorHandle:r.author_handle,reelId:r.reel_id,paymentStatus:r.payment_status,status:r.status,createdAt:Number(r.created_at||0),approvedAt:Number(r.approved_at||0)};}

async function notifyFounder(env,promo,plan,payUrl){
  return sendHubCoreEmail(env,{
    purpose:'contact',
    replyTo:promo.contactEmail,
    subject:`VIBEPROMOTE ${money(plan.amountCents)} — ${promo.businessName}`,
    text:[
      'New HubCore Vibes VibePromote submission',
      '',
      `Reference: ${promo.id}`,
      `Business / creator: ${promo.businessName}`,
      `Member: ${promo.authorName} ${promo.authorHandle}`,
      `Email: ${promo.contactEmail}`,
      `Package: ${plan.label} — ${money(plan.amountCents)}`,
      `Category: ${promo.category}`,
      `Title: ${promo.title}`,
      `Description: ${promo.description||'—'}`,
      `Destination: ${promo.destinationUrl||'—'}`,
      `Media: ${promo.mediaUrl||'—'}`,
      `Existing Reel ID: ${promo.reelId||'—'}`,
      `Payment link configured: ${payUrl?'YES':'NO — reply to the customer to arrange payment manually'}`,
      '',
      'Founder action: sign in on HubCore Vibes, open VibePromote, mark the submission paid, then approve it. Approval starts the paid campaign timer.',
      '',
      'Reply directly to this email to contact the customer.'
    ].join('\n')
  });
}

export async function onRequestGet({request,env}){
  if(!env?.DB)return json({error:'VibePromote database is unavailable.'},503);
  try{
    await ensure(env.DB);
    const url=new URL(request.url),founderView=url.searchParams.get('founder')==='1';
    if(founderView){
      if(!await founder(request,env))return json({error:'Founder access required.'},401);
      const rows=await env.DB.prepare(`SELECT * FROM vibe_promotions ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC LIMIT 150`).all();
      return json({ok:true,promotions:(rows.results||[]).map(founderRow),email:hubcoreEmailStatus(env)});
    }
    const now=Date.now();
    const rows=await env.DB.prepare(`SELECT * FROM vibe_promotions WHERE status='approved' AND payment_status='paid' AND starts_at<=? AND ends_at>? ORDER BY featured DESC, approved_at DESC LIMIT 80`).bind(now,now).all();
    return json({ok:true,promotions:(rows.results||[]).map(publicRow)});
  }catch(error){console.error('VibePromote GET error',error);return json({error:'Unable to load VibePromote.'},500);}
}

export async function onRequestPost(context){
  const {request,env}=context;
  if(!env?.DB)return json({error:'VibePromote database is unavailable.'},503);
  try{
    await ensure(env.DB);
    const body=await request.json(),action=clean(body.action||'submit',30);

    if(action==='submit'){
      const u=await member(request,env.DB);
      if(!u)return json({error:'Please sign up or log in before promoting a Vibe.'},401);
      const plan=PLANS[clean(body.plan,30)];
      if(!plan)return json({error:'Choose a valid promotion package.'},400);
      const businessName=clean(body.businessName,100),title=clean(body.title,120),description=clean(body.description,900),category=clean(body.category,60)||'Other';
      const destinationUrl=validUrl(body.destinationUrl),requestedMedia=clean(body.mediaUrl,1200),reelId=clean(body.reelId,120);
      if(!businessName||!title)return json({error:'Business / creator name and promotion title are required.'},400);
      if(destinationUrl===null)return json({error:'Business link must be a secure https link.'},400);
      let mediaUrl='';
      if(reelId){
        const reel=await env.DB.prepare(`SELECT id,title,caption,video_url FROM reels WHERE id=? AND handle=? LIMIT 1`).bind(reelId,'@'+u.username).first();
        if(!reel)return json({error:'That Reel Vibe was not found on your account.'},404);
        mediaUrl=clean(reel.video_url,1200);
      }else if(requestedMedia){
        if(requestedMedia.startsWith('/api/media/'))mediaUrl=requestedMedia;
        else{const safe=validUrl(requestedMedia,{optional:false});if(!safe)return json({error:'Promotion media must be an uploaded file or secure https link.'},400);mediaUrl=safe;}
      }
      if(!mediaUrl)return json({error:'Add a promotional image/video or choose one of your Reel Vibes.'},400);

      const id='promo-'+crypto.randomUUID(),now=Date.now(),payUrl=paymentUrl(env,plan);
      await env.DB.prepare(`INSERT INTO vibe_promotions (id,user_id,author_name,author_handle,contact_email,business_name,title,description,category,destination_url,media_url,reel_id,plan_code,plan_label,amount_cents,duration_days,featured,payment_status,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','pending',?)`).bind(id,u.id,u.name,'@'+u.username,u.email,businessName,title,description,category,destinationUrl||'',mediaUrl,reelId,plan.code,plan.label,plan.amountCents,plan.durationDays,plan.featured?1:0,now).run();

      if(hubcoreEmailStatus(env).emailReady){
        context.waitUntil(notifyFounder(env,{id,businessName,authorName:u.name,authorHandle:'@'+u.username,contactEmail:u.email,title,description,category,destinationUrl:destinationUrl||'',mediaUrl,reelId},plan,payUrl).catch(error=>console.error('VibePromote email error',error)));
      }
      return json({ok:true,id,reference:id,plan:{code:plan.code,label:plan.label,amountCents:plan.amountCents},paymentUrl:payUrl||'',paymentConfigured:Boolean(payUrl),message:payUrl?'Submission saved. Complete payment, then HubCore will review your promotion.':'Submission saved. HubCore will contact you at your account email to arrange payment.'},201);
    }

    if(action==='view'||action==='click'){
      const id=clean(body.id,120);if(!id)return json({error:'Promotion required.'},400);
      const column=action==='view'?'views':'clicks';
      await env.DB.prepare(`UPDATE vibe_promotions SET ${column}=${column}+1 WHERE id=? AND status='approved' AND payment_status='paid'`).bind(id).run();
      return json({ok:true});
    }

    if(['mark_paid','mark_unpaid','approve','reject'].includes(action)){
      if(!await founder(request,env,body))return json({error:'Founder access required.'},401);
      const id=clean(body.id,120);if(!id)return json({error:'Promotion required.'},400);
      const current=await env.DB.prepare('SELECT * FROM vibe_promotions WHERE id=?').bind(id).first();if(!current)return json({error:'Promotion not found.'},404);
      if(action==='mark_paid')await env.DB.prepare(`UPDATE vibe_promotions SET payment_status='paid' WHERE id=?`).bind(id).run();
      if(action==='mark_unpaid')await env.DB.prepare(`UPDATE vibe_promotions SET payment_status='pending' WHERE id=?`).bind(id).run();
      if(action==='reject')await env.DB.prepare(`UPDATE vibe_promotions SET status='rejected' WHERE id=?`).bind(id).run();
      if(action==='approve'){
        if(current.payment_status!=='paid')return json({error:'Mark this promotion paid before approving it.'},400);
        const start=Date.now(),end=start+Number(current.duration_days||1)*86400000;
        await env.DB.prepare(`UPDATE vibe_promotions SET status='approved',approved_at=?,starts_at=?,ends_at=? WHERE id=?`).bind(start,start,end,id).run();
      }
      const updated=await env.DB.prepare('SELECT * FROM vibe_promotions WHERE id=?').bind(id).first();
      return json({ok:true,promotion:founderRow(updated)});
    }

    return json({error:'Unknown VibePromote action.'},400);
  }catch(error){console.error('VibePromote POST error',error);return json({error:'Unable to process VibePromote right now.'},500);}
}
