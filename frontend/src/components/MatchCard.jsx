import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MatchCard.css';

export default function MatchCard({ match, isAdmin, isScorer, onDelete }) {
  const nav = useNavigate();
  return (
    <div className="glass-card match-card" onClick={() => nav('/match/' + match.id)} style={{position: 'relative', cursor: 'pointer'}}>
      <div className="mc-header">
        <span className={`badge badge-${match.status}`}>{match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}</span>
        <span className="mc-venue">{match.venue}</span>
      </div>
      <h3 className="mc-teams">{match.TeamA?.name} <span style={{opacity: 0.6}}>vs</span> {match.TeamB?.name}</h3>
      <p className="mc-title">{match.title}</p>
      <div className="mc-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>Overs: {match.total_overs}</span>
        <div style={{display: 'flex', gap: '8px', zIndex: 10}}>
          {isScorer && (
            <button 
              className="btn btn-outline btn-sm" 
              onClick={(e) => { e.stopPropagation(); nav('/admin/match/' + match.id); }}
              title="Score Match"
              style={{padding: '4px 8px', fontSize: '0.8rem'}}
            >
              Score
            </button>
          )}
          {isAdmin && (
            <button 
              className="btn btn-danger btn-sm" 
              onClick={onDelete}
              title="Delete Match"
              style={{padding: '4px 8px', fontSize: '0.8rem'}}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
