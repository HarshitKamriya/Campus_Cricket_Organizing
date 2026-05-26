import api from './api';

export const getAllMatches = () => api.get('/matches');

export const getMatch = (id) => api.get(`/matches/${id}`);

export const createMatch = (data) => api.post('/matches', data);

export const updateMatch = (id, data) => api.put(`/matches/${id}`, data);

export const startMatch = (id) => api.post(`/matches/${id}/start`);

export const endInnings = (id) => api.post(`/matches/${id}/end-innings`);

export const endMatch = (id) => api.post(`/matches/${id}/end`);

export const deleteMatch = (id) => api.delete(`/matches/${id}`);

export default {
  getAllMatches,
  getMatch,
  createMatch,
  updateMatch,
  startMatch,
  endInnings,
  endMatch,
  deleteMatch,
};
