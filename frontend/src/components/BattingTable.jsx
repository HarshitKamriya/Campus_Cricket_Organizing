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
            {data.map((b, idx) => {
              // Determine if this batter is currently active (not dismissed)
              const isActive = b.status === 'batting' || b.status === 'not_out' || b.status === 'not out' || !b.dismissal;
              // First active batter = striker
              const activeList = data.filter(
                p => p.status === 'batting' || p.status === 'not_out' || p.status === 'not out' || !p.dismissal
              );
              const isStriker = activeList.length > 0 && activeList[0].playerId === b.playerId;

              return (
                <tr key={b.playerId} className={isActive ? 'batting-active' : 'batting-out'}>
                  <td>
                    {b.name}
                    {isStriker && <span className="striker-badge" title="On Strike">*</span>}
                    {isActive && !isStriker && <span className="active-dot" title="At Crease"></span>}
                  </td>
                  <td><strong>{b.runs}</strong></td>
                  <td>{b.ballsFaced}</td>
                  <td>{b.fours}</td>
                  <td>{b.sixes}</td>
                  <td>{b.strikeRate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
