import React, { useState } from 'react';
import { FiDownload, FiCheck, FiAlertCircle } from 'react-icons/fi';
import '../../styles/admin/DataExporter.css';

const DataExporter = () => {
  const [exportType, setExportType] = useState('sensor-data');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    minProbability: 0,
    maxProbability: 100,
    severity: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const exportTypes = [
    { id: 'sensor-data', label: 'Sensor Data', description: 'All sensor readings' },
    { id: 'alerts', label: 'Alerts', description: 'Detection alerts and anomalies' },
    { id: 'detections', label: 'Detection Events', description: 'Leak detection events' },
    { id: 'valve-history', label: 'Valve History', description: 'Valve control actions' },
    { id: 'full-report', label: 'Full Report', description: 'Complete system report' },
  ];

  const handleExport = async () => {
    try {
      console.log('[DATA EXPORTER] Starting export:', { exportType, format, startDate, endDate });
      setIsExporting(true);
      setExportStatus(null);

      const response = await fetch('/api/admin/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exportType,
          format,
          startDate,
          endDate,
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({
        success: true,
        message: `Successfully exported ${exportType} as ${format.toUpperCase()}`,
      });

      console.log('[DATA EXPORTER] Export completed successfully');
    } catch (err) {
      console.error('[DATA EXPORTER] Error:', err);
      setExportStatus({
        success: false,
        message: `Export failed: ${err.message}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="data-exporter">
      <h3>Data Export</h3>
      <p className="section-description">
        Export system data in CSV or JSON format for analysis and backup.
      </p>

      <div className="export-form">
        {/* Export Type Selection */}
        <div className="form-section">
          <h4>Data Type</h4>
          <div className="type-grid">
            {exportTypes.map((type) => (
              <div
                key={type.id}
                className={`type-card ${exportType === type.id ? 'active' : ''}`}
                onClick={() => setExportType(type.id)}
              >
                <h5>{type.label}</h5>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="form-section">
          <h4>Date Range</h4>
          <div className="date-inputs">
            <div className="date-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
            <div className="date-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="form-section">
          <h4>Export Format</h4>
          <div className="format-buttons">
            <button
              className={`format-btn ${format === 'csv' ? 'active' : ''}`}
              onClick={() => setFormat('csv')}
              disabled={isExporting}
            >
              CSV
            </button>
            <button
              className={`format-btn ${format === 'json' ? 'active' : ''}`}
              onClick={() => setFormat('json')}
              disabled={isExporting}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        {exportType !== 'sensor-data' && (
          <div className="form-section">
            <h4>Filters</h4>
            <div className="filter-controls">
              <div className="filter-group">
                <label>Min Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minProbability}
                  onChange={(e) =>
                    setFilters({ ...filters, minProbability: parseInt(e.target.value) })
                  }
                  disabled={isExporting}
                />
              </div>

              <div className="filter-group">
                <label>Max Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxProbability}
                  onChange={(e) =>
                    setFilters({ ...filters, maxProbability: parseInt(e.target.value) })
                  }
                  disabled={isExporting}
                />
              </div>

              {exportType === 'alerts' && (
                <div className="filter-group">
                  <label>Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    disabled={isExporting}
                  >
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="form-actions">
          <button
            className="btn primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="spinner" /> Exporting...
              </>
            ) : (
              <>
                <FiDownload size={18} /> Export Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {exportStatus && (
        <div className={`export-status ${exportStatus.success ? 'success' : 'error'}`}>
          {exportStatus.success ? (
            <FiCheck size={20} />
          ) : (
            <FiAlertCircle size={20} />
          )}
          <p>{exportStatus.message}</p>
        </div>
      )}

      {/* Export Templates */}
      <div className="export-info">
        <h4>Quick Export Templates</h4>
        <div className="template-buttons">
          <button
            className="template-btn"
            onClick={() => {
              setExportType('sensor-data');
              setFormat('csv');
            }}
          >
            Last 7 Days Sensor Data (CSV)
          </button>
          <button
            className="template-btn"
            onClick={() => {
              setExportType('alerts');
              setFormat('json');
            }}
          >
            All Alerts This Month (JSON)
          </button>
          <button
            className="template-btn"
            onClick={() => {
              setExportType('full-report');
              setFormat('csv');
            }}
          >
            Complete System Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExporter;
