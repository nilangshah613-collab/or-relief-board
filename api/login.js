/**
 * api/login.js
 * Vercel serverless function — proxies POST /v2/login to Qgenda.
 *
 * Environment variables (set in Vercel dashboard → Settings → Environment Variables):
 *   QGENDA_COMPANY_KEY   your Qgenda company key (optional lock)
 *
 * Called by the browser as: POST /api/login
 * Body: { email, password }
 */

const QGENDA_BASE = 'https://api.qgenda.com/v2';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const body = new URLSearchParams({ email, password });

    const upstream = await fetch(`${QGENDA_BASE}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.Message ?? 'Authentication failed',
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[/api/login]', err);
    return res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}
