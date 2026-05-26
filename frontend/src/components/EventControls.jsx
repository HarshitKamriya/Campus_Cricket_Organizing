import React, { useState } from 'react';
import '../styles/EventControls.css';

export default function EventControls({ onSubmit, players, selectedPlayers, onSelectPlayer }) {
  const [mode, setMode] = useState('default'); // 'default', 'wicket', 'extra'

  // Wicket State
  const [wicketType, setWicketType] = useState('bowled');
  const [dismissedPlayer, setDismissedPlayer] = useState('striker'); // 'striker' or 'nonStriker'
  const [wicketRunsCompleted, setWicketRunsCompleted] = useState(0); // for run outs

  // Extra State
  const [extraType, setExtraType] = useState('wide');
  const [extraRuns, setExtraRuns] = useState(1); // runs off the bat for no-ball, or boundary on wide
  const [isBoundary, setIsBoundary] = useState(false);

  // --- Handlers ---

  const handleNormalRun = (runs) => {
    onSubmit({
      runs_scored: runs,
      is_boundary_four: runs === 4,
      is_boundary_six: runs === 6,
      extras_type: 'none',
      extras_runs: 0,
      is_wicket: false
    });
  };

  const handleWicketSubmit = () => {
    onSubmit({
      is_wicket: true,
      wicket_type: wicketType,
      dismissed_player_id: dismissedPlayer === 'striker' ? selectedPlayers.striker : selectedPlayers.nonStriker,
      runs_scored: wicketRunsCompleted,
      is_boundary_four: false,
      is_boundary_six: false,
      extras_type: 'none',
      extras_runs: 0
    });
    setMode('default');
    setWicketRunsCompleted(0);
    setWicketType('bowled');
    setDismissedPlayer('striker');
  };

  const handleExtraSubmit = () => {
    let runsScored = 0;
    let actualExtraRuns = extraRuns;
    let isFour = false;
    let isSix = false;

    if (extraType === 'no_ball') {
      // For no-ball, the extra is always 1 run. Any additional runs are off the bat (or byes, but let's keep it simple as off bat)
      actualExtraRuns = 1;
      runsScored = extraRuns;
      if (isBoundary && runsScored === 4) isFour = true;
      if (isBoundary && runsScored === 6) isSix = true;
    }

    onSubmit({
      is_wicket: false,
      runs_scored: runsScored,
      is_boundary_four: isFour,
      is_boundary_six: isSix,
      extras_type: extraType,
      extras_runs: actualExtraRuns
    });
    setMode('default');
    setExtraRuns(1);
    setIsBoundary(false);
    setExtraType('wide');
  };

  // --- Renderers ---

  const renderPlayerSelects = () => (
    <div className="player-selections">
      <div className="form-group">
        <label>Striker</label>
        <select value={selectedPlayers.striker} onChange={(e) => onSelectPlayer('striker', parseInt(e.target.value) || '')}>
          <option value="">Select</option>
          {players.batting.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Non-Striker</label>
        <select value={selectedPlayers.nonStriker} onChange={(e) => onSelectPlayer('nonStriker', parseInt(e.target.value) || '')}>
          <option value="">Select</option>
          {players.batting.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Bowler</label>
        <select value={selectedPlayers.bowler} onChange={(e) => onSelectPlayer('bowler', parseInt(e.target.value) || '')}>
          <option value="">Select</option>
          {players.bowling.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );

  if (mode === 'wicket') {
    return (
      <div className="event-controls mode-panel">
        <h4 className="panel-title">Wicket Details</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Wicket Type</label>
            <select value={wicketType} onChange={e => setWicketType(e.target.value)}>
              <option value="bowled">Bowled</option>
              <option value="caught">Caught</option>
              <option value="lbw">LBW</option>
              <option value="run_out">Run Out</option>
              <option value="stumped">Stumped</option>
              <option value="hit_wicket">Hit Wicket</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="form-group">
            <label>Who is out?</label>
            <select value={dismissedPlayer} onChange={e => setDismissedPlayer(e.target.value)}>
              <option value="striker">Striker</option>
              <option value="nonStriker">Non-Striker</option>
            </select>
          </div>
          {wicketType === 'run_out' && (
            <div className="form-group">
              <label>Runs Completed</label>
              <input type="number" min="0" max="6" value={wicketRunsCompleted} onChange={e => setWicketRunsCompleted(parseInt(e.target.value) || 0)} />
            </div>
          )}
        </div>
        <div className="panel-actions">
          <button className="btn btn-ghost" onClick={() => setMode('default')}>Cancel</button>
          <button className="btn btn-danger" onClick={handleWicketSubmit}>Confirm Wicket</button>
        </div>
      </div>
    );
  }

  if (mode === 'extra') {
    return (
      <div className="event-controls mode-panel">
        <h4 className="panel-title">Extras Details</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={extraType} onChange={e => setExtraType(e.target.value)}>
              <option value="wide">Wide</option>
              <option value="no_ball">No Ball</option>
              <option value="bye">Bye</option>
              <option value="leg_bye">Leg Bye</option>
            </select>
          </div>
          <div className="form-group">
            <label>{extraType === 'no_ball' ? 'Runs off bat' : 'Total Extra Runs'}</label>
            <input type="number" min="1" max="7" value={extraRuns} onChange={e => setExtraRuns(parseInt(e.target.value) || 1)} />
          </div>
          {(extraRuns === 4 || extraRuns === 5 || extraRuns === 6) && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isBoundary} onChange={e => setIsBoundary(e.target.checked)} />
                Is Boundary?
              </label>
            </div>
          )}
        </div>
        <div className="panel-actions">
          <button className="btn btn-ghost" onClick={() => setMode('default')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleExtraSubmit}>Confirm Extra</button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-controls">
      {renderPlayerSelects()}
      
      <div className="runs-grid">
        {[0, 1, 2, 3, 4, 6].map(r => (
          <button key={r} className={`btn btn-run ${r === 4 || r === 6 ? 'btn-boundary' : ''}`} onClick={() => handleNormalRun(r)}>
            {r}
          </button>
        ))}
      </div>
      
      <div className="actions-grid">
        <button className="btn btn-danger" onClick={() => setMode('wicket')}>WICKET</button>
        <button className="btn btn-ghost" onClick={() => { setMode('extra'); setExtraType('wide'); }}>WIDE / NO BALL</button>
        <button className="btn btn-ghost" onClick={() => { setMode('extra'); setExtraType('bye'); }}>BYES</button>
      </div>
    </div>
  );
}
