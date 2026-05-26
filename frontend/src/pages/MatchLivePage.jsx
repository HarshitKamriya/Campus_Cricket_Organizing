import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Scoreboard from '../components/Scoreboard';
import LiveMatchInfo from '../components/LiveMatchInfo';
import OverTicker from '../components/OverTicker';
import BattingTable from '../components/BattingTable';
import BowlingTable from '../components/BowlingTable';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';
import '../styles/MatchLivePage.css';

export default function MatchLivePage() {
  const { id } = useParams();
  const { match, scoreboard, events, fetchScoreboard, fetchMatch, fetchEvents, dispatch } = useMatch();
  const { socket, joinMatch, leaveMatch, connected } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const hasJoinedRef = useRef(false);

  // Fetch initial data
  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
    fetchEvents(id);
  }, [id]);

  // Join the socket room — fires on mount and whenever connection state changes
  useEffect(() => {
    if (connected) {
      joinMatch(id);
      hasJoinedRef.current = true;
    }
    return () => {
      if (hasJoinedRef.current) {
        leaveMatch(id);
        hasJoinedRef.current = false;
      }
    };
  }, [connected, id, joinMatch, leaveMatch]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      // The eventController sends the full scoreboard object directly.
      // The matchController sends objects like { type: 'match_started', ... }
      // which are NOT scoreboard objects. In that case, re-fetch from server.
      if (data && data.innings && Array.isArray(data.innings)) {
        // This looks like a proper scoreboard — use it directly
        dispatch({ type: 'SET_SCOREBOARD', payload: data });
      } else {
        // Non-scoreboard update (match started/ended, innings ended, etc.)
        // Re-fetch everything from the API
        console.log('[MatchLive] Received non-scoreboard update, re-fetching:', data?.type || 'unknown');
        fetchMatch(id);
        fetchScoreboard(id);
        fetchEvents(id);
      }
    };

    const handleEvent = (data) => {
      const eventInfo = data.event || data;
      const commentaryText = data.commentary || eventInfo.commentary;

      if (eventInfo.is_wicket) toast.error('Wicket! ' + commentaryText, { icon: '🏏' });
      else if (eventInfo.is_boundary_six) toast.success('SIX! ' + commentaryText, { icon: '🔥' });
      else if (eventInfo.is_boundary_four) toast.success('FOUR! ' + commentaryText, { icon: '🎯' });

      dispatch({ type: 'ADD_EVENT', payload: { ...eventInfo, commentary: commentaryText } });
    };

    socket.on('match:update', handleUpdate);
    socket.on('event:new', handleEvent);

    return () => {
      socket.off('match:update', handleUpdate);
      socket.off('event:new', handleEvent);
    };
  }, [socket, dispatch, id, fetchMatch, fetchScoreboard, fetchEvents]);

  if (!match || !scoreboard) return <div className="page container"><div className="loading">Loading match...</div></div>;

  const currentInnings = scoreboard?.innings?.find(i => i.status === 'in_progress') || scoreboard?.innings?.[scoreboard.innings.length - 1];

  const isAdminOrScorer = isAuthenticated && (user.role === 'scorer' || user.role === 'admin');

  return (
    <div className="page container live-page">
      {/* Admin/Scorer banner — switch to scorer panel */}
      {isAdminOrScorer && (
        <div className="scorer-switch-banner">
          <span className="scorer-switch-text">⚠️ You are viewing the public read-only page.</span>
          <Link to={`/admin/match/${id}`} className="btn btn-primary btn-sm">Switch to Scorer Panel</Link>
        </div>
      )}

      {/* Spectator-only info banner for non-logged-in users */}
      {!isAuthenticated && (
        <div className="spectator-banner">
          <div className="spectator-banner-content">
            <span className="spectator-icon">👁️</span>
            <span className="spectator-text">Spectator Mode — View Only</span>
            {connected ? (
              <span className="live-dot connected" title="Live updates active">● Live</span>
            ) : (
              <span className="live-dot disconnected" title="Reconnecting...">● Connecting...</span>
            )}
          </div>
          <Link to="/admin/login" className="spectator-login-link">
            🔐 Admin Login
          </Link>
        </div>
      )}

      <div className="match-header">
        <h2>{match.title}</h2>
        <div className="venue-badge">📍 {match.venue}</div>
      </div>

      <div className="live-grid">
        <div className="main-col">
          {/* Rich spectator info panel — always visible */}
          <LiveMatchInfo scoreboard={scoreboard} match={match} />

          <Scoreboard scoreboard={scoreboard} />
          <OverTicker balls={currentInnings?.currentOverBalls || []} over={currentInnings?.totals?.overs} />
          {currentInnings && (
            <>
              <BattingTable data={currentInnings.battingScorecard || []} />
              <BowlingTable data={currentInnings.bowlingScorecard || []} />
            </>
          )}
        </div>
        <div className="side-col">
          <EventLog events={events || []} />
        </div>
      </div>
    </div>
  );
}
