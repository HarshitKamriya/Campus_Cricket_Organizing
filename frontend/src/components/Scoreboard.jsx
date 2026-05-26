import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Scoreboard.css';

export default function Scoreboard({ scoreboard }) {
  const current = scoreboard.currentInnings || { totalRuns: 0, totalWickets: 0, totalOvers: 0, totalBalls: 0 };
  const ovs = current.totalOvers + '.' + current.totalBalls;
  const rr = current.totalOvers > 0 || current.totalBalls > 0 ? (current.totalRuns / (current.totalOvers + current.totalBalls/6)).toFixed(2) : '0.00';
  
  return (
    <div className="glass-card scoreboard">
      <div className="sb-header">
        <span className="sb-team">{scoreboard.match?.TeamA?.short_name} vs {scoreboard.match?.TeamB?.short_name}</span>
        <span className="badge badge-live">LIVE</span>
      </div>
      <div className="sb-main">
        <AnimatePresence mode="popLayout">
          <motion.div key={current.totalRuns + '-' + current.totalWickets} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="sb-score">
            {current.totalRuns} <span className="sb-wickets">/ {current.totalWickets}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="sb-stats">
        <div className="sb-stat"><span>Overs</span> <strong>{ovs}</strong></div>
        <div className="sb-stat"><span>RR</span> <strong>{rr}</strong></div>
        {current.target && <div className="sb-stat"><span>Target</span> <strong>{current.target}</strong></div>}
      </div>
    </div>
  );
}
