import React from 'react';
import { motion } from 'framer-motion';
import '../styles/LiveMatchInfo.css';

/**
 * LiveMatchInfo – A premium read-only panel showing real-time match info
 * for spectators (non-logged-in users).
 *
 * Shows: Who is batting (striker / non-striker), who is bowling,
 *        current score, overs, run rate, target, required run rate.
 */
export default function LiveMatchInfo({ scoreboard, match }) {
  if (!scoreboard || !scoreboard.innings || scoreboard.innings.length === 0) return null;

  const currentInnings =
    scoreboard.innings.find((i) => i.status === 'in_progress') ||
    scoreboard.innings[scoreboard.innings.length - 1];

  if (!currentInnings) return null;

  const { totals, target, requiredRunRate, battingTeam, bowlingTeam, battingScorecard, bowlingScorecard } = currentInnings;
  const runRate = currentInnings.runRate || '0.00';

  // Find active batsmen (not out) from the scorecard
  const activeBatsmen = (battingScorecard || []).filter((b) => !b.isOut);

  // The last 2 active batsmen are striker and non-striker  
  // We'll show them based on order — first is usually striker
  const striker = activeBatsmen.length > 0 ? activeBatsmen[0] : null;
  const nonStriker = activeBatsmen.length > 1 ? activeBatsmen[1] : null;

  // Current bowler — the last one in bowling scorecard (currently bowling)
  const activeBowlers = (bowlingScorecard || []).filter((b) => b.overs > 0 || b.oversBalls > 0);
  const currentBowler = activeBowlers.length > 0 ? activeBowlers[activeBowlers.length - 1] : null;

  const inningsNumber = currentInnings.inningsNumber || 1;
  const isChasing = inningsNumber === 2 && target;

  return (
    <motion.div
      className="live-match-info glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Match Status Header */}
      <div className="lmi-status-bar">
        <div className="lmi-teams">
          <span className="lmi-team-batting">{battingTeam?.name || 'Batting Team'}</span>
          <span className="lmi-vs">vs</span>
          <span className="lmi-team-bowling">{bowlingTeam?.name || 'Bowling Team'}</span>
        </div>
        <div className="lmi-innings-badge">
          {currentInnings.status === 'in_progress' ? (
            <span className="lmi-live-pulse">● LIVE</span>
          ) : (
            <span className="lmi-ended">ENDED</span>
          )}
          <span className="lmi-innings-num">
            {inningsNumber === 1 ? '1st' : '2nd'} Innings
          </span>
        </div>
      </div>

      {/* Score Display */}
      <div className="lmi-score-section">
        <div className="lmi-score-big">
          <motion.span
            key={totals.runs}
            initial={{ scale: 1.3, color: '#00e5ff' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.4 }}
            className="lmi-runs"
          >
            {totals.runs}
          </motion.span>
          <span className="lmi-separator">/</span>
          <span className="lmi-wickets">{totals.wickets}</span>
        </div>
        <div className="lmi-overs-display">({totals.oversDisplay} ov)</div>
      </div>

      {/* Stats Grid */}
      <div className="lmi-stats-grid">
        <div className="lmi-stat-item">
          <span className="lmi-stat-label">Run Rate</span>
          <span className="lmi-stat-value">{runRate}</span>
        </div>
        <div className="lmi-stat-item">
          <span className="lmi-stat-label">Balls</span>
          <span className="lmi-stat-value">{totals.overs * 6 + (totals.balls || 0)}</span>
        </div>
        {isChasing && (
          <>
            <div className="lmi-stat-item lmi-stat-target">
              <span className="lmi-stat-label">Target</span>
              <span className="lmi-stat-value">{target}</span>
            </div>
            <div className="lmi-stat-item lmi-stat-rrr">
              <span className="lmi-stat-label">Req. RR</span>
              <span className="lmi-stat-value highlight-rrr">
                {requiredRunRate !== null && requiredRunRate !== undefined ? requiredRunRate : 'N/A'}
              </span>
            </div>
          </>
        )}
        {isChasing && currentInnings.status === 'in_progress' && (
          <div className="lmi-stat-item lmi-stat-need lmi-stat-wide">
            <span className="lmi-stat-label">Need</span>
            <span className="lmi-stat-value">
              {target - totals.runs} runs from{' '}
              {(match.total_overs || match.totalOvers || 20) * 6 - (totals.overs * 6 + (totals.balls || 0))} balls
            </span>
          </div>
        )}
      </div>

      {/* At the Crease — Batsmen & Bowler */}
      <div className="lmi-crease-section">
        <h4 className="lmi-section-heading">
          <span className="lmi-heading-icon">🏏</span> At The Crease
        </h4>
        <div className="lmi-players-grid">
          {/* Striker */}
          <div className="lmi-player-card lmi-striker">
            <div className="lmi-player-role">
              <span className="lmi-role-dot striker-dot"></span>
              Striker
            </div>
            {striker ? (
              <div className="lmi-player-details">
                <span className="lmi-player-name">{striker.playerName}</span>
                <span className="lmi-player-stats">
                  {striker.runs}<small>({striker.ballsFaced}b)</small>
                  {striker.fours > 0 && <span className="lmi-mini-stat"> • {striker.fours}×4</span>}
                  {striker.sixes > 0 && <span className="lmi-mini-stat"> • {striker.sixes}×6</span>}
                </span>
                <span className="lmi-player-sr">SR: {striker.strikeRate}</span>
              </div>
            ) : (
              <div className="lmi-player-details lmi-pending">—</div>
            )}
          </div>

          {/* Non-Striker */}
          <div className="lmi-player-card lmi-non-striker">
            <div className="lmi-player-role">
              <span className="lmi-role-dot non-striker-dot"></span>
              Non-Striker
            </div>
            {nonStriker ? (
              <div className="lmi-player-details">
                <span className="lmi-player-name">{nonStriker.playerName}</span>
                <span className="lmi-player-stats">
                  {nonStriker.runs}<small>({nonStriker.ballsFaced}b)</small>
                  {nonStriker.fours > 0 && <span className="lmi-mini-stat"> • {nonStriker.fours}×4</span>}
                  {nonStriker.sixes > 0 && <span className="lmi-mini-stat"> • {nonStriker.sixes}×6</span>}
                </span>
                <span className="lmi-player-sr">SR: {nonStriker.strikeRate}</span>
              </div>
            ) : (
              <div className="lmi-player-details lmi-pending">—</div>
            )}
          </div>
        </div>
      </div>

      {/* Current Bowler */}
      <div className="lmi-bowler-section">
        <h4 className="lmi-section-heading">
          <span className="lmi-heading-icon">🎯</span> Current Bowler
        </h4>
        {currentBowler ? (
          <div className="lmi-bowler-card">
            <span className="lmi-bowler-name">{currentBowler.playerName}</span>
            <div className="lmi-bowler-stats">
              <span>{currentBowler.overs}.{currentBowler.oversBalls} ov</span>
              <span className="lmi-bowler-divider">|</span>
              <span>{currentBowler.runsConceded} runs</span>
              <span className="lmi-bowler-divider">|</span>
              <span className="lmi-bowler-wickets">{currentBowler.wickets}W</span>
              <span className="lmi-bowler-divider">|</span>
              <span>Econ: {currentBowler.economy}</span>
            </div>
          </div>
        ) : (
          <div className="lmi-bowler-card lmi-pending">Waiting for bowler...</div>
        )}
      </div>
    </motion.div>
  );
}
