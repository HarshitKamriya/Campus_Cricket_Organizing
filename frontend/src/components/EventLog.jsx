import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/EventLog.css';

export default function EventLog({ events = [] }) {
  return (
    <div className="glass-card event-log">
      <h3 className="section-title">Commentary</h3>
      <div className="log-list">
        <AnimatePresence>
          {events.slice().reverse().map(ev => (
            <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="log-item">
              <span className="log-ball">{ev.over_number}.{ev.ball_in_over}</span>
              <span className="log-text">{ev.commentary || `${ev.runs_scored} runs`}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
