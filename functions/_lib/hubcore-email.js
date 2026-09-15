export const HUBCORE_NOTIFICATION_EMAIL = 'hubcore-vibes@outlook.com';

function senderAddress(env, purpose = 'contact') {
  if (purpose === 'investor') {
    return env?.INVESTOR_FROM_EMAIL || env?.CONTACT_FROM_EMAIL || env?.CLOUDFLARE_EMAIL_FROM || 'investors@hubcorevibes.com';
  }
  return env?.CONTACT_FROM_EMAIL || env?.INVESTOR_FROM_EMAIL || env?.CLOUDFLARE_EMAIL_FROM || 'notifications@hubcorevibes.com';
}

export function hubcoreEmailStatus(env) {
  const cloudflareConfigured = Boolean(env?.CLOUDFLARE_EMAIL_API_TOKEN && env?.CLOUDFLARE_ACCOUNT_ID);
  const resendConfigured = Boolean(env?.RESEND_API_KEY);
  const contactSenderConfigured = Boolean(env?.CONTACT_FROM_EMAIL || env?.CLOUDFLARE_EMAIL_FROM || cloudflareConfigured);
  const investorSenderConfigured = Boolean(env?.INVESTOR_FROM_EMAIL || env?.CLOUDFLARE_EMAIL_FROM || cloudflareConfigured);
  return {
    destination: HUBCORE_NOTIFICATION_EMAIL,
    provider: cloudflareConfigured ? 'cloudflare' : resendConfigured ? 'resend' : 'none',
    cloudflareConfigured,
    resendConfigured,
    contactSenderConfigured,
    investorSenderConfigured,
    emailReady: Boolean(cloudflareConfigured || (resendConfigured && (contactSenderConfigured || investorSenderConfigured)))
  };
}

async function sendViaCloudflare(env, message) {
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env?.CLOUDFLARE_EMAIL_API_TOKEN;
  if (!accountId || !apiToken) return { sent: false, reason: 'cloudflare_not_configured' };

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/email/sending/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: HUBCORE_NOTIFICATION_EMAIL,
      from: message.from,
      reply_to: message.replyTo || undefined,
      subject: message.subject,
      text: message.text
    })
  });

  const body = await response.text().catch(() => '');
  if (!response.ok) {
    console.error('HubCore Cloudflare email failed', response.status, body);
    return { sent: false, reason: 'cloudflare_send_failed', status: response.status };
  }
  return { sent: true, provider: 'cloudflare' };
}

async function sendViaResend(env, message) {
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'resend_not_configured' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: message.from,
      to: [HUBCORE_NOTIFICATION_EMAIL],
      reply_to: message.replyTo || undefined,
      subject: message.subject,
      text: message.text
    })
  });

  const body = await response.text().catch(() => '');
  if (!response.ok) {
    console.error('HubCore Resend email failed', response.status, body);
    return { sent: false, reason: 'resend_send_failed', status: response.status };
  }
  return { sent: true, provider: 'resend' };
}

export async function sendHubCoreEmail(env, { purpose = 'contact', replyTo, subject, text }) {
  const message = {
    from: senderAddress(env, purpose),
    replyTo,
    subject,
    text
  };

  const status = hubcoreEmailStatus(env);
  if (status.cloudflareConfigured) {
    const result = await sendViaCloudflare(env, message);
    if (result.sent) return result;
  }
  if (status.resendConfigured) return sendViaResend(env, message);
  return { sent: false, reason: 'notification_not_configured' };
}
