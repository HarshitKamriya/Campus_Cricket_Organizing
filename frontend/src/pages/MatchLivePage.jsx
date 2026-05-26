import React, { useEffect } from 'react';
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
  const { match, scoreboard, fetchScoreboard, fetchMatch, dispatch } = useMatch();
  const { socket, joinMatch, leaveMatch } = useSocket();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
    joinMatch(id);

    return () => leaveMatch(id);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (newScoreboard) => dispatch({ type: 'SET_SCOREBOARD', payload: newScoreboard });
    const handleEvent = (event) => {
      if (event.is_wicket) toast.error('Wicket! ' + event.commentary, { icon: '🏏' });
      else if (event.is_boundary_six) toast.success('SIX! ' + event.commentary, { icon: '🔥' });
      else if (event.is_boundary_four) toast.success('FOUR! ' + event.commentary, { icon: '🎯' });
    };
    socket.on('match:update', handleUpdate);
    socket.on('event:new', handleEvent);
    return () => {
      socket.off('match:update', handleUpdate);
      socket.off('event:new', handleEvent);
    };
  }, [socket, dispatch]);

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
          <EventLog events={scoreboard.events} />
        </div>
      </div>
    </div>
  );
}
