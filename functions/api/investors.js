function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function text(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS investor_enquiries (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      investor_type TEXT,
      investment_range TEXT,
      interest_area TEXT,
      message TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new'
    )
  `).run();
}

const NOTIFICATION_EMAIL = 'hubcore-vibes@outlook.com';

async function sendNotification(env, lead) {
  if (!env?.RESEND_API_KEY || !env?.INVESTOR_FROM_EMAIL) {
    return { sent: false, reason: 'notification_not_configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.INVESTOR_FROM_EMAIL,
      to: [NOTIFICATION_EMAIL],
      subject: `New HubCore Vibes investor enquiry — ${lead.name}`,
      text: [
        'A new investor enquiry was submitted on HubCore Vibes.',
        '',
        `Name: ${lead.name}`,
        `Company: ${lead.company || '-'}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone || '-'}`,
        `Country: ${lead.country || '-'}`,
        `Investor type: ${lead.investorType || '-'}`,
        `Investment range: ${lead.investmentRange || '-'}`,
        `Interest area: ${lead.interestArea || '-'}`,
        '',
        `Message: ${lead.message || '-'}`
      ].join('\n')
    })
  });

  if (!response.ok) throw new Error('Investor notification email failed');
  return { sent: true };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env?.DB) return json({ error: 'Database unavailable.' }, 503);

  try {
    await ensureTable(env.DB);
    const body = await request.json();
    const lead = {
      name: text(body.name, 120),
      company: text(body.company, 160),
      email: text(body.email, 200).toLowerCase(),
      phone: text(body.phone, 80),
      country: text(body.country, 120),
      investorType: text(body.investorType, 80),
      investmentRange: text(body.investmentRange, 80),
      interestArea: text(body.interestArea, 160),
      message: text(body.message, 1200),
      consent: Boolean(body.consent)
    };

    if (!lead.name || !lead.email || !lead.consent) {
      return json({ error: 'Name, email and consent are required.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    const id = crypto.randomUUID();
    const createdAt = Date.now();
    await env.DB.prepare(`
      INSERT INTO investor_enquiries
      (id, created_at, name, company, email, phone, country, investor_type, investment_range, interest_area, message, consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, createdAt, lead.name, lead.company || null, lead.email, lead.phone || null,
      lead.country || null, lead.investorType || null, lead.investmentRange || null,
      lead.interestArea || null, lead.message || null, lead.consent ? 1 : 0
    ).run();

    let notification = { sent: false };
    try { notification = await sendNotification(env, lead); } catch (error) { notification = { sent: false, reason: 'email_failed' }; }

    return json({ ok: true, id, notificationSent: Boolean(notification.sent) }, 201);
  } catch (error) {
    return json({ error: 'Unable to submit investor enquiry right now.' }, 500);
  }
}
