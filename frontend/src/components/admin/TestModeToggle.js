import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import '../../styles/admin/TestModeToggle.css';

const TestModeToggle = () => {
  const [testMode, setTestMode] = useState(false);
  const [logLevel, setLogLevel] = useState('info');
  const [showCalculations, setShowCalculations] = useState(true);
  const [showAIDecisions, setShowAIDecisions] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState([]);

  useEffect(() => {
    if (testMode) {
      console.log('[TEST MODE] Activated - All internal calculations will be logged');
      addConsoleOutput('Test Mode Activated', 'info');
    }
  }, [testMode]);

  const addConsoleOutput = (message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput((prev) =>
      [{ message, level, timestamp }, ...prev].slice(0, 100) // Keep last 100 logs
    );
  };

  const handleToggleTestMode = () => {
    setTestMode(!testMode);
    addConsoleOutput(
      `Test Mode ${!testMode ? 'Enabled' : 'Disabled'}`,
      !testMode ? 'success' : 'warning'
    );
  };

  const handleClearLogs = () => {
    setConsoleOutput([]);
    addConsoleOutput('Console cleared', 'info');
  };

  const handleExportLogs = () => {
    const logsText = consoleOutput
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .reverse()
      .join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-mode-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[TEST MODE] Logs exported');
  };

  return (
    <div className="test-mode-toggle">
      <h3>Test Mode Control</h3>
      <p className="section-description">
        Enable test mode to see detailed internal calculations and AI decision processes.
      </p>

      {/* Test Mode Switch */}
      <div className="toggle-section">
        <div className="toggle-header">
          <h4>Test Mode Status</h4>
          <button
            className={`toggle-switch ${testMode ? 'active' : ''}`}
            onClick={handleToggleTestMode}
          >
            {testMode ? <FiEye size={20} /> : <FiEyeOff size={20} />}
            <span>{testMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {testMode && (
          <div className="test-mode-active">
            <FiCheck size={16} className="check-icon" />
            <p>Test Mode is Active - Console logging enabled</p>
          </div>
        )}
      </div>

      {/* Logging Options */}
      {testMode && (
        <div className="logging-options">
          <h4>Logging Configuration</h4>

          <div className="option-group">
            <label>Log Level</label>
            <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
              <option value="error">Error Only</option>
              <option value="warning">Warning & Error</option>
              <option value="info">Info & Above</option>
              <option value="debug">Debug (All)</option>
            </select>
          </div>

          <div className="checkbox-options">
            <label>
              <input
                type="checkbox"
                checked={showCalculations}
                onChange={(e) => setShowCalculations(e.target.checked)}
              />
              Show Mathematical Calculations
            </label>
            <label>
              <input
                type="checkbox"
                checked={showAIDecisions}
                onChange={(e) => setShowAIDecisions(e.target.checked)}
              />
              Show AI Model Decisions
            </label>
          </div>
        </div>
      )}

      {/* Console Output */}
      {testMode && (
        <div className="console-section">
          <div className="console-header">
            <h4>Real-time Console Log</h4>
            <div className="console-actions">
              <button className="console-btn" onClick={handleClearLogs}>
                Clear Logs
              </button>
              <button className="console-btn" onClick={handleExportLogs}>
                Export Logs
              </button>
            </div>
          </div>

          <div className="console-output">
            {consoleOutput.length === 0 ? (
              <div className="empty-state">
                <p>No logs yet. Perform system actions to see detailed output.</p>
              </div>
            ) : (
              <div className="log-entries">
                {consoleOutput.map((log, idx) => (
                  <div key={idx} className={`log-entry level-${log.level}`}>
                    <span className="timestamp">{log.timestamp}</span>
                    <span className={`level-badge level-${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="message">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="console-hint">
            💡 Tip: Check your browser's Developer Console (F12) for even more detailed logging with prefixes like
            [WEBSOCKET], [ADMIN PANEL], etc.
          </p>
        </div>
      )}

      {/* Information */}
      <div className="info-section">
        <h4>About Test Mode</h4>
        <div className="info-cards">
          <div className="info-card">
            <h5>What Test Mode Shows</h5>
            <ul>
              <li>All sensor reading calculations and normalization</li>
              <li>Rule-based detection thresholds and results</li>
              <li>ML model inference outputs and confidence scores</li>
              <li>Combined detection probability calculation</li>
              <li>Alert generation and severity determination</li>
              <li>WebSocket data streaming details</li>
              <li>API request/response timing</li>
            </ul>
          </div>

          <div className="info-card">
            <h5>Logging Locations</h5>
            <ul>
              <li>
                <strong>Browser Console:</strong> F12 → Console tab
              </li>
              <li>
                <strong>Test Mode Panel:</strong> Real-time log display above
              </li>
              <li>
                <strong>Network Tab:</strong> F12 → Network tab for API details
              </li>
              <li>
                <strong>Performance Tab:</strong> F12 → Performance for timing analysis
              </li>
              <li>
                <strong>Exported Logs:</strong> Download as .txt file for analysis
              </li>
            </ul>
          </div>

          <div className="info-card">
            <h5>Use Cases</h5>
            <ul>
              <li>Debugging detection algorithm behavior</li>
              <li>Verifying ML model predictions</li>
              <li>Analyzing system performance bottlenecks</li>
              <li>Testing data export and seed generation</li>
              <li>Validating simulation scenarios</li>
              <li>Monitoring real-time data flow</li>
              <li>Compliance and audit trail recording</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Impact */}
      <div className="warning-section">
        <h4>⚠️ Performance Note</h4>
        <p>
          Test Mode includes additional logging and calculations that may slightly impact performance. Use only during
          development and testing, not in production.
        </p>
      </div>
    </div>
  );
};

export default TestModeToggle;
