import React, { useEffect, useState } from 'react';
import matchService from '../services/matchService';
import MatchCard from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles/HomePage.css';

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const loadMatches = () => {
    matchService.getAllMatches().then(res => {
      setMatches(res.data.matches || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('Are you sure you want to completely delete this match?')) return;
    
    try {
      await matchService.deleteMatch(id);
      toast.success('Match deleted successfully');
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      toast.error('Failed to delete match');
    }
  };

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
              <MatchCard 
                key={match.id} 
                match={match} 
                isAdmin={isAuthenticated && user?.role === 'admin'} 
                isScorer={isAuthenticated && (user?.role === 'admin' || user?.role === 'scorer')}
                onDelete={(e) => handleDelete(match.id, e)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
