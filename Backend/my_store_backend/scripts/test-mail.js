import nodemailer from 'nodemailer';

const env = process.env;

const log = (...args) => console.log('[test-mail]', ...args);

const testSendGrid = async () => {
  const apiKey = String(env.SENDGRID_API_KEY || '').trim();
  const from = String(env.SENDGRID_FROM_EMAIL || env.EMAIL_USER || '').trim();
  const to = String(env.EMAIL_TEST_TO || env.EMAIL_USER || '').trim();
  if (!apiKey || !from) {
    log('SendGrid not configured (SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing)');
    return;
  }

  const html = '<p>SendGrid test message</p>';
  const text = 'SendGrid test message (plain)';

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: 'Test email from my_store_backend (SendGrid API)',
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    log('SendGrid status:', res.status);
    const body = await res.text();
    log('SendGrid response body:', body.slice(0, 200));
  } catch (err) {
    log('SendGrid request failed:', err?.message || err);
  }
};

const testSmtp = async () => {
  const host = String(env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(env.SMTP_PORT || 587);
  const secure = String(env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = String(env.EMAIL_USER || '').trim();
  const pass = String(env.EMAIL_PASS || '').replace(/\s+/g, '');
  const to = String(env.EMAIL_TEST_TO || env.EMAIL_USER || '').trim();

  if (!user || !pass) {
    log('SMTP credentials not configured (EMAIL_USER / EMAIL_PASS)');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    logger: true,
    debug: true,
  });

  try {
    log('Calling transporter.verify()... (this will test TCP + auth)');
    await transporter.verify();
    log('transporter.verify() succeeded — SMTP reachable and auth ok');

    const info = await transporter.sendMail({
      from: user,
      to,
      subject: 'Test email from my_store_backend (SMTP)',
      text: 'SMTP test message (plain)',
      html: '<p>SMTP test message</p>',
    });

    log('SMTP sendMail result:', info?.messageId || info);
  } catch (err) {
    log('SMTP test failed:', err?.code || err?.message || err);
  }
};

(async () => {
  log('Starting tests — SendGrid then SMTP');
  await testSendGrid();
  await testSmtp();
  log('Done');
  process.exit(0);
})();
