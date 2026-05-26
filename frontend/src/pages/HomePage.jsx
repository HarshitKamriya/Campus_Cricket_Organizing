import React, { useEffect, useState } from 'react';
import matchService from '../services/matchService';
import MatchCard from '../components/MatchCard';
import '../styles/HomePage.css';

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchService.getAllMatches().then(res => {
      setMatches(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const hasLive = matches.some(m => m.status === 'live');

  return (
    <div className="page homepage">
      <div className="hero">
        <h1>🏏 Campus Cricket</h1>
        <p className="subtitle">Live from NIT Srinagar</p>
        {hasLive && <div className="live-indicator"><span className="live-dot"></span> MATCH LIVE NOW</div>}
      </div>
      <div className="container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : matches.length === 0 ? (
          <p className="empty-state">No matches found. Create one from the admin panel.</p>
        ) : (
          <div className="match-grid">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
