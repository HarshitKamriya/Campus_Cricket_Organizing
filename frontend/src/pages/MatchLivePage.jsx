import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';
import Scoreboard from '../components/Scoreboard';
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

  return (
    <div className="page container live-page">
      <div className="match-header">
        <h2>{match.title}</h2>
        <div className="venue-badge">📍 {match.venue}</div>
      </div>
      <div className="live-grid">
        <div className="main-col">
          <Scoreboard scoreboard={scoreboard} />
          <OverTicker balls={scoreboard.currentOverBalls || []} over={scoreboard.currentInnings?.totalOvers} />
          {scoreboard.currentInnings && (
            <>
              <BattingTable data={scoreboard.batting} />
              <BowlingTable data={scoreboard.bowling} />
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
