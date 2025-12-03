import React, { useState, useEffect } from 'react';
import {
  FiSettings, FiDownload, FiCpu, FiDatabase, FiSliders, FiActivity,
  FiTrendingUp, FiEye, FiEyeOff, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import LeakScenarioSimulator from './admin/LeakScenarioSimulator';
import DataExporter from './admin/DataExporter';
import ModelRetrainingInterface from './admin/ModelRetrainingInterface';
import PerformanceMonitor from './admin/PerformanceMonitor';
import SeedDataGenerator from './admin/SeedDataGenerator';
import TestModeToggle from './admin/TestModeToggle';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    modelAccuracy: 0,
    totalSimulations: 0,
  });

  useEffect(() => {
    console.log('[ADMIN PANEL] Component mounted');
    // Fetch admin metrics
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      console.log('[ADMIN PANEL] Fetching admin metrics');
      // Placeholder for actual API call
      setAdminMetrics({
        totalRequests: 2547,
        avgResponseTime: 45,
        modelAccuracy: 94.2,
        totalSimulations: 156,
      });
    } catch (err) {
      console.error('[ADMIN PANEL] Error fetching metrics:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'simulator', label: 'Leak Simulator', icon: FiSliders },
    { id: 'export', label: 'Data Export', icon: FiDownload },
    { id: 'training', label: 'Model Training', icon: FiCpu },
    { id: 'performance', label: 'Performance', icon: FiTrendingUp },
    { id: 'seeddata', label: 'Seed Data', icon: FiDatabase },
  ];

  return (
    <div className="admin-panel-wrapper">
      {/* Floating Admin Toggle Button */}
      <button
        className="admin-toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Admin Panel"
      >
        <FiSettings size={20} />
      </button>

      {/* Admin Panel Container */}
      {isExpanded && (
        <div className="admin-panel-container">
          {/* Header */}
          <div className="admin-panel-header">
            <div className="admin-title">
              <FiSettings size={24} />
              <h2>Admin Control Panel</h2>
            </div>
            <div className="admin-controls">
              <button
                className="test-mode-btn"
                onClick={() => setTestMode(!testMode)}
                title="Toggle Test Mode"
              >
                {testMode ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                {testMode ? 'Test Mode ON' : 'Test Mode OFF'}
              </button>
              <button
                className="close-btn"
                onClick={() => setIsExpanded(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="admin-tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                >
                  <IconComponent size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="admin-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="admin-section">
                <h3>System Overview</h3>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiActivity size={24} />
                    </div>
                    <div className="metric-info">
                      <p className="metric-label">Total API Requests</p>
                      <p className="metric-value">{adminMetrics.totalRequests.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiTrendingUp size={24} />
                    </div>
                    <div className="metric-info">
                      <p className="metric-label">Avg Response Time</p>
                      <p className="metric-value">{adminMetrics.avgResponseTime}ms</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiCpu size={24} />
                    </div>
                    <div className="metric-info">
                      <p className="metric-label">Model Accuracy</p>
                      <p className="metric-value">{adminMetrics.modelAccuracy}%</p>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiSliders size={24} />
                    </div>
                    <div className="metric-info">
                      <p className="metric-label">Simulations Run</p>
                      <p className="metric-value">{adminMetrics.totalSimulations}</p>
                    </div>
                  </div>
                </div>

                <div className="admin-info-section">
                  <h4>Quick Actions</h4>
                  <div className="action-buttons">
                    <button
                      className="action-btn primary"
                      onClick={() => setActiveTab('simulator')}
                    >
                      Run Leak Scenario
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => setActiveTab('export')}
                    >
                      Export Data
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => setActiveTab('seeddata')}
                    >
                      Generate Test Data
                    </button>
                  </div>
                </div>

                {testMode && (
                  <div className="test-mode-info">
                    <p><strong>Test Mode Enabled:</strong> All calculations and AI decisions will be logged.</p>
                    <p>Check browser console for detailed debugging information.</p>
                  </div>
                )}
              </div>
            )}

            {/* Leak Simulator Tab */}
            {activeTab === 'simulator' && <LeakScenarioSimulator testMode={testMode} />}

            {/* Data Export Tab */}
            {activeTab === 'export' && <DataExporter />}

            {/* Model Training Tab */}
            {activeTab === 'training' && <ModelRetrainingInterface />}

            {/* Performance Monitor Tab */}
            {activeTab === 'performance' && <PerformanceMonitor />}

            {/* Seed Data Tab */}
            {activeTab === 'seeddata' && <SeedDataGenerator testMode={testMode} />}
          </div>

          {/* Footer */}
          <div className="admin-panel-footer">
            <p className="footer-text">
              {testMode && '🔧 Test Mode Active - '}
              Admin Panel v1.0 | Last Updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
