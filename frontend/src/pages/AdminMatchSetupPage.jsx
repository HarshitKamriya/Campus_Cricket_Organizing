import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import matchService from '../services/matchService';
import toast from 'react-hot-toast';
import '../styles/AdminMatchSetupPage.css';

const ROLES = [
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all-rounder', label: 'All-Rounder' },
  { value: 'batting-all-rounder', label: 'Batting AR' },
  { value: 'bowling-all-rounder', label: 'Bowling AR' },
  { value: 'wicket-keeper', label: 'WK' },
];

/** Creates an array of 11 empty player objects */
const createEmptySquad = () =>
  Array.from({ length: 11 }, () => ({ name: '', role: 'all-rounder' }));

export default function AdminMatchSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [matchInfo, setMatchInfo] = useState({
    title: 'Campus Premier League Match',
    venue: 'NIT Srinagar',
    total_overs: 20,
  });

  const [teamA, setTeamA] = useState({
    name: '',
    players: createEmptySquad(),
  });

  const [teamB, setTeamB] = useState({
    name: '',
    players: createEmptySquad(),
  });

  const [toss, setToss] = useState({
    winner: 'team_a', // 'team_a' or 'team_b'
    decision: 'bat',  // 'bat' or 'bowl'
  });

  /** Update a player's field in a team */
  const updatePlayer = (team, setTeam, index, field, value) => {
    setTeam(prev => {
      const players = [...prev.players];
      players[index] = { ...players[index], [field]: value };
      return { ...prev, players };
    });
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[`${team}_player_${index}`];
      return next;
    });
  };

  /** Validate all fields */
  const validate = () => {
    const errs = {};

    if (!matchInfo.title.trim()) errs.title = true;
    if (!teamA.name.trim()) errs.teamA_name = true;
    if (!teamB.name.trim()) errs.teamB_name = true;

    teamA.players.forEach((p, i) => {
      if (!p.name.trim()) errs[`a_player_${i}`] = true;
    });
    teamB.players.forEach((p, i) => {
      if (!p.name.trim()) errs[`b_player_${i}`] = true;
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Submit the match */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all player names');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: matchInfo.title,
        venue: matchInfo.venue,
        total_overs: matchInfo.total_overs,
        team_a: {
          name: teamA.name,
          players: teamA.players.map(p => ({
            name: p.name.trim(),
            role: p.role,
          })),
        },
        team_b: {
          name: teamB.name,
          players: teamB.players.map(p => ({
            name: p.name.trim(),
            role: p.role,
          })),
        },
        toss_winner: toss.winner,
        toss_decision: toss.decision,
      };

      const res = await matchService.createMatch(payload);
      const matchId = res.data.match?.id || res.data.id;
      
      // Auto-start
      await matchService.startMatch(matchId);
      toast.success('Match created & started!');
      navigate('/admin/match/' + matchId);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  /** Render a team panel with 11 player rows */
  const renderTeamPanel = (label, teamKey, team, setTeam) => (
    <div className={`team-panel ${teamKey === 'a' ? 'team-a' : 'team-b'}`}>
      <div className="team-panel-header">
        <span className="team-label">{label}</span>
        <div className="form-group">
          <input
            type="text"
            placeholder={`Enter ${label} name…`}
            value={team.name}
            onChange={e => {
              setTeam(prev => ({ ...prev, name: e.target.value }));
              setErrors(prev => { const n = { ...prev }; delete n[`${teamKey === 'a' ? 'teamA' : 'teamB'}_name`]; return n; });
            }}
            className={errors[`${teamKey === 'a' ? 'teamA' : 'teamB'}_name`] ? 'has-error' : ''}
            required
          />
        </div>
      </div>

      <div className="players-list-header">
        <span>#</span>
        <span>Player Name</span>
        <span>Role</span>
      </div>

      {team.players.map((player, i) => (
        <div className="player-row" key={i} style={{ animationDelay: `${i * 30}ms` }}>
          <span className="player-number">{i + 1}</span>
          <input
            type="text"
            placeholder={`Player ${i + 1}`}
            value={player.name}
            onChange={e => updatePlayer(teamKey, setTeam, i, 'name', e.target.value)}
            className={errors[`${teamKey}_player_${i}`] ? 'has-error' : ''}
          />
          <select
            value={player.role}
            onChange={e => updatePlayer(teamKey, setTeam, i, 'role', e.target.value)}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );

  const tossWinnerLabel = toss.winner === 'team_a'
    ? (teamA.name || 'Team A')
    : (teamB.name || 'Team B');

  return (
    <div className="page setup-page">
      {loading && (
        <div className="setup-loading">
          <div className="spinner" />
          <p>Creating match &amp; registering players…</p>
        </div>
      )}

      <div className="glass-card setup-card">
        <div className="setup-header">
          <h2>⚡ New Match Setup</h2>
          <p>Enter team details, playing 11 squads, and toss info</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Match Info */}
          <div className="match-info-row">
            <div className="form-group">
              <label>Match Title</label>
              <input
                type="text"
                value={matchInfo.title}
                onChange={e => setMatchInfo(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'has-error' : ''}
                required
              />
            </div>
            <div className="form-group">
              <label>Venue</label>
              <input
                type="text"
                value={matchInfo.venue}
                onChange={e => setMatchInfo(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Overs</label>
              <input
                type="number"
                min="1"
                max="50"
                value={matchInfo.total_overs}
                onChange={e => setMatchInfo(prev => ({ ...prev, total_overs: parseInt(e.target.value) || 20 }))}
                required
              />
            </div>
          </div>

          {/* Teams */}
          <div className="teams-grid">
            {renderTeamPanel('Team A', 'a', teamA, setTeamA)}
            <div className="vs-divider">
              <div className="vs-badge">VS</div>
            </div>
            {renderTeamPanel('Team B', 'b', teamB, setTeamB)}
          </div>

          {/* Toss */}
          <div className="toss-section">
            <h3 className="section-title">🪙 Toss Details</h3>
            <div className="toss-grid">
              <div className="toss-option-group">
                <label>Toss Won By</label>
                <div className="radio-group">
                  <label className={`radio-pill ${toss.winner === 'team_a' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tossWinner"
                      checked={toss.winner === 'team_a'}
                      onChange={() => setToss(prev => ({ ...prev, winner: 'team_a' }))}
                    />
                    {teamA.name || 'Team A'}
                  </label>
                  <label className={`radio-pill ${toss.winner === 'team_b' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tossWinner"
                      checked={toss.winner === 'team_b'}
                      onChange={() => setToss(prev => ({ ...prev, winner: 'team_b' }))}
                    />
                    {teamB.name || 'Team B'}
                  </label>
                </div>
              </div>
              <div className="toss-option-group">
                <label>{tossWinnerLabel} elected to</label>
                <div className="radio-group">
                  <label className={`radio-pill ${toss.decision === 'bat' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tossDecision"
                      checked={toss.decision === 'bat'}
                      onChange={() => setToss(prev => ({ ...prev, decision: 'bat' }))}
                    />
                    🏏 Bat
                  </label>
                  <label className={`radio-pill ${toss.decision === 'bowl' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tossDecision"
                      checked={toss.decision === 'bowl'}
                      onChange={() => setToss(prev => ({ ...prev, decision: 'bowl' }))}
                    />
                    🎾 Bowl
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="submit-area">
            <button type="submit" className="btn btn-accent btn-lg" disabled={loading}>
              {loading ? 'Creating…' : '🚀 Create & Start Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
