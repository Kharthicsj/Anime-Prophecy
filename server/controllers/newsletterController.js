import Newsletter from '../models/Newsletter.js';
import { asyncHandler } from '../utils/errorHandler.js';
import nodemailer from 'nodemailer';

// ─── Brevo SMTP transporter ───────────────────────────────────────────────────
// Using Brevo (formerly Sendinblue) free tier via SMTP relay.
// Swap to Brevo's Transactional Email API (v3) when upgrading to paid.
const createBrevoTransport = () => {
    // If running in production (e.g. AWS/DigitalOcean) and port 587 is blocked,
    // explicitly try 2525 or 465 instead via environment variable.
    const port = parseInt(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN || process.env.BREVO_SMTP_USER,
            pass: process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY,
        },
        pool: true,             // Use pooled connections instead of creating a new one for every message
        maxConnections: 5,      // Limit simultaneous connections to Brevo
        maxMessages: 100,       // Max messages per connection
        connectionTimeout: 10000, // 10s timeout (fail fast instead of hanging 120s)
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            // Do not fail on invalid certs in production sometimes needed for certain hostings
            rejectUnauthorized: false
        }
    });
};

// ─── HTML email template ──────────────────────────────────────────────────────
const buildNewsletterHTML = ({ subject, content, products, siteUrl = 'https://prophecyhub.com' }) => {
    const productCards = products
        .map(
            (p) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #27272a;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="80" style="vertical-align:top;">
                ${p.imageUrl ? `<img src="${p.imageUrl}" width="72" height="72" style="border-radius:8px;object-fit:cover;display:block;" alt="${p.title}" />` : ''}
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;">${p.title}</p>
                <p style="margin:0 0 4px;font-size:12px;color:#a855f7;">${p.category}${p.subCategory ? ` · ${p.subCategory}` : ''}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#c084fc;font-weight:600;">${p.currency} ${p.price}</p>
                <a href="${siteUrl}/product/${p.id}" style="display:inline-block;padding:5px 14px;background:#7c3aed;color:#fff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">Shop Now ↗</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
        )
        .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4c1d95,#1e1b4b);padding:32px 32px 24px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">⚡ Prophecy Hub</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#c4b5fd;letter-spacing:0.1em;text-transform:uppercase;">Anime Merchandise Newsletter</p>
        </td></tr>
        <!-- Subject line -->
        <tr><td style="padding:24px 32px 8px;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#fff;">${subject}</h2>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:8px 32px 24px;">
          <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.7;">${content.replace(/\n/g, '<br>')}</p>
        </td></tr>
        ${products.length > 0 ? `
        <!-- Products -->
        <tr><td style="padding:0 32px;">
          <div style="height:1px;background:#27272a;margin-bottom:20px;"></div>
          <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#a855f7;text-transform:uppercase;letter-spacing:0.08em;">🛍 Featured Products</h3>
          <table width="100%" cellpadding="0" cellspacing="0">${productCards}</table>
        </td></tr>` : ''}
        <!-- Footer -->
        <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #27272a;margin-top:8px;">
          <p style="margin:0 0 8px;font-size:13px;color:#52525b;">You are receiving this because you subscribed to Prophecy Hub.</p>
          <p style="margin:0;font-size:12px;color:#3f3f46;">
            <a href="${siteUrl}" style="color:#7c3aed;text-decoration:none;">Visit Prophecy Hub</a>
            &nbsp;·&nbsp;
            <span style="color:#3f3f46;">© ${new Date().getFullYear()} Prophecy Hub</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ─── Subscribe ────────────────────────────────────────────────────────────────
export const subscribe = asyncHandler(async (req, res) => {
    const { email, country, source } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existing = await Newsletter.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        if (!existing.isActive) {
            existing.isActive = true;
            if (country) existing.country = country.trim();
            await existing.save();
            return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
        }
        return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }

    const subscriber = await Newsletter.create({
        email,
        country: country ? country.trim() : '',
        source: source || 'landing',
    });
    res.status(201).json({
        success: true,
        message: 'Successfully subscribed to Prophecy Hub newsletter!',
        data: { email: subscriber.email, country: subscriber.country, subscribedAt: subscriber.createdAt },
    });
});

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
export const unsubscribe = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const subscriber = await Newsletter.findOne({ email: email?.toLowerCase().trim() });
    if (!subscriber) return res.status(404).json({ success: false, message: 'Email not found' });

    subscriber.isActive = false;
    await subscriber.save();
    res.json({ success: true, message: 'Unsubscribed successfully.' });
});

// ─── Get all subscribers (admin only) ────────────────────────────────────────
const COUNTRY_ALIASES = {
    Worldwide: null,
    All: null,
    US: ['US', 'United States'],
    Japan: ['Japan', 'JP'],
    India: ['India', 'IN'],
    UK: ['UK', 'United Kingdom', 'GB'],
    'South Korea': ['South Korea', 'KR', 'Korea'],
};

export const getSubscribers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { country } = req.query;

    const filter = { isActive: true };

    if (country && country !== 'Worldwide' && country !== 'All') {
        const aliases = COUNTRY_ALIASES[country] || [country];
        const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = aliases.map((c) => ({
            country: { $regex: new RegExp(`^${escape(c)}$`, 'i') },
        }));
    }

    const [subscribers, total, uniqueCountries] = await Promise.all([
        Newsletter.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('email country source createdAt'),
        Newsletter.countDocuments(filter),
        Newsletter.distinct('country', { isActive: true }),
    ]);

    res.json({
        success: true,
        data: {
            subscribers,
            uniqueCountries: uniqueCountries.filter(Boolean),
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        },
    });
});

// ─── Broadcast newsletter (admin only) ───────────────────────────────────────
export const broadcastNewsletter = asyncHandler(async (req, res) => {
    const {
        subject,
        content,
        products = [],
        country,       // optional target country
        recipientMode, // 'first300', 'custom', 'selected'
        customCount,   // number (for custom mode)
        selectedEmails,// array of emails (for selected mode)
        siteUrl,       // frontend URL for product linking
    } = req.body;

    if (!subject?.trim() || !content?.trim()) {
        return res.status(400).json({ success: false, message: 'Subject and content are required' });
    }

    // Build subscriber query
    const filter = { isActive: true };
    if (country && country !== 'Worldwide' && country !== 'All') {
        const aliases = COUNTRY_ALIASES[country] || [country];
        const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = aliases.map((c) => ({
            country: { $regex: new RegExp(`^${escape(c)}$`, 'i') },
        }));
    }

    let emailList = [];

    if (recipientMode === 'selected' && Array.isArray(selectedEmails) && selectedEmails.length > 0) {
        // Use specifically selected email addresses
        emailList = selectedEmails;
    } else {
        // Fetch from DB based on mode
        let dbLimit = 300;
        let dbSkip = 0;
        if (recipientMode === 'custom' && customCount) {
            dbLimit = Math.min(parseInt(customCount) || 300, 10000);
        } else if (recipientMode === 'next300') {
            dbSkip = 300;
        }
        const subs = await Newsletter.find(filter)
            .sort({ createdAt: -1 })
            .skip(dbSkip)
            .limit(dbLimit)
            .select('email')
            .lean();
        emailList = subs.map((s) => s.email);
    }

    if (emailList.length === 0) {
        return res.status(400).json({ success: false, message: 'No recipients found for the selected criteria' });
    }

    const transporter = createBrevoTransport();
    const html = buildNewsletterHTML({ subject, content, products, siteUrl });

    // Send in batches of 50 to respect free-tier rate limits
    const BATCH_SIZE = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emailList.length; i += BATCH_SIZE) {
        const batch = emailList.slice(i, i + BATCH_SIZE);
        try {
            const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@prophecyhub.com';
            await transporter.sendMail({
                from: `"Prophecy Hub" <${senderEmail}>`,
                to: senderEmail, // Must have a 'to' address for BCC to work reliably across all email providers
                bcc: batch.join(','),  // use BCC for privacy
                subject,
                html,
            });
            sent += batch.length;
        } catch (err) {
            console.error(`Newsletter batch ${i / BATCH_SIZE + 1} failed:`, err.message);
            failed += batch.length;
        }
        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < emailList.length) {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    res.json({
        success: true,
        message: `Newsletter sent! ${sent} delivered, ${failed} failed.`,
        data: { sent, failed, total: emailList.length },
    });
});
