import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import matchService from '../services/matchService';
import eventService from '../services/eventService';
import Scoreboard from '../components/Scoreboard';
import EventControls from '../components/EventControls';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';
import '../styles/AdminScorerPage.css';

export default function AdminScorerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { match, scoreboard, fetchMatch, fetchScoreboard } = useMatch();
  
  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
  }, [id]);

  const handleEventSubmit = async (eventData) => {
    try {
      await eventService.addBallEvent(id, eventData);
      fetchScoreboard(id);
      toast.success('Ball added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add event');
    }
  };

  const handleUndo = async () => {
    if (!window.confirm('Are you sure you want to undo the last ball?')) return;
    try {
      await eventService.undoLastEvent(id);
      fetchScoreboard(id);
      toast.success('Undone last ball');
    } catch (err) {
      toast.error('Failed to undo');
    }
  };

  if (!match || !scoreboard) return <div className="page container">Loading...</div>;

  return (
    <div className="page container scorer-page">
      <div className="scorer-header">
        <h2>Admin Panel - {match.title}</h2>
        <div className="scorer-actions">
          <button className="btn btn-ghost" onClick={handleUndo}>Undo Last Ball</button>
          <button className="btn btn-danger" onClick={() => matchService.endMatch(id).then(() => navigate('/'))}>End Match</button>
        </div>
      </div>
      
      <div className="scorer-grid">
        <div className="main-col">
          <Scoreboard scoreboard={scoreboard} />
          <div className="glass-card">
            <h3 className="section-title">Add Event</h3>
            <EventControls onSubmit={handleEventSubmit} />
          </div>
        </div>
        <div className="side-col">
          <EventLog events={scoreboard.events} />
        </div>
      </div>
    </div>
  );
}
