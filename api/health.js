/**
 * api/health.js
 * Simple liveness check — GET /api/health
 */
export default function handler(req, res) {
  res.status(200).json({ ok: true, service: 'or-relief-board', ts: new Date().toISOString() });
}
