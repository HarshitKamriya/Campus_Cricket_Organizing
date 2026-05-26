const fs = require('fs');
const path = require('path');

const files = {
  "frontend/Dockerfile": `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
  "frontend/nginx.conf": `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`,
  "frontend/src/pages/HomePage.jsx": `import React, { useEffect, useState } from 'react';
import { matchService } from '../services/matchService';
import MatchCard from '../components/MatchCard';
import '../styles/HomePage.css';

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchService.getAllMatches().then(res => {
      setMatches(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const hasLive = matches.some(m => m.status === 'live');

  return (
    <div className="page homepage">
      <div className="hero">
        <h1>🏏 Campus Cricket</h1>
        <p className="subtitle">Live from NIT Srinagar</p>
        {hasLive && <div className="live-indicator"><span className="live-dot"></span> MATCH LIVE NOW</div>}
      </div>
      <div className="container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : matches.length === 0 ? (
          <p className="empty-state">No matches found. Create one from the admin panel.</p>
        ) : (
          <div className="match-grid">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/HomePage.css": `.homepage .hero { text-align: center; margin-bottom: var(--space-2xl); }
.homepage .hero h1 { font-size: 3rem; background: -webkit-linear-gradient(45deg, var(--accent), #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.homepage .hero .subtitle { color: var(--text-secondary); font-size: 1.2rem; }
.live-indicator { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1rem; color: var(--danger); font-weight: bold; background: rgba(255, 23, 68, 0.15); padding: 0.5rem 1rem; border-radius: var(--radius-full); }
.match-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-lg); }
.empty-state { text-align: center; color: var(--text-muted); }
`,
  "frontend/src/pages/MatchLivePage.jsx": `import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';
import Scoreboard from '../components/Scoreboard';
import OverTicker from '../components/OverTicker';
import BattingTable from '../components/BattingTable';
import BowlingTable from '../components/BowlingTable';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';
import '../styles/MatchLivePage.css';

export default function MatchLivePage() {
  const { id } = useParams();
  const { match, scoreboard, fetchScoreboard, fetchMatch, dispatch } = useMatch();
  const { socket, joinMatch, leaveMatch } = useSocket();

  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
    joinMatch(id);

    return () => leaveMatch(id);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (newScoreboard) => dispatch({ type: 'SET_SCOREBOARD', payload: newScoreboard });
    const handleEvent = (event) => {
      if (event.is_wicket) toast.error('Wicket! ' + event.commentary, { icon: '🏏' });
      else if (event.is_boundary_six) toast.success('SIX! ' + event.commentary, { icon: '🔥' });
      else if (event.is_boundary_four) toast.success('FOUR! ' + event.commentary, { icon: '🎯' });
    };
    socket.on('match:update', handleUpdate);
    socket.on('event:new', handleEvent);
    return () => {
      socket.off('match:update', handleUpdate);
      socket.off('event:new', handleEvent);
    };
  }, [socket, dispatch]);

  if (!match || !scoreboard) return <div className="page container"><div className="loading">Loading match...</div></div>;

  return (
    <div className="page container live-page">
      <div className="match-header">
        <h2>{match.title}</h2>
        <div className="venue-badge">📍 {match.venue}</div>
      </div>
      <div className="live-grid">
        <div className="main-col">
          <Scoreboard scoreboard={scoreboard} />
          <OverTicker balls={scoreboard.currentOverBalls || []} over={scoreboard.currentInnings?.totalOvers} />
          {scoreboard.currentInnings && (
            <>
              <BattingTable data={scoreboard.batting} />
              <BowlingTable data={scoreboard.bowling} />
            </>
          )}
        </div>
        <div className="side-col">
          <EventLog events={scoreboard.events} />
        </div>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/MatchLivePage.css": `.live-page { padding-top: var(--space-md); }
.match-header { margin-bottom: var(--space-lg); text-align: center; }
.venue-badge { display: inline-block; background: var(--bg-glass); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; }
.live-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-xl); }
@media (max-width: 900px) { .live-grid { grid-template-columns: 1fr; } }
.main-col { display: flex; flex-direction: column; gap: var(--space-lg); }
.side-col { height: 600px; }
`,
  "frontend/src/pages/AdminLoginPage.jsx": `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminLoginPage.css';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/admin/setup');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="page login-page">
      <div className="glass-card login-card">
        <h2 className="section-title">Admin Login</h2>
        <p className="subtitle">Campus Cricket — NIT Srinagar</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Login</button>
        </form>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/AdminLoginPage.css": `.login-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; }
.login-card { width: 100%; max-width: 400px; padding: var(--space-xl); }
.login-card .subtitle { color: var(--text-secondary); margin-bottom: var(--space-lg); }
.form-group { margin-bottom: var(--space-md); display: flex; flex-direction: column; gap: 0.5rem; }
.error-banner { background: rgba(255, 23, 68, 0.15); color: var(--danger); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: var(--space-md); text-align: center; }
.btn-block { width: 100%; margin-top: var(--space-sm); }
`,
  "frontend/src/pages/AdminScorerPage.jsx": `import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { matchService } from '../services/matchService';
import { eventService } from '../services/eventService';
import Scoreboard from '../components/Scoreboard';
import EventControls from '../components/EventControls';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';
import '../styles/AdminScorerPage.css';

export default function AdminScorerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { match, scoreboard, fetchMatch, fetchScoreboard } = useMatch();
  
  useEffect(() => {
    fetchMatch(id);
    fetchScoreboard(id);
  }, [id]);

  const handleEventSubmit = async (eventData) => {
    try {
      await eventService.addBallEvent(id, eventData);
      fetchScoreboard(id);
      toast.success('Ball added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add event');
    }
  };

  const handleUndo = async () => {
    if (!window.confirm('Are you sure you want to undo the last ball?')) return;
    try {
      await eventService.undoLastEvent(id);
      fetchScoreboard(id);
      toast.success('Undone last ball');
    } catch (err) {
      toast.error('Failed to undo');
    }
  };

  if (!match || !scoreboard) return <div className="page container">Loading...</div>;

  return (
    <div className="page container scorer-page">
      <div className="scorer-header">
        <h2>Admin Panel - {match.title}</h2>
        <div className="scorer-actions">
          <button className="btn btn-ghost" onClick={handleUndo}>Undo Last Ball</button>
          <button className="btn btn-danger" onClick={() => matchService.endMatch(id).then(() => navigate('/'))}>End Match</button>
        </div>
      </div>
      
      <div className="scorer-grid">
        <div className="main-col">
          <Scoreboard scoreboard={scoreboard} />
          <div className="glass-card">
            <h3 className="section-title">Add Event</h3>
            <EventControls onSubmit={handleEventSubmit} />
          </div>
        </div>
        <div className="side-col">
          <EventLog events={scoreboard.events} />
        </div>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/AdminScorerPage.css": `.scorer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.scorer-actions { display: flex; gap: var(--space-md); }
.scorer-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-xl); }
@media (max-width: 900px) { .scorer-grid { grid-template-columns: 1fr; } .scorer-header { flex-direction: column; gap: var(--space-md); } }
`,
  "frontend/src/pages/AdminMatchSetupPage.jsx": `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '../services/matchService';
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
`,
  "frontend/src/styles/AdminMatchSetupPage.css": `.setup-page { display: flex; justify-content: center; padding-top: var(--space-xl); }
.setup-card { width: 100%; max-width: 600px; }
`,
  "frontend/src/components/Scoreboard.jsx": `import React from 'react';
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
`,
  "frontend/src/styles/Scoreboard.css": `.scoreboard { text-align: center; border-bottom: 3px solid var(--accent); }
.sb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
.sb-team { font-weight: 600; color: var(--text-secondary); }
.sb-main { margin: var(--space-md) 0; overflow: hidden; }
.sb-score { font-size: 5rem; font-weight: 800; color: var(--accent); line-height: 1; font-family: var(--font-mono); }
.sb-wickets { font-size: 3rem; color: var(--text-secondary); }
.sb-stats { display: flex; justify-content: center; gap: var(--space-xl); background: rgba(0,0,0,0.2); padding: var(--space-sm); border-radius: var(--radius-md); }
.sb-stat { display: flex; flex-direction: column; }
.sb-stat span { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; }
.sb-stat strong { font-size: 1.2rem; font-family: var(--font-mono); }
@media (max-width: 600px) { .sb-score { font-size: 3.5rem; } .sb-wickets { font-size: 2rem; } .sb-stats { gap: var(--space-md); } }
`,
  "frontend/src/components/OverTicker.jsx": `import React from 'react';
import '../styles/OverTicker.css';

export default function OverTicker({ balls = [], over = 0 }) {
  return (
    <div className="glass-card over-ticker">
      <div className="ticker-label">Over {over}</div>
      <div className="ticker-balls">
        {balls.map((b, i) => (
          <div key={i} className={\`ball \${b.toLowerCase()}\`}>{b}</div>
        ))}
        {balls.length === 0 && <span className="ticker-empty">This over is empty</span>}
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/OverTicker.css": `.over-ticker { display: flex; align-items: center; gap: var(--space-lg); padding: var(--space-sm) var(--space-md); }
.ticker-label { font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
.ticker-balls { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px; }
.ticker-empty { color: var(--text-muted); font-size: 0.9rem; font-style: italic; }
.ball { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: var(--font-mono); color: #fff; background: var(--dot-ball); flex-shrink: 0; box-shadow: var(--shadow-sm); }
.ball.w { background: var(--danger); }
.ball.4 { background: var(--four); color: #000; }
.ball.6 { background: var(--six); }
.ball.1, .ball.2, .ball.3 { background: var(--single); color: #000; }
.ball.wd, .ball.nb { background: var(--wide); }
`,
  "frontend/src/components/PlayerCard.jsx": `import React from 'react';
export default function PlayerCard() { return <div></div>; }
`,
  "frontend/src/styles/PlayerCard.css": ``,
  "frontend/src/components/BattingTable.jsx": `import React from 'react';
import '../styles/BattingTable.css';
export default function BattingTable({ data = [] }) {
  return (
    <div className="glass-card table-card">
      <h3 className="section-title">Batting</h3>
      <div className="table-responsive">
        <table>
          <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
          <tbody>
            {data.map(b => (
              <tr key={b.playerId}>
                <td>{b.name}</td>
                <td><strong>{b.runs}</strong></td>
                <td>{b.ballsFaced}</td>
                <td>{b.fours}</td>
                <td>{b.sixes}</td>
                <td>{b.strikeRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/BattingTable.css": `.table-card { padding: var(--space-md); }
.table-responsive { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 0.5rem; border-bottom: 1px solid var(--border-color); }
th { color: var(--text-secondary); font-weight: 500; font-size: 0.85rem; text-transform: uppercase; }
td strong { color: var(--accent); }
`,
  "frontend/src/components/BowlingTable.jsx": `import React from 'react';
export default function BowlingTable({ data = [] }) {
  return (
    <div className="glass-card table-card">
      <h3 className="section-title">Bowling</h3>
      <div className="table-responsive">
        <table>
          <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
          <tbody>
            {data.map(b => (
              <tr key={b.playerId}>
                <td>{b.name}</td>
                <td>{b.overs}.{b.oversBalls}</td>
                <td>{b.maidens}</td>
                <td>{b.runsConceded}</td>
                <td><strong>{b.wickets}</strong></td>
                <td>{b.economy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/BowlingTable.css": ``,
  "frontend/src/components/EventControls.jsx": `import React, { useState } from 'react';
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
          <button key={r} className={\`btn btn-run \${r === 4 || r === 6 ? 'btn-boundary' : ''}\`} onClick={() => submitRun(r)}>{r}</button>
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
`,
  "frontend/src/styles/EventControls.css": `.runs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
.btn-run { font-size: 1.5rem; font-family: var(--font-mono); padding: 1rem; background: var(--bg-input); }
.btn-boundary { background: var(--accent); color: #000; }
.actions-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
`,
  "frontend/src/components/EventLog.jsx": `import React from 'react';
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
              <span className="log-text">{ev.commentary || \`\${ev.runs_scored} runs\`}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/EventLog.css": `.event-log { height: 100%; display: flex; flex-direction: column; }
.log-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
.log-item { display: flex; gap: 0.75rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); border-left: 3px solid var(--primary-light); }
.log-ball { font-weight: bold; color: var(--accent); font-family: var(--font-mono); min-width: 2.5rem; }
.log-text { color: var(--text-primary); font-size: 0.9rem; line-height: 1.4; }
`,
  "frontend/src/components/MatchCard.jsx": `import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MatchCard.css';

export default function MatchCard({ match }) {
  const nav = useNavigate();
  return (
    <div className="glass-card match-card" onClick={() => nav('/match/' + match.id)}>
      <div className="mc-header">
        <span className={\`badge badge-\${match.status}\`}>{match.status}</span>
        <span className="mc-venue">{match.venue}</span>
      </div>
      <h3 className="mc-teams">TEAM A vs TEAM B</h3>
      <p className="mc-title">{match.title}</p>
      <div className="mc-footer">
        <span>Overs: {match.total_overs}</span>
      </div>
    </div>
  );
}
`,
  "frontend/src/styles/MatchCard.css": `.match-card { cursor: pointer; display: flex; flex-direction: column; gap: 0.75rem; }
.mc-header { display: flex; justify-content: space-between; align-items: center; }
.mc-venue { font-size: 0.8rem; color: var(--text-muted); }
.mc-teams { font-size: 1.25rem; color: var(--accent); }
.mc-title { font-size: 0.9rem; color: var(--text-secondary); }
.mc-footer { margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted); }
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.resolve(filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log("Created " + Object.keys(files).length + " files.");
