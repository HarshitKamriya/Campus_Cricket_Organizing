import React from 'react';
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
                <td>{b.playerName}</td>
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
