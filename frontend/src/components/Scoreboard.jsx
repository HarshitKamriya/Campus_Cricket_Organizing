import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Scoreboard.css';

export default function Scoreboard({ scoreboard }) {
  if (!scoreboard || !scoreboard.match) return null;
  
  const inningsList = scoreboard.innings || [];
  const currentInnings = inningsList.find(i => i.status === 'in_progress') || inningsList[inningsList.length - 1];
  
  if (!currentInnings) return <div className="glass-card scoreboard">Match Not Started</div>;

  const { totals, target, requiredRunRate, battingTeam, bowlingTeam } = currentInnings;
  const rr = currentInnings.runRate || '0.00';
  
  return (
    <div className="glass-card scoreboard">
      <div className="sb-header">
        <span className="sb-team">{battingTeam?.shortName || battingTeam?.name || 'Team A'} vs {bowlingTeam?.shortName || bowlingTeam?.name || 'Team B'}</span>
        <span className="badge badge-live">{scoreboard.match.status === 'completed' ? 'ENDED' : 'LIVE'}</span>
      </div>
      <div className="sb-main">
        <AnimatePresence mode="popLayout">
          <motion.div key={totals.runs + '-' + totals.wickets} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="sb-score">
            {totals.runs} <span className="sb-wickets">/ {totals.wickets}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="sb-stats">
        <div className="sb-stat"><span>Overs</span> <strong>{totals.oversDisplay}</strong></div>
        <div className="sb-stat"><span>RR</span> <strong>{rr}</strong></div>
        {target && (
          <>
            <div className="sb-stat"><span>Target</span> <strong>{target}</strong></div>
            <div className="sb-stat"><span>REQ</span> <strong>{requiredRunRate !== null ? requiredRunRate : 'N/A'}</strong></div>
          </>
        )}
      </div>
      {target && currentInnings.status === 'in_progress' && (
        <div className="sb-footer" style={{marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center'}}>
          Need {target - totals.runs} runs from {(scoreboard.match.totalOvers * 6) - (totals.overs * 6 + totals.balls)} balls
        </div>
      )}
    </div>
  );
}
