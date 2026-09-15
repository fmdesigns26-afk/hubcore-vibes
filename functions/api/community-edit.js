function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
function clean(value,max){return String(value??'').trim().slice(0,max);}
async function hash(value){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function ensureTable(db){await db.prepare(`CREATE TABLE IF NOT EXISTS community_post_edit_keys (post_id TEXT PRIMARY KEY, edit_key_hash TEXT NOT NULL, created_at INTEGER NOT NULL)`).run();}

export async function onRequestPost({request,env}){
  if(!env?.DB)return json({error:'Community database is unavailable.'},503);
  try{
    await ensureTable(env.DB);
    const body=await request.json();
    const action=clean(body.action,30),postId=clean(body.postId,120),editKey=clean(body.editKey,300);
    if(!postId||!editKey)return json({error:'Post editing information is missing.'},400);

    if(action==='register'){
      const post=await env.DB.prepare('SELECT id,timestamp FROM community_posts WHERE id=?').bind(postId).first();
      if(!post)return json({error:'Post not found.'},404);
      const age=Math.max(0,Date.now()-Number(post.timestamp||0));
      if(age>120000)return json({error:'This post can no longer be linked for editing.'},409);
      const existing=await env.DB.prepare('SELECT post_id FROM community_post_edit_keys WHERE post_id=?').bind(postId).first();
      if(existing)return json({ok:true,registered:true});
      await env.DB.prepare('INSERT INTO community_post_edit_keys (post_id,edit_key_hash,created_at) VALUES (?,?,?)').bind(postId,await hash(editKey),Date.now()).run();
      return json({ok:true,registered:true});
    }

    if(action==='edit'){
      const text=clean(body.text,50000);
      if(!text)return json({error:'Post text cannot be empty.'},400);
      const owner=await env.DB.prepare('SELECT edit_key_hash FROM community_post_edit_keys WHERE post_id=?').bind(postId).first();
      if(!owner)return json({error:'Editing is not enabled for this post.'},403);
      if((await hash(editKey))!==String(owner.edit_key_hash))return json({error:'You can only edit a post you created.'},403);
      const exists=await env.DB.prepare('SELECT id FROM community_posts WHERE id=?').bind(postId).first();
      if(!exists)return json({error:'Post not found.'},404);
      await env.DB.prepare('UPDATE community_posts SET text=? WHERE id=?').bind(text,postId).run();
      return json({ok:true,updated:true});
    }

    return json({error:'Unknown edit action.'},400);
  }catch(error){
    return json({error:'Unable to update this post right now.'},500);
  }
}
