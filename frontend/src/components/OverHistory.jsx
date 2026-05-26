import React, { useMemo } from 'react';
import '../styles/OverTicker.css';

export default function OverHistory({ events = [], currentInningsId, currentOver = 0 }) {
  const overHistory = useMemo(() => {
    if (!events || events.length === 0 || !currentInningsId) return [];

    const inningsEvents = events.filter(e => e.innings_id === currentInningsId);
    const oversMap = {};

    inningsEvents.forEach(ev => {
      const overNum = ev.over_number;
      if (!oversMap[overNum]) {
        oversMap[overNum] = { overNumber: overNum, balls: [], runs: 0 };
      }

      let ballStr = '0';
      if (ev.is_wicket) ballStr = 'W';
      else if (ev.extras_type === 'wide') ballStr = 'wd';
      else if (ev.extras_type === 'no_ball') ballStr = 'nb';
      else if (ev.extras_type === 'leg_bye') ballStr = 'lb';
      else if (ev.extras_type === 'bye') ballStr = 'b';
      else if (ev.is_boundary_six) ballStr = '6';
      else if (ev.is_boundary_four) ballStr = '4';
      else ballStr = ev.runs_scored.toString();

      oversMap[overNum].balls.push(ballStr);
      
      let ballRuns = ev.runs_scored || 0;
      if (ev.extras_type) ballRuns += (ev.extras_awarded || 1);
      
      oversMap[overNum].runs += ballRuns;
    });

    const history = Object.values(oversMap)
      .filter(o => o.overNumber < currentOver) // exclude the current over
      .sort((a, b) => b.overNumber - a.overNumber);
    
    return history.slice(0, 5); // show last 5 completed overs
  }, [events, currentInningsId, currentOver]);

  if (overHistory.length === 0) return null;

  return (
    <div className="glass-card over-ticker-history" style={{ marginTop: 'var(--space-md)' }}>
      <h3 className="section-title" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>Previous Overs</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {overHistory.map(over => (
          <div key={over.overNumber} className="over-ticker" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div className="ticker-label" style={{ width: '60px' }}>Ov {over.overNumber + 1}</div>
            <div className="ticker-balls" style={{ flex: 1, paddingBottom: 0 }}>
              {over.balls.map((b, i) => (
                <div key={i} className={`ball ${b.toLowerCase()}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>{b}</div>
              ))}
            </div>
            <div className="over-runs" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {over.runs} runs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
