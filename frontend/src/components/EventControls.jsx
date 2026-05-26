import React, { useState } from 'react';
import '../styles/EventControls.css';

export default function EventControls({ onSubmit }) {
  const [runs, setRuns] = useState(0);
  
  const submitRun = (r) => onSubmit({ runs_scored: r, batsman_id: 1, bowler_id: 2, is_boundary_four: r === 4, is_boundary_six: r === 6 });
  const submitWicket = () => onSubmit({ is_wicket: true, runs_scored: 0, wicket_type: 'bowled', batsman_id: 1, bowler_id: 2 });
  const submitExtra = (type, r) => onSubmit({ extras_type: type, extras_runs: r, runs_scored: 0, batsman_id: 1, bowler_id: 2 });

  return (
    <div className="event-controls">
      <div className="runs-grid">
        {[0,1,2,3,4,6].map(r => (
          <button key={r} className={`btn btn-run ${r === 4 || r === 6 ? 'btn-boundary' : ''}`} onClick={() => submitRun(r)}>{r}</button>
        ))}
      </div>
      <div className="actions-grid">
        <button className="btn btn-danger" onClick={submitWicket}>WICKET</button>
        <button className="btn btn-ghost" onClick={() => submitExtra('wide', 1)}>WIDE</button>
        <button className="btn btn-ghost" onClick={() => submitExtra('no_ball', 1)}>NO BALL</button>
      </div>
    </div>
  );
}
