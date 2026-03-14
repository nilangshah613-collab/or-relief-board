/**
 * api/staff.js
 * Vercel serverless function — proxies GET /v2/staff to Qgenda.
 *
 * Called by the browser as: GET /api/staff?companyKey=...
 * Headers: Authorization: Bearer <token>
 */

const QGENDA_BASE = 'https://api.qgenda.com/v2';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const lockedKey = process.env.QGENDA_COMPANY_KEY;
  if (lockedKey && req.query.companyKey !== lockedKey) {
    return res.status(403).json({ error: 'companyKey not permitted' });
  }

  try {
    const qs = new URLSearchParams(req.query).toString();

    const upstream = await fetch(`${QGENDA_BASE}/staff?${qs}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type':  'application/json',
      },
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.Message ?? 'Staff fetch failed',
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[/api/staff]', err);
    return res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}
