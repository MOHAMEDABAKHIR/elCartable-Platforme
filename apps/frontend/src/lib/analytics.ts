import { api } from './api';

const ANON_KEY = 'ec_anon_id';
const SESSION_KEY = 'ec_session_id';

export async function initAnalytics() {
  let anonId = localStorage.getItem(ANON_KEY);

  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, anonId);
  }

  if (localStorage.getItem(SESSION_KEY)) {
    return;
  }

  const session = await api.post('/analytics/session', {
    anonId,
    entryPage: window.location.pathname,
    userAgent: navigator.userAgent,
  });

  localStorage.setItem(SESSION_KEY, session.data.id);
}
export async function track(type: string, metadata?: unknown) {
  const sessionId = localStorage.getItem('ec_session_id');

  if (!sessionId) return;

  try {
    await api.post('/analytics/events', {
      sessionId,
      type,
      path: window.location.pathname,
      metadata,
    });
  } catch (err) {
    console.error(err);
  }
}