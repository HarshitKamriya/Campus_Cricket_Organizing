import React from 'react';
import '../styles/OverTicker.css';

export default function OverTicker({ balls = [], over = 0 }) {
  return (
    <div className="glass-card over-ticker">
      <div className="ticker-label">Over {over}</div>
      <div className="ticker-balls">
        {balls.map((b, i) => (
          <div key={i} className={`ball ${b.toLowerCase()}`}>{b}</div>
        ))}
        {balls.length === 0 && <span className="ticker-empty">This over is empty</span>}
      </div>
    </div>
  );
}
