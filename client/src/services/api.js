const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Core HTTP Request Wrapper
 * Supports both httpOnly cookies (via credentials: 'include') and Bearer tokens.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('opportunityx_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    credentials: 'include', // Automatically include cookies for cross-site / same-origin requests
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Failed to parse JSON response from server' };
  }

  if (!response.ok) {
    // If session expired or unauthorized on protected route
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      localStorage.removeItem('opportunityx_token');
    }

    const errorMsg = data?.error || (Array.isArray(data?.details) ? data.details.map(d => d.message || d).join(', ') : `HTTP error ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (profileData) => request('/profile', { method: 'PATCH', body: profileData }),

  // Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/opportunities?${query.toString()}`);
  },
  getOpportunity: (id) => request(`/opportunities/${id}`),
  getEligibility: (id) => request(`/opportunities/${id}/eligibility`),
  saveOpportunityById: (id, data = {}) => request(`/opportunities/${id}/save`, { method: 'POST', body: data }),
  unsaveOpportunityById: (id) => request(`/opportunities/${id}/save`, { method: 'DELETE' }),
  createOpportunityRoadmap: (id) => request(`/opportunities/${id}/roadmap`, { method: 'POST' }),

  // Recommendations
  getRecommendations: (limit = 10) => request(`/recommendations?limit=${limit}`),

  // Saved Opportunities & Deadline Timeline
  getSaved: (status) => request(status ? `/saved?status=${status}` : '/saved'),
  getTimeline: () => request('/saved/timeline'),
  saveOpportunity: (data) => request('/saved', { method: 'POST', body: data }),
  updateSaved: (id, data) => request(`/saved/${id}`, { method: 'PUT', body: data }),
  removeSaved: (id) => request(`/saved/${id}`, { method: 'DELETE' }),

  // Roadmaps
  generateRoadmap: (opportunityId) => request('/roadmaps/generate', { method: 'POST', body: { opportunityId } }),
  getRoadmaps: () => request('/roadmaps'),
  getRoadmap: (id) => request(`/roadmaps/${id}`),
  toggleRoadmapTask: (roadmapId, taskId) => request(`/roadmaps/${roadmapId}/tasks/${taskId}`, { method: 'PATCH' }),
  deleteRoadmap: (id) => request(`/roadmaps/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  refreshReminders: () => request('/notifications/refresh-reminders', { method: 'POST' }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Peer Matching
  getPeerMatches: (opportunityId) => request(`/peers/matches?opportunityId=${opportunityId}`),
  sendPeerRequest: (payload) => request('/peers/requests', { method: 'POST', body: payload }),
  respondPeerRequest: (id, payload) => request(`/peers/requests/${id}`, { method: 'PATCH', body: payload }),
  getOpportunityPeers: (opportunityId) => request(`/peers/matches?opportunityId=${opportunityId}`),
  getMyPeerMatches: () => request('/peers/requests'),
  updatePeerConsent: (consent) => request('/peers/consent', { method: 'POST', body: { consent } }),
  withdrawPeerConsent: () => request('/peers/consent', { method: 'DELETE' }),

  // Admin Tools
  getAdminHealth: () => request('/admin/health'),
  importFeed: (feedId) => request('/admin/feeds/import', { method: 'POST', body: { feedId } }),
  getAdminImports: (page = 1, limit = 20) => request(`/admin/imports?page=${page}&limit=${limit}`),
  triggerFeedIngest: (payload) => request('/admin/ingest', { method: 'POST', body: payload }),
  getAdminLogs: () => request('/admin/logs')
};

export default api;
