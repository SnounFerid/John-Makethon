import React, { useContext, useEffect } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import { FiAlertTriangle, FiTrendingDown, FiTool, FiClock, FiZap } from 'react-icons/fi';
import '../styles/PredictiveMaintenance.css';

const PredictiveMaintenance = () => {
  const {
    maintenanceReport,
    loading,
    fetchMaintenanceReport,
  } = useContext(DetectionContext);

  const {
    latestSensorData,
    isConnected,
    getFormattedFreshness,
  } = useContext(WebSocketContext);

  useEffect(() => {
    console.log('[PREDICTIVE MAINTENANCE] Component mounted');
    fetchMaintenanceReport();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('[PREDICTIVE MAINTENANCE] Refreshing maintenance report');
      fetchMaintenanceReport();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMaintenanceReport]);

  if (loading) {
    return <div className="maintenance-loading">Loading maintenance data...</div>;
  }

  const pipes = maintenanceReport?.pipesData || [];
  const highRiskPipes = pipes.filter((p) => p.riskScore >= 70);
  const mediumRiskPipes = pipes.filter((p) => p.riskScore >= 40 && p.riskScore < 70);
  const lowRiskPipes = pipes.filter((p) => p.riskScore < 40);

  const getUrgencyIcon = (urgency) => {
    const level = urgency?.toUpperCase() || 'LOW';
    if (level === 'URGENT_INSPECTION' || level === 'URGENT') {
      return '🚨';
    }
    if (level === 'REPLACEMENT') {
      return '⚠️';
    }
    if (level === 'INSPECTION') {
      return '🔍';
    }
    return '📋';
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <div className="header-title">
          <FiTool className="header-icon" />
          <div>
            <h1>Predictive Maintenance & Risk Assessment</h1>
            <p>Pipe degradation analysis and maintenance recommendations</p>
          </div>
        </div>
      </div>

      {/* Real-time Risk Assessment from Sensor Data */}
      {isConnected && latestSensorData && (
        <div className="realtime-risk-section">
          <div className="realtime-header">
            <FiZap className="realtime-icon" />
            <span>Real-time Risk Assessment</span>
            <span className="freshness-badge">{getFormattedFreshness()}</span>
          </div>
          <div className="risk-assessment-grid">
            <div className={`risk-factor ${parseFloat(latestSensorData.pressure) > 60 ? 'high-risk' : 'normal'}`}>
              <div className="factor-header">
                <span className="factor-name">Pressure Risk</span>
                <span className="factor-value">{((parseFloat(latestSensorData.pressure) / 80) * 100).toFixed(0)}%</span>
              </div>
              <div className="risk-bar">
                <div
                  className="risk-fill"
                  style={{ width: `${Math.min(100, (parseFloat(latestSensorData.pressure) / 80) * 100)}%` }}
                />
              </div>
              <p className="risk-status">
                {parseFloat(latestSensorData.pressure) > 60 ? 'Elevated Pressure Detected' : 'Normal'}
              </p>
            </div>

            <div className={`risk-factor ${parseFloat(latestSensorData.flow) > 50 ? 'high-risk' : 'normal'}`}>
              <div className="factor-header">
                <span className="factor-name">Flow Risk</span>
                <span className="factor-value">{((parseFloat(latestSensorData.flow) / 80) * 100).toFixed(0)}%</span>
              </div>
              <div className="risk-bar">
                <div
                  className="risk-fill"
                  style={{ width: `${Math.min(100, (parseFloat(latestSensorData.flow) / 80) * 100)}%` }}
                />
              </div>
              <p className="risk-status">
                {parseFloat(latestSensorData.flow) > 50 ? 'High Flow Detected' : 'Normal'}
              </p>
            </div>

            <div className={`risk-factor ${parseFloat(latestSensorData.temperature) > 35 ? 'medium-risk' : 'normal'}`}>
              <div className="factor-header">
                <span className="factor-name">Temperature Risk</span>
                <span className="factor-value">{((parseFloat(latestSensorData.temperature) / 50) * 100).toFixed(0)}%</span>
              </div>
              <div className="risk-bar">
                <div
                  className="risk-fill"
                  style={{ width: `${Math.min(100, (parseFloat(latestSensorData.temperature) / 50) * 100)}%` }}
                />
              </div>
              <p className="risk-status">
                {parseFloat(latestSensorData.temperature) > 35 ? 'Temperature Elevated' : 'Optimal'}
              </p>
            </div>

            <div className="risk-factor">
              <div className="factor-header">
                <span className="factor-name">Overall Risk Score</span>
                <span className="factor-value">
                  {(
                    ((parseFloat(latestSensorData.pressure) / 80) * 100 +
                      (parseFloat(latestSensorData.flow) / 80) * 100 +
                      (parseFloat(latestSensorData.temperature) / 50) * 100) / 3
                  ).toFixed(0)}%
                </span>
              </div>
              <div className="risk-bar">
                <div
                  className="risk-fill overall"
                  style={{
                    width: `${(
                      ((parseFloat(latestSensorData.pressure) / 80) * 100 +
                        (parseFloat(latestSensorData.flow) / 80) * 100 +
                        (parseFloat(latestSensorData.temperature) / 50) * 100) / 3
                    )}%`,
                  }}
                />
              </div>
              <p className="risk-status">
                {(((parseFloat(latestSensorData.pressure) / 80) * 100 +
                   (parseFloat(latestSensorData.flow) / 80) * 100 +
                   (parseFloat(latestSensorData.temperature) / 50) * 100) / 3) > 60
                  ? 'Requires Immediate Attention'
                  : 'Maintenance Schedule OK'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Summary */}
      <div className="risk-summary">
        <div className="summary-card critical">
          <div className="summary-icon">🚨</div>
          <div className="summary-content">
            <p className="summary-label">Critical Risk Pipes</p>
            <p className="summary-count">{highRiskPipes.length}</p>
            <p className="summary-description">Require immediate inspection</p>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <p className="summary-label">Medium Risk Pipes</p>
            <p className="summary-count">{mediumRiskPipes.length}</p>
            <p className="summary-description">Schedule maintenance soon</p>
          </div>
        </div>

        <div className="summary-card success">
          <div className="summary-icon">✓</div>
          <div className="summary-content">
            <p className="summary-label">Low Risk Pipes</p>
            <p className="summary-count">{lowRiskPipes.length}</p>
            <p className="summary-description">Normal operation</p>
          </div>
        </div>
      </div>

      {/* Critical Risk Pipes */}
      {highRiskPipes.length > 0 && (
        <div className="pipes-section critical-section">
          <div className="section-header">
            <div className="section-title">
              <FiAlertTriangle className="section-icon" />
              <h2>Critical Risk Pipes ({highRiskPipes.length})</h2>
            </div>
            <span className="section-badge">URGENT ACTION REQUIRED</span>
          </div>

          <div className="pipes-grid">
            {highRiskPipes.map((pipe, idx) => (
              <div key={idx} className={`pipe-card risk-${getRiskColor(pipe.riskScore)}`}>
                <div className="pipe-header">
                  <h3>{pipe.name || `Pipe ${idx + 1}`}</h3>
                  <span className={`risk-score-badge ${getRiskColor(pipe.riskScore)}`}>
                    Risk: {pipe.riskScore}%
                  </span>
                </div>

                <div className="pipe-details">
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{pipe.location || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{pipe.material || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{pipe.ageYears || 0} years</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Diameter:</span>
                    <span className="detail-value">{pipe.diameter || 'N/A'} inches</span>
                  </div>
                </div>

                <div className="risk-factors">
                  <p className="risk-title">Risk Factors:</p>
                  <ul className="risk-list">
                    {pipe.riskFactors?.map((factor, fidx) => (
                      <li key={fidx}>{factor}</li>
                    )) || <li>Unknown factors</li>}
                  </ul>
                </div>

                <div className="pipe-recommendation">
                  <p className="rec-label">Recommended Action:</p>
                  <div className="rec-action">
                    <span className="action-icon">{getUrgencyIcon(pipe.recommendedAction?.type)}</span>
                    <div className="action-details">
                      <p className="action-type">{pipe.recommendedAction?.type || 'Inspection'}</p>
                      <p className="action-timeline">
                        {pipe.recommendedAction?.timeline || 'ASAP'}
                      </p>
                    </div>
                  </div>
                </div>

                {pipe.recommendedAction?.description && (
                  <div className="pipe-note">
                    <p>{pipe.recommendedAction.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium Risk Pipes */}
      {mediumRiskPipes.length > 0 && (
        <div className="pipes-section medium-section">
          <div className="section-header">
            <div className="section-title">
              <FiTrendingDown className="section-icon" />
              <h2>Medium Risk Pipes ({mediumRiskPipes.length})</h2>
            </div>
            <span className="section-badge">SCHEDULED MAINTENANCE</span>
          </div>

          <div className="pipes-grid">
            {mediumRiskPipes.map((pipe, idx) => (
              <div key={idx} className={`pipe-card risk-${getRiskColor(pipe.riskScore)}`}>
                <div className="pipe-header">
                  <h3>{pipe.name || `Pipe ${idx + 1}`}</h3>
                  <span className={`risk-score-badge ${getRiskColor(pipe.riskScore)}`}>
                    Risk: {pipe.riskScore}%
                  </span>
                </div>

                <div className="pipe-details">
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{pipe.location || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{pipe.material || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{pipe.ageYears || 0} years</span>
                  </div>
                </div>

                <div className="pipe-recommendation">
                  <p className="rec-label">Recommended Action:</p>
                  <div className="rec-action">
                    <span className="action-icon">{getUrgencyIcon(pipe.recommendedAction?.type)}</span>
                    <div className="action-details">
                      <p className="action-type">{pipe.recommendedAction?.type || 'Monitoring'}</p>
                      <p className="action-timeline">
                        {pipe.recommendedAction?.timeline || 'Within 3 months'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Risk Pipes */}
      {lowRiskPipes.length > 0 && (
        <div className="pipes-section low-section">
          <div className="section-header">
            <div className="section-title">
              <h2>Low Risk Pipes ({lowRiskPipes.length})</h2>
            </div>
            <span className="section-badge">NORMAL OPERATION</span>
          </div>

          <div className="pipes-grid">
            {lowRiskPipes.slice(0, 6).map((pipe, idx) => (
              <div key={idx} className={`pipe-card risk-${getRiskColor(pipe.riskScore)}`}>
                <div className="pipe-header compact">
                  <h3>{pipe.name || `Pipe ${idx + 1}`}</h3>
                  <span className={`risk-score-badge ${getRiskColor(pipe.riskScore)}`}>
                    {pipe.riskScore}%
                  </span>
                </div>
                <div className="pipe-details">
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{pipe.location || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{pipe.ageYears || 0} years</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Timeline */}
      <div className="timeline-section">
        <h2>Maintenance Timeline</h2>
        <div className="timeline">
          <div className="timeline-item immediate">
            <div className="timeline-marker">
              <FiAlertTriangle />
            </div>
            <div className="timeline-content">
              <h4>Immediate (This Week)</h4>
              <p>
                {maintenanceReport?.immediateActions?.count || 0} actions required
              </p>
              <ul className="action-list">
                {maintenanceReport?.immediateActions?.items?.map((action, idx) => (
                  <li key={idx}>{action}</li>
                )) || <li>No immediate actions required</li>}
              </ul>
            </div>
          </div>

          <div className="timeline-item short-term">
            <div className="timeline-marker">
              <FiClock />
            </div>
            <div className="timeline-content">
              <h4>Short-Term (This Month)</h4>
              <p>
                {maintenanceReport?.shortTermActions?.count || 0} actions recommended
              </p>
              <ul className="action-list">
                {maintenanceReport?.shortTermActions?.items?.map((action, idx) => (
                  <li key={idx}>{action}</li>
                )) || <li>No short-term actions required</li>}
              </ul>
            </div>
          </div>

          <div className="timeline-item long-term">
            <div className="timeline-marker">
              <FiTool />
            </div>
            <div className="timeline-content">
              <h4>Long-Term (Next 3 Months)</h4>
              <p>
                {maintenanceReport?.longTermActions?.count || 0} actions to plan
              </p>
              <ul className="action-list">
                {maintenanceReport?.longTermActions?.items?.map((action, idx) => (
                  <li key={idx}>{action}</li>
                )) || <li>No long-term actions identified</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Summary */}
      <div className="recommendations-section">
        <h2>Key Recommendations</h2>
        <div className="recommendations-list">
          {maintenanceReport?.summary || 'System is operating within normal parameters. Continue routine monitoring.'}
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenance;
