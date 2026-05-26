import React from 'react';
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
