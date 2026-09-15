function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}})}
const clean=(v,n=300)=>String(v??'').trim().slice(0,n);
const enc=new TextEncoder();
const TERMS_VERSION='2026-09-15';
const PASSWORD_ITERATIONS=10000;
const NOTIFICATION_EMAIL='hubcore-vibes@outlook.com';
async function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function hashPassword(password,salt,iterations=PASSWORD_ITERATIONS){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:Number(iterations)||PASSWORD_ITERATIONS,hash:'SHA-256'},key,256))}
async function digest(v){return hex(await crypto.subtle.digest('SHA-256',enc.encode(v)))}
async function columns(db,table){const info=await db.prepare(`PRAGMA table_info(${table})`).all();return new Set((info.results||[]).map(row=>row.name))}
async function addColumn(db,table,column,definition){const cols=await columns(db,table);if(!cols.has(column))await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()}
async function ensure(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS hubcore_users (id TEXT PRIMARY KEY,created_at INTEGER NOT NULL DEFAULT 0,name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',username TEXT NOT NULL DEFAULT '',password_hash TEXT NOT NULL DEFAULT '',password_salt TEXT NOT NULL DEFAULT '',password_iterations INTEGER NOT NULL DEFAULT 10000,profile_photo TEXT NOT NULL DEFAULT '',terms_accepted_at INTEGER NOT NULL DEFAULT 0,terms_version TEXT NOT NULL DEFAULT '')`).run();
 await addColumn(db,'hubcore_users','created_at',`INTEGER NOT NULL DEFAULT 0`);
 await addColumn(db,'hubcore_users','name',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','email',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','username',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','password_hash',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','password_salt',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','password_iterations',`INTEGER NOT NULL DEFAULT 150000`);
 await addColumn(db,'hubcore_users','profile_photo',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_users','terms_accepted_at',`INTEGER NOT NULL DEFAULT 0`);
 await addColumn(db,'hubcore_users','terms_version',`TEXT NOT NULL DEFAULT ''`);
 await db.prepare(`CREATE TABLE IF NOT EXISTS hubcore_sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL DEFAULT 0)`).run();
 await addColumn(db,'hubcore_sessions','user_id',`TEXT NOT NULL DEFAULT ''`);
 await addColumn(db,'hubcore_sessions','expires_at',`INTEGER NOT NULL DEFAULT 0`);
 await addColumn(db,'hubcore_sessions','created_at',`INTEGER NOT NULL DEFAULT 0`);
 await db.prepare(`CREATE INDEX IF NOT EXISTS idx_hubcore_sessions_user ON hubcore_sessions(user_id,expires_at DESC)`).run();
}
function emailReady(env){return Boolean(env?.RESEND_API_KEY&&(env?.CONTACT_FROM_EMAIL||env?.INVESTOR_FROM_EMAIL))}
async function notify(env,u){const apiKey=env?.RESEND_API_KEY,from=env?.CONTACT_FROM_EMAIL||env?.INVESTOR_FROM_EMAIL;if(!apiKey||!from)return false;const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[NOTIFICATION_EMAIL],reply_to:u.email,subject:`NEW HUBCORE SIGNUP — @${u.username}`,text:`New HubCore Vibes member\n\nName: ${u.name}\nUsername: @${u.username}\nEmail: ${u.email}`})});if(!r.ok){console.error('HubCore signup notification failed',r.status,await r.text().catch(()=>''));return false}return true}
async function sessionUser(request,db){const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Bearer '))return null;const th=await digest(auth.slice(7));return db.prepare(`SELECT u.id,u.name,u.email,u.username,u.profile_photo,u.terms_accepted_at,u.terms_version FROM hubcore_sessions s JOIN hubcore_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(th,Date.now()).first()}
export async function onRequestGet({request,env}){if(!env?.DB)return json({error:'Account database unavailable.'},503);try{await ensure(env.DB);const u=await sessionUser(request,env.DB);return u?json({user:{id:u.id,name:u.name,email:u.email,username:u.username,profilePhoto:u.profile_photo||'',termsAcceptedAt:Number(u.terms_accepted_at||0),termsVersion:u.terms_version||''}}):json({error:'Please log in.'},401)}catch(e){console.error('HubCore account GET error',e);return json({error:'Unable to load account.'},500)}}
export async function onRequestPost(context){const {request,env}=context;if(!env?.DB)return json({error:'Account database unavailable.'},503);let stage='starting';try{stage='preparing database';await ensure(env.DB);stage='reading request';const b=await request.json(),action=clean(b.action,20);
 if(action==='signup'){
  stage='validating signup';
  const name=clean(b.name,80),email=clean(b.email,200).toLowerCase(),username=clean(b.username,40).replace(/^@+/,'').replace(/[^a-zA-Z0-9_.]/g,''),password=String(b.password||'');
  const accepted=b.acceptTerms===true||b.acceptTerms==='true'||b.acceptTerms==='on'||b.acceptTerms==='yes';
  if(!accepted)return json({error:'Please agree to the Terms of Use and Privacy Policy to create your account.'},400);
  if(!name||!email||username.length<3||password.length<8)return json({error:'Enter your name, valid email, username and a password of at least 8 characters.'},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Enter a valid email address.'},400);
  stage='checking account availability';const taken=await env.DB.prepare('SELECT id FROM hubcore_users WHERE lower(email)=? OR lower(username)=?').bind(email,username.toLowerCase()).first();if(taken)return json({error:'That email or username is already registered.'},409);
  stage='securing password';const id=crypto.randomUUID(),salt=crypto.randomUUID(),ph=await hashPassword(password,salt,PASSWORD_ITERATIONS),now=Date.now();
  stage='saving account';await env.DB.prepare(`INSERT INTO hubcore_users(id,created_at,name,email,username,password_hash,password_salt,password_iterations,profile_photo,terms_accepted_at,terms_version) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id,now,name,email,username,ph,salt,PASSWORD_ITERATIONS,'',now,TERMS_VERSION).run();
  stage='creating session';const token=crypto.randomUUID()+crypto.randomUUID(),th=await digest(token);await env.DB.prepare('INSERT INTO hubcore_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(th,id,now+2592000000,now).run();
  const notificationQueued=emailReady(env);if(notificationQueued)context.waitUntil(notify(env,{name,email,username}).catch(e=>console.error('HubCore signup notification error',e)));
  return json({ok:true,token,user:{id,name,email,username,profilePhoto:'',termsAcceptedAt:now,termsVersion:TERMS_VERSION},notificationQueued},201)
 }
 if(action==='login'){stage='finding account';const login=clean(b.login,200).replace(/^@/,'').toLowerCase(),password=String(b.password||''),u=await env.DB.prepare('SELECT * FROM hubcore_users WHERE lower(email)=? OR lower(username)=?').bind(login,login).first();if(!u||!u.password_salt||!u.password_hash)return json({error:'Incorrect email, username or password.'},401);stage='checking password';const iterations=Number(u.password_iterations||150000);if(await hashPassword(password,u.password_salt,iterations)!==u.password_hash)return json({error:'Incorrect email, username or password.'},401);stage='creating session';const token=crypto.randomUUID()+crypto.randomUUID(),th=await digest(token),now=Date.now();await env.DB.prepare('INSERT INTO hubcore_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(th,u.id,now+2592000000,now).run();return json({ok:true,token,user:{id:u.id,name:u.name,email:u.email,username:u.username,profilePhoto:u.profile_photo||'',termsAcceptedAt:Number(u.terms_accepted_at||0),termsVersion:u.terms_version||''}})}
 if(action==='logout'){const auth=request.headers.get('Authorization')||'';if(auth.startsWith('Bearer '))await env.DB.prepare('DELETE FROM hubcore_sessions WHERE token_hash=?').bind(await digest(auth.slice(7))).run();return json({ok:true})}
 return json({error:'Unknown account action.'},400)
}catch(e){console.error('HubCore account POST error at',stage,e);return json({error:`Unable to process account request while ${stage}. Please try again.`,code:'ACCOUNT_REQUEST_FAILED'},500)}}