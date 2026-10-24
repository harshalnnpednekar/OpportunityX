const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Core HTTP Request Wrapper
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
    const errorMsg = data?.error || (Array.isArray(data?.details) ? data.details.join(', ') : `HTTP error ${response.status}`);
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
  getMe: () => request('/auth/me'),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (profileData) => request('/profile', { method: 'PUT', body: profileData }),

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
  toggleRoadmapTask: (roadmapId, taskId) => request(`/roadmaps/${roadmapId}/tasks/${taskId}/toggle`, { method: 'PATCH' }),
  deleteRoadmap: (id) => request(`/roadmaps/${id}`, { method: 'DELETE' }),

  // Peer Matching
  getOpportunityPeers: (opportunityId) => request(`/peer-match/opportunity/${opportunityId}`),
  sendPeerRequest: (payload) => request('/peer-match/request', { method: 'POST', body: payload }),
  getMyPeerMatches: () => request('/peer-match/my-matches'),
  respondPeerRequest: (matchId, payload) => request(`/peer-match/request/${matchId}/respond`, { method: 'PATCH', body: payload }),

  // Admin Tools
  getAdminHealth: () => request('/admin/health'),
  triggerFeedIngest: (payload) => request('/admin/ingest', { method: 'POST', body: payload }),
  getAdminLogs: () => request('/admin/logs')
};

export default api;
