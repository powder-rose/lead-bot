import { API_URL } from '../constants/api.js';

export const SESSION_EXPIRED_EVENT = 'leadbot:session-expired';

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { ...options.headers, 'X-LeadBot-Request': '1' },
  });

  if (response.status === 401 && path !== '/api/session') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  return response;
};
