import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

const MatchContext = createContext(null);

const initialState = {
  match: null,
  scoreboard: null,
  events: [],
  currentInnings: 1,
  loading: false,
  error: null,
};

function matchReducer(state, action) {
  switch (action.type) {
    case 'SET_MATCH':
      return {
        ...state,
        match: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_SCOREBOARD':
      return {
        ...state,
        scoreboard: action.payload,
        loading: false,
      };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [action.payload, ...state.events],
      };
    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'UNDO_EVENT':
      return {
        ...state,
        events: state.events.slice(1),
      };
    case 'SET_INNINGS':
      return {
        ...state,
        currentInnings: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(matchReducer, initialState);

  const fetchMatch = useCallback(async (matchId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.get(`/matches/${matchId}`);
      dispatch({ type: 'SET_MATCH', payload: res.data.data || res.data });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to fetch match',
      });
    }
  }, []);

  const fetchScoreboard = useCallback(async (matchId) => {
    try {
      const res = await api.get(`/matches/${matchId}/scoreboard`);
      dispatch({ type: 'SET_SCOREBOARD', payload: res.data.data || res.data });
    } catch (err) {
      console.error('Failed to fetch scoreboard:', err);
    }
  }, []);

  const fetchEvents = useCallback(async (matchId) => {
    try {
      const res = await api.get(`/matches/${matchId}/events`);
      dispatch({ type: 'SET_EVENTS', payload: res.data.data || res.data || [] });
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  const value = {
    ...state,
    dispatch,
    fetchMatch,
    fetchScoreboard,
    fetchEvents,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}

export default MatchContext;
