/**
 * public/qgenda-api.js
 * Qgenda API integration — Vercel edition.
 *
 * Calls /api/login, /api/schedule, /api/staff (Vercel serverless functions)
 * instead of a local proxy. No other changes from the local version.
 */

// Relative path: works on any domain Vercel assigns
const PROXY_BASE = '/api';

// ── Token cache (in-memory for the browser session) ──
let _tokenCache = { access_token: null, expires_at: 0 };

async function authenticate(email, password) {
  if (_tokenCache.access_token && Date.now() < _tokenCache.expires_at - 60_000) {
    return _tokenCache.access_token;
  }

  const res = await fetch(`${PROXY_BASE}/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Auth failed (${res.status})`);
  }

  const data = await res.json();
  _tokenCache = {
    access_token: data.access_token,
    expires_at:   Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return _tokenCache.access_token;
}

async function fetchSchedule(token, companyKey, tags = '', date = null) {
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const params = new URLSearchParams({
    companyKey,
    startDate:  targetDate,
    endDate:    targetDate,
    '$select': [
      'StaffFName','StaffLName','StaffEmail','StaffTags',
      'TaskName','TaskAbbreviation','TaskTags',
      'StartDate','StartTime','EndTime',
    ].join(','),
  });

  if (tags) {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagList.length) {
      params.set('$filter', tagList.map(t => `substringof('${t}',TaskTags)`).join(' or '));
    }
  }

  const res = await fetch(`${PROXY_BASE}/schedule?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Schedule fetch failed (${res.status})`);
  }
  return res.json();
}

function inferRole(tagsLower) {
  if (/attending|physician|md|do/.test(tagsLower)) return 'ATT';
  if (/crna|nurse anesthetist/.test(tagsLower))    return 'CRNA';
  if (/resident|fellow|pgy/.test(tagsLower))       return 'RES';
  return 'ATT';
}

function inferSpecialty(tagsLower) {
  const list = ['cardiac','cardiothoracic','peds','pediatric','neuro','neuroanesthesia',
                'obstetric','ob','regional','pain','trauma','general'];
  for (const s of list) {
    if (tagsLower.includes(s)) return s[0].toUpperCase() + s.slice(1);
  }
  return '';
}

function inferRoomStatus(entry) {
  const now   = new Date();
  const end   = entry.EndTime   ? new Date(`${entry.StartDate}T${entry.EndTime}`)   : null;
  const start = entry.StartTime ? new Date(`${entry.StartDate}T${entry.StartTime}`) : null;
  if (end   && now > end)   return 'done';
  if (start && now < start) return 'turnover';
  return 'active';
}

function mapToStaff(entries) {
  const seen = new Set();
  return entries.reduce((acc, e) => {
    const id = e.StaffEmail ?? `${e.StaffFName}_${e.StaffLName}`;
    if (seen.has(id)) return acc;
    seen.add(id);
    const tags = (e.StaffTags ?? '').toLowerCase();
    acc.push({ id, name: `${e.StaffFName} ${e.StaffLName}`.trim(),
               role: inferRole(tags), specialty: inferSpecialty(tags) });
    return acc;
  }, []);
}

function mapToRooms(entries) {
  const seen = new Set();
  return entries.reduce((acc, e) => {
    const id = e.TaskAbbreviation ?? e.TaskName;
    if (seen.has(id)) return acc;
    seen.add(id);
    acc.push({ id, name: e.TaskAbbreviation ?? e.TaskName,
               status: inferRoomStatus(e), case: e.TaskName });
    return acc;
  }, []);
}

export async function syncFromQgenda(cfg) {
  const token   = await authenticate(cfg.username, cfg.password);
  const entries = await fetchSchedule(token, cfg.companyKey, cfg.tags);
  return { staff: mapToStaff(entries), rooms: mapToRooms(entries) };
}

export async function testQgendaConnection({ username, password }) {
  try {
    await authenticate(username, password);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
