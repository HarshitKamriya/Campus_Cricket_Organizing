import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import matchService from '../services/matchService';
import axios from 'axios';
import '../styles/AdminMatchSetupPage.css';

export default function AdminMatchSetupPage() {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    title: 'Campus Premier League Match',
    venue: 'NIT Srinagar',
    total_overs: 20,
    team_a_id: '',
    team_b_id: '',
    toss_winner_id: '',
    toss_decision: 'bat'
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/teams').then(res => setTeams(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await matchService.createMatch(formData);
      await matchService.startMatch(res.data.id);
      navigate('/admin/match/' + res.data.id);
    } catch (err) {
      alert('Failed to create match');
    }
  };

  return (
    <div className="page setup-page">
      <div className="glass-card setup-card">
        <h2 className="section-title">Setup New Match</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Team A</label>
            <select value={formData.team_a_id} onChange={e => setFormData({...formData, team_a_id: e.target.value})} required>
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Team B</label>
            <select value={formData.team_b_id} onChange={e => setFormData({...formData, team_b_id: e.target.value})} required>
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Overs</label>
            <input type="number" value={formData.total_overs} onChange={e => setFormData({...formData, total_overs: parseInt(e.target.value)})} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create & Start Match</button>
        </form>
      </div>
    </div>
  );
}
