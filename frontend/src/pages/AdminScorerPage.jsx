import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';
import matchService from '../services/matchService';
import eventService from '../services/eventService';
import Scoreboard from '../components/Scoreboard';
import OverTicker from '../components/OverTicker';
import BattingTable from '../components/BattingTable';
import BowlingTable from '../components/BowlingTable';
import EventControls from '../components/EventControls';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';
import '../styles/AdminScorerPage.css';

export default function AdminScorerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { match, scoreboard, events, fetchMatch, fetchScoreboard, fetchEvents, dispatch } = useMatch();
  const { socket, joinMatch, leaveMatch, connected } = useSocket();
  
  const [selectedPlayers, setSelectedPlayers] = useState({
    striker: '',
    nonStriker: '',
    bowler: ''
  });

  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
    fetchEvents(id);
  }, [id]);

  useEffect(() => {
    if (socket && connected) {
      joinMatch(id);
      return () => leaveMatch(id);
    }
  }, [socket, connected, id, joinMatch, leaveMatch]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (newScoreboard) => dispatch({ type: 'SET_SCOREBOARD', payload: newScoreboard });
    const handleEvent = (data) => {
      const eventInfo = data.event || data;
      const commentaryText = data.commentary || eventInfo.commentary;
      dispatch({ type: 'ADD_EVENT', payload: { ...eventInfo, commentary: commentaryText } });
    };
    socket.on('match:update', handleUpdate);
    socket.on('event:new', handleEvent);
    return () => {
      socket.off('match:update', handleUpdate);
      socket.off('event:new', handleEvent);
    };
  }, [socket, dispatch]);

  const handleEventSubmit = async (eventData) => {
    if (!selectedPlayers.striker || !selectedPlayers.bowler) {
      toast.error('Please select a Striker and a Bowler first!');
      return;
    }

    const payload = {
      ...eventData,
      batsman_id: selectedPlayers.striker,
      non_striker_id: selectedPlayers.nonStriker || null,
      bowler_id: selectedPlayers.bowler,
      dismissed_player_id: eventData.is_wicket 
        ? (eventData.dismissed_player_id || selectedPlayers.striker)
        : null
    };

    try {
      await eventService.addBallEvent(id, payload);
      fetchScoreboard(id);
      fetchEvents(id);
      toast.success('Ball added');
      
      if (payload.runs_scored === 1 || payload.runs_scored === 3) {
         setSelectedPlayers(prev => ({
           ...prev,
           striker: prev.nonStriker,
           nonStriker: prev.striker
         }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add event');
    }
  };

  const handleUndo = async () => {
    if (!window.confirm('Are you sure you want to undo the last ball?')) return;
    try {
      await eventService.undoLastEvent(id);
      fetchScoreboard(id);
      fetchEvents(id);
      toast.success('Undone last ball');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to undo');
    }
  };

  const handleEndInnings = async () => {
    if (!window.confirm('Are you sure you want to end the current innings?')) return;
    try {
      await matchService.endInnings(id);
      fetchScoreboard(id);
      fetchMatch(id);
      toast.success('Innings ended');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end innings');
    }
  };

  if (!match || !scoreboard) return <div className="page container">Loading...</div>;

  const currentInnings = scoreboard.innings?.find(i => i.status === 'in_progress');
  let battingPlayers = [];
  let bowlingPlayers = [];
  
  if (currentInnings && match.TeamA && match.TeamB) {
    const isTeamABatting = currentInnings.battingTeam.id === match.TeamA.id;
    battingPlayers = isTeamABatting ? match.TeamA.players || [] : match.TeamB.players || [];
    bowlingPlayers = isTeamABatting ? match.TeamB.players || [] : match.TeamA.players || [];
  }

  return (
    <div className="page container scorer-page">
      <div className="scorer-header">
        <h2>Admin Panel - {match.title}</h2>
        <div className="scorer-actions">
          <button className="btn btn-ghost" onClick={handleUndo}>Undo Last Ball</button>
          <button className="btn btn-ghost" onClick={handleEndInnings}>End Innings</button>
          <button className="btn btn-danger" onClick={() => matchService.endMatch(id).then(() => navigate('/'))}>End Match</button>
        </div>
      </div>
      
      <div className="scorer-grid">
        <div className="main-col">
          <Scoreboard scoreboard={scoreboard} />
          <OverTicker balls={currentInnings?.currentOverBalls || []} over={currentInnings?.totals?.overs} />
          {currentInnings ? (
            <>
              <BattingTable data={currentInnings.battingScorecard || []} />
              <BowlingTable data={currentInnings.bowlingScorecard || []} />
              <div className="glass-card" style={{marginTop: '20px'}}>
                <h3 className="section-title">Add Event</h3>
              <EventControls 
                onSubmit={handleEventSubmit} 
                players={{ batting: battingPlayers, bowling: bowlingPlayers }}
                selectedPlayers={selectedPlayers}
                onSelectPlayer={(role, val) => setSelectedPlayers(prev => ({...prev, [role]: val}))}
              />
              </div>
            </>
          ) : match.status === 'upcoming' ? (
             <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
               <h3 className="section-title" style={{ marginBottom: '1rem' }}>Match is Ready to Start</h3>
               <button className="btn btn-primary btn-lg" onClick={async () => {
                 try {
                   await matchService.startMatch(id);
                   fetchMatch(id);
                   fetchScoreboard(id);
                   toast.success('Match Started!');
                 } catch (err) {
                   toast.error('Failed to start match');
                 }
               }}>
                 START MATCH
               </button>
             </div>
          ) : (
             <div className="glass-card">
               <h3 className="section-title">Match Completed</h3>
               <p style={{opacity: 0.7, marginTop: '10px'}}>{match.result_summary || 'Match has ended.'}</p>
             </div>
          )}
        </div>
        <div className="side-col">
          <EventLog events={events || []} />
        </div>
      </div>
    </div>
  );
}
