function response(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}});}
function emptyState(reason='unavailable'){return {live:false,dataState:reason,membersOnlineNow:0,newMembersToday:0,postsToday:0,activeConversations:0,videosWatched:0,communityGrowth:0,trends:[],onlineUsers:[],notifications:[],metrics:{members:0,creators:0,posts:0,projects:0,events:0,games:0,messages:0},communityReach:{posts:0,comments:0,reactions:0,contributors:0,shares:0},activity:[]};}
async function ensure(db){await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS community_posts (id TEXT PRIMARY KEY,name TEXT NOT NULL,handle TEXT NOT NULL,avatar TEXT NOT NULL,timestamp INTEGER NOT NULL,text TEXT NOT NULL,reactions_json TEXT NOT NULL DEFAULT '{"like":0,"hub":0,"fire":0,"inspire":0}')`),
  db.prepare(`CREATE TABLE IF NOT EXISTS community_comments (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,author TEXT NOT NULL,text TEXT NOT NULL,timestamp INTEGER NOT NULL,reply_to TEXT)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS community_shares (id TEXT PRIMARY KEY,post_id TEXT NOT NULL,timestamp INTEGER NOT NULL,channel TEXT)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS early_access_signups (id TEXT PRIMARY KEY,created_at INTEGER NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,username TEXT NOT NULL,note TEXT,status TEXT NOT NULL DEFAULT 'pending')`)
]);}
export async function onRequest(context){
  const {env}=context;if(!env?.DB)return response(emptyState('database-not-connected'),503);
  try{
    await ensure(env.DB);
    await env.DB.prepare(`DELETE FROM community_comments WHERE id IN ('c-1','c-2') OR post_id IN ('seed-1','seed-2')`).run().catch(()=>{});
    await env.DB.prepare(`DELETE FROM community_shares WHERE post_id IN ('seed-1','seed-2')`).run().catch(()=>{});
    await env.DB.prepare(`DELETE FROM community_posts WHERE id IN ('seed-1','seed-2')`).run().catch(()=>{});
    const now=Date.now(),startOfDay=new Date();startOfDay.setHours(0,0,0,0);const start=startOfDay.getTime();
    const [postCount,commentCount,shareCount,postsToday,activeConversations,recentPosts,reactionRows,contributorRows,approvedMembers,newMembers]=await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_posts').first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_comments').first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_shares').first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_posts WHERE timestamp >= ?').bind(start).first(),
      env.DB.prepare('SELECT COUNT(DISTINCT post_id) AS count FROM community_comments').first(),
      env.DB.prepare('SELECT name,text,timestamp FROM community_posts ORDER BY timestamp DESC LIMIT 4').all(),
      env.DB.prepare('SELECT reactions_json FROM community_posts').all(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM (SELECT DISTINCT handle FROM community_posts WHERE handle IS NOT NULL AND handle != '')`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM early_access_signups WHERE status='approved'`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS count FROM early_access_signups WHERE status='approved' AND approved_at >= ?`).bind(start).first().catch(()=>({count:0}))
    ]);
    const posts=Number(postCount?.count||0),comments=Number(commentCount?.count||0),shares=Number(shareCount?.count||0),today=Number(postsToday?.count||0),conversations=Number(activeConversations?.count||0),contributors=Number(contributorRows?.count||0),members=Number(approvedMembers?.count||0);
    let reactions=0;for(const row of reactionRows.results||[]){try{const parsed=JSON.parse(row.reactions_json||'{}');reactions+=['like','hub','fire','inspire'].reduce((sum,key)=>sum+Number(parsed[key]||0),0);}catch{}}
    const activity=(recentPosts.results||[]).map(item=>{const mins=Math.max(0,Math.floor((now-Number(item.timestamp||now))/60000));const time=mins<1?'just now':mins<60?`${mins}m ago`:`${Math.floor(mins/60)}h ago`;return {label:`${item.name||'Someone'} shared a post`,time};});
    return response({live:true,dataState:'connected',membersOnlineNow:0,newMembersToday:Number(newMembers?.count||0),postsToday:today,activeConversations:conversations,videosWatched:0,communityGrowth:0,trends:[{name:'Community posts',delta:`${posts} total`},{name:'Comments',delta:`${comments} total`},{name:'Reactions',delta:`${reactions} total`},{name:'Shares',delta:`${shares} total`}],onlineUsers:[],notifications:[],metrics:{members,creators:contributors,posts,projects:0,events:0,games:0,messages:comments},communityReach:{posts,comments,reactions,contributors,shares},activity,serverTime:now});
  }catch(error){return response(emptyState('query-failed'),500);}
}
