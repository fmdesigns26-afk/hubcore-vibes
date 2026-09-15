import { hubcoreEmailStatus } from '../_lib/hubcore-email.js';

function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}})}

export async function onRequestGet({env}){
  return json(hubcoreEmailStatus(env));
}
