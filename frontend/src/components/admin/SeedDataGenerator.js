import React, { useState } from 'react';
import { FiPlay, FiStopCircle, FiCheck, FiAlertCircle } from 'react-icons/fi';
import '../../styles/admin/SeedDataGenerator.css';

const SeedDataGenerator = ({ testMode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationConfig, setGenerationConfig] = useState({
    numRecords: 1000,
    daysBack: 30,
    normalDataPercentage: 70,
    anomaliesPercentage: 20,
    leaksPercentage: 10,
    includeAlerts: true,
  });
  const [generationResult, setGenerationResult] = useState(null);

  const presets = [
    {
      name: '1 Day Test Data',
      config: { numRecords: 100, daysBack: 1, normalDataPercentage: 85, anomaliesPercentage: 10, leaksPercentage: 5 },
    },
    {
      name: '1 Week Realistic',
      config: { numRecords: 1000, daysBack: 7, normalDataPercentage: 75, anomaliesPercentage: 15, leaksPercentage: 10 },
    },
    {
      name: '1 Month Full Dataset',
      config: { numRecords: 3000, daysBack: 30, normalDataPercentage: 70, anomaliesPercentage: 20, leaksPercentage: 10 },
    },
    {
      name: 'Extreme Test (with bursts)',
      config: { numRecords: 2000, daysBack: 14, normalDataPercentage: 60, anomaliesPercentage: 25, leaksPercentage: 15 },
    },
  ];

  const handleGenerateData = async () => {
    try {
      console.log('[SEED DATA GENERATOR] Starting data generation:', generationConfig);
      setIsGenerating(true);
      setGenerationResult(null);

      const response = await fetch('/api/admin/generate-seed-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generationConfig,
          testMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (testMode) {
        console.log('[TEST MODE] Generation result:', result);
        console.log('[TEST MODE] Data distribution:', {
          normal: generationConfig.normalDataPercentage,
          anomalies: generationConfig.anomaliesPercentage,
          leaks: generationConfig.leaksPercentage,
        });
      }

      setGenerationResult(result);
    } catch (err) {
      console.error('[SEED DATA GENERATOR] Error:', err);
      setGenerationResult({ error: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setGenerationConfig(preset.config);
    setGenerationResult(null);
  };

  return (
    <div className="seed-data-generator">
      <h3>Seed Data Generator</h3>
      <p className="section-description">
        Generate realistic historical data patterns to populate the system for testing and analysis.
      </p>

      <div className="generator-layout">
        {/* Configuration */}
        <div className="config-panel">
          <h4>Generator Configuration</h4>

          <div className="config-group">
            <label>Number of Records</label>
            <div className="input-with-range">
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={generationConfig.numRecords}
                onChange={(e) =>
                  setGenerationConfig({
                    ...generationConfig,
                    numRecords: parseInt(e.target.value),
                  })
                }
                disabled={isGenerating}
              />
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={generationConfig.numRecords}
                onChange={(e) =>
                  setGenerationConfig({
                    ...generationConfig,
                    numRecords: parseInt(e.target.value),
                  })
                }
                disabled={isGenerating}
              />
            </div>
            <span className="helper-text">{generationConfig.numRecords} records</span>
          </div>

          <div className="config-group">
            <label>Historical Period (days)</label>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              value={generationConfig.daysBack}
              onChange={(e) =>
                setGenerationConfig({
                  ...generationConfig,
                  daysBack: parseInt(e.target.value),
                })
              }
              disabled={isGenerating}
            />
            <span className="helper-text">Generate data from {generationConfig.daysBack} days ago to today</span>
          </div>

          <div className="config-group">
            <h5>Data Distribution</h5>
            <div className="distribution-sliders">
              <div className="slider-item">
                <label>Normal Data</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={generationConfig.normalDataPercentage}
                    onChange={(e) =>
                      setGenerationConfig({
                        ...generationConfig,
                        normalDataPercentage: parseInt(e.target.value),
                      })
                    }
                    disabled={isGenerating}
                  />
                  <span className="value">{generationConfig.normalDataPercentage}%</span>
                </div>
              </div>

              <div className="slider-item">
                <label>Anomalies</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={generationConfig.anomaliesPercentage}
                    onChange={(e) =>
                      setGenerationConfig({
                        ...generationConfig,
                        anomaliesPercentage: parseInt(e.target.value),
                      })
                    }
                    disabled={isGenerating}
                  />
                  <span className="value">{generationConfig.anomaliesPercentage}%</span>
                </div>
              </div>

              <div className="slider-item">
                <label>Leak Events</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={generationConfig.leaksPercentage}
                    onChange={(e) =>
                      setGenerationConfig({
                        ...generationConfig,
                        leaksPercentage: parseInt(e.target.value),
                      })
                    }
                    disabled={isGenerating}
                  />
                  <span className="value">{generationConfig.leaksPercentage}%</span>
                </div>
              </div>
            </div>

            <div className="distribution-total">
              Total: {generationConfig.normalDataPercentage + generationConfig.anomaliesPercentage + generationConfig.leaksPercentage}%
            </div>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={generationConfig.includeAlerts}
                onChange={(e) =>
                  setGenerationConfig({
                    ...generationConfig,
                    includeAlerts: e.target.checked,
                  })
                }
                disabled={isGenerating}
              />
              Include Generated Alerts
            </label>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            {!isGenerating ? (
              <button
                className="btn primary"
                onClick={handleGenerateData}
                disabled={isGenerating}
              >
                <FiPlay size={18} /> Generate Data
              </button>
            ) : (
              <button className="btn" disabled>
                <div className="spinner" /> Generating...
              </button>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="presets-panel">
          <h4>Quick Presets</h4>
          <div className="preset-buttons">
            {presets.map((preset) => (
              <button
                key={preset.name}
                className="preset-btn"
                onClick={() => handleApplyPreset(preset)}
                disabled={isGenerating}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Data Info */}
          <div className="data-info">
            <h5>Generation Details</h5>
            <ul className="info-list">
              <li>
                <strong>Total Records:</strong> {generationConfig.numRecords}
              </li>
              <li>
                <strong>Time Period:</strong> {generationConfig.daysBack} days
              </li>
              <li>
                <strong>Normal Data:</strong> ~
                {Math.round((generationConfig.numRecords * generationConfig.normalDataPercentage) / 100)}
                {' '}
                records
              </li>
              <li>
                <strong>Anomalies:</strong> ~
                {Math.round((generationConfig.numRecords * generationConfig.anomaliesPercentage) / 100)}
                {' '}
                records
              </li>
              <li>
                <strong>Leak Events:</strong> ~
                {Math.round((generationConfig.numRecords * generationConfig.leaksPercentage) / 100)}
                {' '}
                records
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results */}
      {generationResult && !isGenerating && (
        <div className={`generation-result ${generationResult.error ? 'error' : 'success'}`}>
          <h4>
            {generationResult.error ? (
              <>
                <FiAlertCircle size={20} /> Generation Error
              </>
            ) : (
              <>
                <FiCheck size={20} /> Data Generated Successfully
              </>
            )}
          </h4>

          {generationResult.error ? (
            <p>{generationResult.error}</p>
          ) : (
            <div className="result-details">
              <div className="result-grid">
                <div className="result-item">
                  <span className="label">Total Records Generated</span>
                  <span className="value">{generationResult.totalRecords}</span>
                </div>

                <div className="result-item">
                  <span className="label">Normal Data Records</span>
                  <span className="value">{generationResult.normalRecords}</span>
                </div>

                <div className="result-item">
                  <span className="label">Anomaly Records</span>
                  <span className="value">{generationResult.anomalyRecords}</span>
                </div>

                <div className="result-item">
                  <span className="label">Leak Events</span>
                  <span className="value">{generationResult.leakRecords}</span>
                </div>

                <div className="result-item">
                  <span className="label">Alerts Generated</span>
                  <span className="value">{generationResult.alertsGenerated || 0}</span>
                </div>

                <div className="result-item">
                  <span className="label">Generation Time</span>
                  <span className="value">{generationResult.generationTime}s</span>
                </div>
              </div>

              {testMode && generationResult.dataPatterns && (
                <div className="test-mode-info">
                  <h5>Test Mode - Data Patterns</h5>
                  <div className="patterns-list">
                    {generationResult.dataPatterns.map((pattern, idx) => (
                      <div key={idx} className="pattern-item">
                        <strong>{pattern.name}:</strong> {pattern.count} occurrences
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="success-message">
                ✓ Data has been successfully inserted into the database. You can now run simulations and tests.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeedDataGenerator;
