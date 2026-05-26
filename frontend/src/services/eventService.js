import api from './api';

export const addBallEvent = (matchId, data) =>
  api.post(`/matches/${matchId}/events`, data);

export const getEvents = (matchId) =>
  api.get(`/matches/${matchId}/events`);

export const undoLastEvent = (matchId) =>
  api.post(`/matches/${matchId}/undo`);

export const getScoreboard = (matchId) =>
  api.get(`/matches/${matchId}/scoreboard`);

export const getMatchReport = (matchId) =>
  api.get(`/matches/${matchId}/report`);

export default {
  addBallEvent,
  getEvents,
  undoLastEvent,
  getScoreboard,
  getMatchReport,
};
