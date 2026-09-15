const DESTINATION='hubcore-vibes@outlook.com';
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Content-Type':'application/json; charset=utf-8'}})}
export async function onRequestGet({env}){
  const resendConfigured=Boolean(env?.RESEND_API_KEY);
  const contactSenderConfigured=Boolean(env?.CONTACT_FROM_EMAIL);
  const investorSenderConfigured=Boolean(env?.INVESTOR_FROM_EMAIL);
  const emailReady=Boolean(resendConfigured&&(contactSenderConfigured||investorSenderConfigured));
  return json({
    destination:DESTINATION,
    resendConfigured,
    contactSenderConfigured,
    investorSenderConfigured,
    emailReady
  });
}
