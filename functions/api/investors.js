import { hubcoreEmailStatus, sendHubCoreEmail } from '../_lib/hubcore-email.js';

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

async function sendNotification(env, lead) {
  return sendHubCoreEmail(env, {
    purpose: 'investor',
    replyTo: lead.email,
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
  });
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

    const notificationQueued = hubcoreEmailStatus(env).emailReady;
    if (notificationQueued) {
      context.waitUntil(sendNotification(env, lead).catch(error => console.error('Investor notification error', error)));
    }

    return json({ ok: true, id, notificationQueued }, 201);
  } catch (error) {
    console.error('Investor enquiry error', error);
    return json({ error: 'Unable to submit investor enquiry right now.' }, 500);
  }
}
