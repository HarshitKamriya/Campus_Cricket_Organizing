import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MatchCard.css';

export default function MatchCard({ match }) {
  const nav = useNavigate();
  return (
    <div className="glass-card match-card" onClick={() => nav('/match/' + match.id)}>
      <div className="mc-header">
        <span className={`badge badge-${match.status}`}>{match.status}</span>
        <span className="mc-venue">{match.venue}</span>
      </div>
      <h3 className="mc-teams">TEAM A vs TEAM B</h3>
      <p className="mc-title">{match.title}</p>
      <div className="mc-footer">
        <span>Overs: {match.total_overs}</span>
      </div>
    </div>
  );
}
