import React, { useState, useEffect, useCallback } from 'react';
import { detectionAPI } from '../services/apiClient';
import '../styles/ManualValveControl.css';

const ManualValveControl = () => {
  const [valveState, setValveState] = useState('OPEN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch valve status on mount and periodically
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/valve/status');
      const data = await response.json();
      if (data.success) {
        setValveState(data.data.state);
        setLastUpdated(new Date(data.data.lastUpdated).toLocaleTimeString());
        setError(null);
      }
    } catch (err) {
      console.error('[VALVE] Failed to fetch status:', err);
      setError('Failed to fetch valve status');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Only poll for status when valve is OPEN
    // Stop polling completely when valve is CLOSED
    let interval;
    if (valveState === 'OPEN') {
      interval = setInterval(fetchStatus, 5000); // Update every 5 seconds when OPEN
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [valveState, fetchStatus]);

  const handleValveControl = useCallback(async (operation) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/valve/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation })
      });

      const data = await response.json();
      if (data.success) {
        setValveState(data.data.state);
        setLastUpdated(new Date(data.data.timestamp).toLocaleTimeString());
        setError(null);
      } else {
        setError(data.message || 'Control failed');
      }
    } catch (err) {
      console.error('[VALVE] Control error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isOpen = valveState === 'OPEN';

  return (
    <div className="manual-valve-control">
      <div className="valve-container">
        <div className="valve-visual">
          {/* Valve representation */}
          <div className={`valve-icon ${isOpen ? 'open' : 'closed'}`}>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="valve-svg">
              {/* Valve body - vertical pipe */}
              <rect x="40" y="10" width="20" height="80" fill="none" stroke="currentColor" strokeWidth="3" rx="2" />
              
              {/* Valve handle/ball */}
              <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
              
              {/* Handle indicator - rotates based on state */}
              <line
                x1="50"
                y1="50"
                x2={50 + 15 * Math.cos((isOpen ? 0 : 90) * Math.PI / 180)}
                y2={50 + 15 * Math.sin((isOpen ? 0 : 90) * Math.PI / 180)}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Inlet and outlet ports */}
              <circle cx="50" cy="15" r="3" fill="currentColor" />
              <circle cx="50" cy="85" r="3" fill="currentColor" />
            </svg>
          </div>

          <div className="valve-status-text">
            <h3>Water Valve</h3>
            <p className={`status ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
            </p>
            {isOpen ? (
              <p className="reading-status">✅ System reading sensor data</p>
            ) : (
              <p className="reading-status blocked">⛔ System NOT reading sensor data</p>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="valve-buttons">
          <button
            className={`valve-btn open-btn ${isOpen ? 'active' : ''}`}
            onClick={() => handleValveControl('OPEN')}
            disabled={loading || isOpen}
            title={isOpen ? 'Valve already open' : 'Open the valve'}
          >
            <span className="btn-icon">🟢</span>
            <span className="btn-text">Open Valve</span>
          </button>

          <button
            className={`valve-btn close-btn ${!isOpen ? 'active' : ''}`}
            onClick={() => handleValveControl('CLOSE')}
            disabled={loading || !isOpen}
            title={!isOpen ? 'Valve already closed' : 'Close the valve'}
          >
            <span className="btn-icon">🔴</span>
            <span className="btn-text">Close Valve</span>
          </button>
        </div>

        {lastUpdated && (
          <div className="valve-timestamp">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualValveControl;
