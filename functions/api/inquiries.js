import { hubcoreEmailStatus, sendHubCoreEmail } from '../_lib/hubcore-email.js';

function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
const clean=(v,max)=>String(v??'').trim().slice(0,max);

async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS general_enquiries (id TEXT PRIMARY KEY,created_at INTEGER NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new')`).run();
}

async function notify(env,lead){
  return sendHubCoreEmail(env,{
    purpose:'contact',
    replyTo:lead.email,
    subject:`HubCore Vibes enquiry — ${lead.subject||lead.name}`,
    text:[
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `Subject: ${lead.subject||'-'}`,
      '',
      lead.message
    ].join('\n')
  });
}

export async function onRequestPost(context){
  const {request,env}=context;
  if(!env?.DB)return json({error:'Database unavailable.'},503);
  try{
    await ensure(env.DB);
    const b=await request.json();
    const lead={
      name:clean(b.name,120),
      email:clean(b.email,200).toLowerCase(),
      subject:clean(b.subject,160),
      message:clean(b.message,2000)
    };
    if(!lead.name||!lead.email||!lead.message)return json({error:'Name, email and message are required.'},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))return json({error:'Please enter a valid email address.'},400);

    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO general_enquiries (id,created_at,name,email,subject,message) VALUES (?,?,?,?,?,?)').bind(id,Date.now(),lead.name,lead.email,lead.subject||null,lead.message).run();

    const notificationQueued=hubcoreEmailStatus(env).emailReady;
    if(notificationQueued){
      context.waitUntil(notify(env,lead).catch(error=>console.error('General enquiry notification error',error)));
    }
    return json({ok:true,id,notificationQueued},201);
  }catch(error){
    console.error('General enquiry error',error);
    return json({error:'Unable to send your enquiry right now.'},500);
  }
}
