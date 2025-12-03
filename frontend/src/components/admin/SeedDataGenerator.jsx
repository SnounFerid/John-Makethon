import React, { useState } from 'react';
import '../../styles/admin/SeedDataGenerator.css';

const SeedDataGenerator = () => {
  const [config, setConfig] = useState({
    numberOfUsers: 50,
    numberOfProjects: 30,
    numberOfTickets: 100,
    numberOfComments: 200,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    includeAttachments: true,
    includeNotifications: true,
    tesMode: false,
  });

  const [distribution, setDistribution] = useState({
    lowTickets: 30,
    mediumTickets: 50,
    highTickets: 20,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleDistributionChange = (field, value) => {
    const newDistribution = {
      ...distribution,
      [field]: value
    };
    setDistribution(newDistribution);
  };

  const distributionTotal = distribution.lowTickets + distribution.mediumTickets + distribution.highTickets;

  const applyPreset = (preset) => {
    const presets = {
      small: {
        numberOfUsers: 10,
        numberOfProjects: 5,
        numberOfTickets: 20,
        numberOfComments: 50,
        distribution: { lowTickets: 40, mediumTickets: 40, highTickets: 20 }
      },
      medium: {
        numberOfUsers: 50,
        numberOfProjects: 30,
        numberOfTickets: 100,
        numberOfComments: 200,
        distribution: { lowTickets: 30, mediumTickets: 50, highTickets: 20 }
      },
      large: {
        numberOfUsers: 200,
        numberOfProjects: 100,
        numberOfTickets: 500,
        numberOfComments: 1000,
        distribution: { lowTickets: 25, mediumTickets: 50, highTickets: 25 }
      },
      testMode: {
        numberOfUsers: 3,
        numberOfProjects: 2,
        numberOfTickets: 10,
        numberOfComments: 20,
        distribution: { lowTickets: 40, mediumTickets: 40, highTickets: 20 }
      }
    };

    if (presets[preset]) {
      const { distribution: dist, ...configValues } = presets[preset];
      setConfig(prev => ({
        ...prev,
        ...configValues,
        tesMode: preset === 'testMode'
      }));
      setDistribution(dist);
    }
  };

  const generateSeedData = async () => {
    if (distributionTotal !== 100) {
      setError('Ticket distribution must total 100%');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/seed-data/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          ...distribution
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate seed data');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while generating seed data');
    } finally {
      setLoading(false);
    }
  };

  const downloadSeedData = async () => {
    try {
      const response = await fetch('/api/admin/seed-data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to export seed data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seed-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Failed to export seed data');
    }
  };

  return (
    <div className="seed-data-generator">
      <h3>Seed Data Generator</h3>
      <p style={{ color: '#64748b' }}>Generate test data for development and testing purposes.</p>

      <div className="generator-layout">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h4>Configuration</h4>

          <div className="config-group">
            <label>Number of Users</label>
            <div className="input-with-range">
              <input
                type="number"
                min="1"
                max="1000"
                value={config.numberOfUsers}
                onChange={(e) => handleConfigChange('numberOfUsers', parseInt(e.target.value))}
              />
              <input
                type="range"
                min="1"
                max="1000"
                value={config.numberOfUsers}
                onChange={(e) => handleConfigChange('numberOfUsers', parseInt(e.target.value))}
              />
            </div>
            <span className="helper-text">{config.numberOfUsers} users</span>
          </div>

          <div className="config-group">
            <label>Number of Projects</label>
            <div className="input-with-range">
              <input
                type="number"
                min="1"
                max="500"
                value={config.numberOfProjects}
                onChange={(e) => handleConfigChange('numberOfProjects', parseInt(e.target.value))}
              />
              <input
                type="range"
                min="1"
                max="500"
                value={config.numberOfProjects}
                onChange={(e) => handleConfigChange('numberOfProjects', parseInt(e.target.value))}
              />
            </div>
            <span className="helper-text">{config.numberOfProjects} projects</span>
          </div>

          <div className="config-group">
            <label>Number of Tickets</label>
            <div className="input-with-range">
              <input
                type="number"
                min="1"
                max="5000"
                value={config.numberOfTickets}
                onChange={(e) => handleConfigChange('numberOfTickets', parseInt(e.target.value))}
              />
              <input
                type="range"
                min="1"
                max="5000"
                value={config.numberOfTickets}
                onChange={(e) => handleConfigChange('numberOfTickets', parseInt(e.target.value))}
              />
            </div>
            <span className="helper-text">{config.numberOfTickets} tickets</span>
          </div>

          <div className="config-group">
            <label>Number of Comments</label>
            <div className="input-with-range">
              <input
                type="number"
                min="0"
                max="10000"
                value={config.numberOfComments}
                onChange={(e) => handleConfigChange('numberOfComments', parseInt(e.target.value))}
              />
              <input
                type="range"
                min="0"
                max="10000"
                value={config.numberOfComments}
                onChange={(e) => handleConfigChange('numberOfComments', parseInt(e.target.value))}
              />
            </div>
            <span className="helper-text">{config.numberOfComments} comments</span>
          </div>

          <div className="config-group">
            <label>Start Date</label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => handleConfigChange('startDate', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div className="config-group">
            <label>End Date</label>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => handleConfigChange('endDate', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.includeAttachments}
                onChange={(e) => handleConfigChange('includeAttachments', e.target.checked)}
              />
              Include Attachments
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.includeNotifications}
                onChange={(e) => handleConfigChange('includeNotifications', e.target.checked)}
              />
              Include Notifications
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.tesMode}
                onChange={(e) => handleConfigChange('tesMode', e.target.checked)}
              />
              Test Mode (Minimal Data)
            </label>
          </div>
        </div>

        {/* Presets and Distribution Panel */}
        <div className="presets-panel">
          <h4>Quick Presets</h4>

          <div className="preset-buttons">
            <button
              className="preset-btn"
              onClick={() => applyPreset('small')}
              disabled={loading}
            >
              <strong>Small Dataset</strong>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                10 users, 5 projects, 20 tickets
              </div>
            </button>
            <button
              className="preset-btn"
              onClick={() => applyPreset('medium')}
              disabled={loading}
            >
              <strong>Medium Dataset</strong>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                50 users, 30 projects, 100 tickets
              </div>
            </button>
            <button
              className="preset-btn"
              onClick={() => applyPreset('large')}
              disabled={loading}
            >
              <strong>Large Dataset</strong>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                200 users, 100 projects, 500 tickets
              </div>
            </button>
            <button
              className="preset-btn"
              onClick={() => applyPreset('testMode')}
              disabled={loading}
            >
              <strong>Test Mode</strong>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                3 users, 2 projects, 10 tickets
              </div>
            </button>
          </div>

          <h4 style={{ marginTop: '2rem' }}>Priority Distribution</h4>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
            Configure the distribution of ticket priorities (must total 100%)
          </p>

          <div className="distribution-sliders">
            <div className="slider-item">
              <label>Low Priority</label>
              <div className="slider-with-value">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={distribution.lowTickets}
                  onChange={(e) => handleDistributionChange('lowTickets', parseInt(e.target.value))}
                />
                <span className="value">{distribution.lowTickets}%</span>
              </div>
            </div>

            <div className="slider-item">
              <label>Medium Priority</label>
              <div className="slider-with-value">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={distribution.mediumTickets}
                  onChange={(e) => handleDistributionChange('mediumTickets', parseInt(e.target.value))}
                />
                <span className="value">{distribution.mediumTickets}%</span>
              </div>
            </div>

            <div className="slider-item">
              <label>High Priority</label>
              <div className="slider-with-value">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={distribution.highTickets}
                  onChange={(e) => handleDistributionChange('highTickets', parseInt(e.target.value))}
                />
                <span className="value">{distribution.highTickets}%</span>
              </div>
            </div>
          </div>

          <div className={`distribution-total ${distributionTotal !== 100 ? 'warning' : ''}`}>
            Total: {distributionTotal}%
          </div>

          <div className="data-info">
            <h5>Estimated Data Size</h5>
            <ul className="info-list">
              <li><strong>Users:</strong> {config.numberOfUsers}</li>
              <li><strong>Projects:</strong> {config.numberOfProjects}</li>
              <li><strong>Tickets:</strong> {config.numberOfTickets}</li>
              <li><strong>Comments:</strong> {config.numberOfComments}</li>
              <li><strong>Date Range:</strong> {config.startDate} to {config.endDate}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          onClick={generateSeedData}
          disabled={loading || distributionTotal !== 100}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: loading || distributionTotal !== 100 ? '#cbd5e1' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || distributionTotal !== 100 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Generating...' : 'Generate Seed Data'}
        </button>
        <button
          onClick={downloadSeedData}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: loading ? '#cbd5e1' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          Export Data
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="generation-result error">
          <h4>⚠️ Error</h4>
          <p style={{ margin: 0, color: '#7f1d1d' }}>{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div className="generation-result">
          <h4>✅ Seed Data Generated Successfully</h4>
          <div className="result-details">
            <div className="result-grid">
              <div className="result-item">
                <span className="label">Users Created</span>
                <span className="value">{result.usersCreated || 0}</span>
              </div>
              <div className="result-item">
                <span className="label">Projects Created</span>
                <span className="value">{result.projectsCreated || 0}</span>
              </div>
              <div className="result-item">
                <span className="label">Tickets Created</span>
                <span className="value">{result.ticketsCreated || 0}</span>
              </div>
              <div className="result-item">
                <span className="label">Comments Created</span>
                <span className="value">{result.commentsCreated || 0}</span>
              </div>
            </div>

            {config.tesMode && (
              <div className="test-mode-info">
                <strong>Test Mode Patterns Used:</strong>
                <div className="patterns-list">
                  <div className="pattern-item">• Deterministic data generation with fixed seeds</div>
                  <div className="pattern-item">• Consistent relationships between entities</div>
                  <div className="pattern-item">• Predictable user and project names</div>
                  <div className="pattern-item">• Reproducible across multiple runs</div>
                </div>
              </div>
            )}

            {result.message && (
              <div className="success-message">
                {result.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeedDataGenerator;
