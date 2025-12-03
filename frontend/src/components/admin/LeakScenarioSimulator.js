import React, { useState } from 'react';
import { FiPlay, FiStopCircle, FiAlertCircle, FiCheck } from 'react-icons/fi';
import '../../styles/admin/LeakScenarioSimulator.css';

const LeakScenarioSimulator = ({ testMode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('slow-leak');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(50);
  const [simulationResult, setSimulationResult] = useState(null);

  const scenarios = [
    {
      id: 'slow-leak',
      name: 'Slow Leak',
      description: 'Gradual pressure and flow decrease over time',
      icon: '💧',
      expectedResult: 'Low to Medium detection probability',
    },
    {
      id: 'burst',
      name: 'Pipe Burst',
      description: 'Sudden complete loss of pressure',
      icon: '💥',
      expectedResult: 'Critical detection probability (100%)',
    },
    {
      id: 'pressure-surge',
      name: 'Pressure Surge',
      description: 'Sudden spike in pressure (water hammer effect)',
      icon: '📈',
      expectedResult: 'High detection probability',
    },
    {
      id: 'temperature-anomaly',
      name: 'Temperature Anomaly',
      description: 'Abnormal temperature readings indicating corrosion',
      icon: '🌡️',
      expectedResult: 'Medium detection probability',
    },
    {
      id: 'conductivity-spike',
      name: 'Conductivity Spike',
      description: 'High conductivity indicating contamination/corrosion',
      icon: '⚡',
      expectedResult: 'Medium to High detection probability',
    },
    {
      id: 'gradual-degradation',
      name: 'Gradual Degradation',
      description: 'Slow increase in multiple anomalies over days',
      icon: '📉',
      expectedResult: 'Medium detection probability',
    },
  ];

  const handleRunSimulation = async () => {
    try {
      console.log('[LEAK SIMULATOR] Running scenario:', selectedScenario);
      setIsRunning(true);

      // Simulate API call
      const response = await fetch('/api/admin/simulate-leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          duration,
          intensity,
          testMode,
        }),
      });

      const result = await response.json();

      if (testMode) {
        console.log('[TEST MODE] Simulation result:', result);
        console.log('[TEST MODE] Detection probability:', result.leakProbability);
        console.log('[TEST MODE] Anomaly scores:', result.anomalyScores);
        console.log('[TEST MODE] Rule-based detection:', result.ruleBasedDetection);
      }

      setSimulationResult(result);
    } catch (err) {
      console.error('[LEAK SIMULATOR] Error:', err);
      setSimulationResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
    setSimulationResult(null);
  };

  const selectedScenarioObj = scenarios.find((s) => s.id === selectedScenario);

  return (
    <div className="leak-simulator">
      <h3>Leak Scenario Simulator</h3>
      <p className="section-description">
        Manually trigger different leak scenarios to test system detection capabilities.
      </p>

      <div className="simulator-layout">
        {/* Scenario Selection */}
        <div className="scenario-selector">
          <h4>Select Scenario</h4>
          <div className="scenario-grid">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`scenario-btn ${selectedScenario === scenario.id ? 'active' : ''}`}
                onClick={() => setSelectedScenario(scenario.id)}
                disabled={isRunning}
              >
                <span className="scenario-icon">{scenario.icon}</span>
                <span className="scenario-name">{scenario.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Details */}
        {selectedScenarioObj && (
          <div className="scenario-details">
            <h4>{selectedScenarioObj.name}</h4>
            <p className="description">{selectedScenarioObj.description}</p>
            <div className="expected-result">
              <FiCheck size={18} />
              <p>{selectedScenarioObj.expectedResult}</p>
            </div>

            {/* Controls */}
            <div className="control-group">
              <div className="slider-control">
                <label>Duration (seconds)</label>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={isRunning}
                />
                <span className="value">{duration}s</span>
              </div>

              <div className="slider-control">
                <label>Intensity (%)</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  disabled={isRunning}
                />
                <span className="value">{intensity}%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {!isRunning ? (
                <button
                  className="btn primary"
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                >
                  <FiPlay size={18} />
                  Run Simulation
                </button>
              ) : (
                <button className="btn danger" onClick={handleStopSimulation}>
                  <FiStopCircle size={18} />
                  Stop Simulation
                </button>
              )}
            </div>

            {isRunning && (
              <div className="running-indicator">
                <div className="spinner" />
                <p>Simulation running...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {simulationResult && !isRunning && (
        <div className={`simulation-result ${simulationResult.error ? 'error' : 'success'}`}>
          <h4>
            {simulationResult.error ? (
              <>
                <FiAlertCircle size={20} /> Simulation Error
              </>
            ) : (
              <>
                <FiCheck size={20} /> Simulation Complete
              </>
            )}
          </h4>

          {simulationResult.error ? (
            <p>{simulationResult.error}</p>
          ) : (
            <div className="result-details">
              <div className="result-row">
                <span className="label">Leak Probability:</span>
                <span className={`value prob-${Math.round(simulationResult.leakProbability / 20) * 20}`}>
                  {simulationResult.leakProbability.toFixed(2)}%
                </span>
              </div>

              <div className="result-row">
                <span className="label">Detected:</span>
                <span className={`value ${simulationResult.detected ? 'detected' : 'not-detected'}`}>
                  {simulationResult.detected ? '✓ Yes' : '✗ No'}
                </span>
              </div>

              <div className="result-row">
                <span className="label">Severity:</span>
                <span className={`value severity-${simulationResult.severity?.toLowerCase()}`}>
                  {simulationResult.severity || 'N/A'}
                </span>
              </div>

              {testMode && simulationResult.anomalyScores && (
                <div className="test-mode-details">
                  <h5>Test Mode - Internal Calculations</h5>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span>Anomaly Score:</span>
                      <strong>{simulationResult.anomalyScores.overall.toFixed(4)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Rule-Based Detection:</span>
                      <strong>{simulationResult.ruleBasedDetection.toFixed(2)}%</strong>
                    </div>
                    <div className="detail-item">
                      <span>ML Model Probability:</span>
                      <strong>{(simulationResult.leakProbability - simulationResult.ruleBasedDetection).toFixed(2)}%</strong>
                    </div>
                    <div className="detail-item">
                      <span>Execution Time:</span>
                      <strong>{simulationResult.executionTime}ms</strong>
                    </div>
                  </div>

                  {simulationResult.detectionFactors && (
                    <div className="detection-factors">
                      <h6>Detection Factors</h6>
                      <ul>
                        {simulationResult.detectionFactors.map((factor, idx) => (
                          <li key={idx}>
                            <strong>{factor.name}:</strong> {factor.impact}% impact
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeakScenarioSimulator;
