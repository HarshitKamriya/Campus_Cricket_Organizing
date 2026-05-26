import React from 'react';
import '../styles/Loading.css';

function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="cricket-ball">
          <div className="ball-seam"></div>
        </div>
      </div>
      <p className="loading-text">{message}</p>
      <p className="loading-brand">Campus Cricket — NIT Srinagar</p>
    </div>
  );
}

export default Loading;
