import React, { useState, useRef } from 'react';
import { FiUpload, FiPlay, FiTrendingUp, FiCheck, FiAlertCircle } from 'react-icons/fi';
import '../../styles/admin/ModelRetrainingInterface.css';

const ModelRetrainingInterface = () => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResults, setTrainingResults] = useState(null);
  const [trainingSplit, setTrainingSplit] = useState({
    train: 70,
    validate: 20,
    test: 10,
  });
  const [hyperparameters, setHyperparameters] = useState({
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    regularization: 0.0001,
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('[MODEL RETRAINING] File selected:', file.name);
      setUploadedFile(file);
      setTrainingResults(null);
    }
  };

  const handleStartTraining = async () => {
    if (!uploadedFile) {
      alert('Please select a dataset file first');
      return;
    }

    try {
      console.log('[MODEL RETRAINING] Starting model training');
      setIsTraining(true);
      setTrainingProgress(0);

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('trainingSplit', JSON.stringify(trainingSplit));
      formData.append('hyperparameters', JSON.stringify(hyperparameters));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 1000);

      const response = await fetch('/api/admin/train-model', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Training failed: ${response.statusText}`);
      }

      const results = await response.json();
      setTrainingProgress(100);

      console.log('[MODEL RETRAINING] Training completed:', results);
      setTrainingResults(results);
    } catch (err) {
      console.error('[MODEL RETRAINING] Error:', err);
      setTrainingResults({
        error: err.message,
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleCancel = () => {
    setIsTraining(false);
    setTrainingProgress(0);
  };

  return (
    <div className="model-retraining">
      <h3>Model Retraining Interface</h3>
      <p className="section-description">
        Upload new datasets to retrain and improve ML model accuracy.
      </p>

      <div className="retraining-layout">
        {/* Dataset Upload */}
        <div className="upload-section">
          <h4>1. Upload Dataset</h4>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              disabled={isTraining}
              style={{ display: 'none' }}
            />
            <button
              className="upload-button"
              onClick={() => fileInputRef.current.click()}
              disabled={isTraining}
            >
              <FiUpload size={32} />
              <p>Click to select dataset</p>
              <span>CSV or JSON format</span>
            </button>

            {uploadedFile && (
              <div className="file-info">
                <FiCheck size={20} className="success" />
                <div>
                  <p className="filename">{uploadedFile.name}</p>
                  <p className="filesize">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Training Configuration */}
        <div className="config-section">
          <h4>2. Training Configuration</h4>

          {/* Data Split */}
          <div className="config-group">
            <h5>Data Split</h5>
            <div className="split-controls">
              <div className="split-item">
                <label>Training Set</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={trainingSplit.train}
                  onChange={(e) =>
                    setTrainingSplit({
                      ...trainingSplit,
                      train: parseInt(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
                <span className="percentage">{trainingSplit.train}%</span>
              </div>

              <div className="split-item">
                <label>Validation Set</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={trainingSplit.validate}
                  onChange={(e) =>
                    setTrainingSplit({
                      ...trainingSplit,
                      validate: parseInt(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
                <span className="percentage">{trainingSplit.validate}%</span>
              </div>

              <div className="split-item">
                <label>Test Set</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={trainingSplit.test}
                  onChange={(e) =>
                    setTrainingSplit({
                      ...trainingSplit,
                      test: parseInt(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
                <span className="percentage">{trainingSplit.test}%</span>
              </div>
            </div>
          </div>

          {/* Hyperparameters */}
          <div className="config-group">
            <h5>Hyperparameters</h5>
            <div className="param-grid">
              <div className="param-item">
                <label>Epochs</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={hyperparameters.epochs}
                  onChange={(e) =>
                    setHyperparameters({
                      ...hyperparameters,
                      epochs: parseInt(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
              </div>

              <div className="param-item">
                <label>Batch Size</label>
                <input
                  type="number"
                  min="8"
                  max="128"
                  step="8"
                  value={hyperparameters.batchSize}
                  onChange={(e) =>
                    setHyperparameters({
                      ...hyperparameters,
                      batchSize: parseInt(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
              </div>

              <div className="param-item">
                <label>Learning Rate</label>
                <input
                  type="number"
                  min="0.00001"
                  max="0.1"
                  step="0.0001"
                  value={hyperparameters.learningRate}
                  onChange={(e) =>
                    setHyperparameters({
                      ...hyperparameters,
                      learningRate: parseFloat(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
              </div>

              <div className="param-item">
                <label>Regularization</label>
                <input
                  type="number"
                  min="0"
                  max="0.01"
                  step="0.0001"
                  value={hyperparameters.regularization}
                  onChange={(e) =>
                    setHyperparameters({
                      ...hyperparameters,
                      regularization: parseFloat(e.target.value),
                    })
                  }
                  disabled={isTraining}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Training Progress */}
        {isTraining && (
          <div className="progress-section">
            <h4>Training Progress</h4>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${trainingProgress}%` }} />
              </div>
              <p className="progress-text">{Math.round(trainingProgress)}%</p>
            </div>
            <button className="btn danger" onClick={handleCancel}>
              Cancel Training
            </button>
          </div>
        )}

        {/* Training Results */}
        {trainingResults && !isTraining && (
          <div className={`results-section ${trainingResults.error ? 'error' : 'success'}`}>
            <h4>
              {trainingResults.error ? (
                <>
                  <FiAlertCircle size={20} /> Training Error
                </>
              ) : (
                <>
                  <FiTrendingUp size={20} /> Training Complete
                </>
              )}
            </h4>

            {trainingResults.error ? (
              <p>{trainingResults.error}</p>
            ) : (
              <div className="results-grid">
                <div className="result-item">
                  <span className="label">Final Accuracy</span>
                  <span className="value">{(trainingResults.accuracy * 100).toFixed(2)}%</span>
                </div>

                <div className="result-item">
                  <span className="label">Validation Loss</span>
                  <span className="value">{trainingResults.validationLoss.toFixed(4)}</span>
                </div>

                <div className="result-item">
                  <span className="label">Training Time</span>
                  <span className="value">{trainingResults.trainingTime}s</span>
                </div>

                <div className="result-item">
                  <span className="label">Model Size</span>
                  <span className="value">{trainingResults.modelSize} MB</span>
                </div>

                <div className="result-item">
                  <span className="label">Precision</span>
                  <span className="value">{(trainingResults.precision * 100).toFixed(2)}%</span>
                </div>

                <div className="result-item">
                  <span className="label">Recall</span>
                  <span className="value">{(trainingResults.recall * 100).toFixed(2)}%</span>
                </div>
              </div>
            )}

            {trainingResults.metrics && !trainingResults.error && (
              <div className="metrics-section">
                <h5>Detailed Metrics</h5>
                <div className="metrics-list">
                  <div className="metric">
                    <span>F1 Score:</span>
                    <strong>{(trainingResults.metrics.f1 * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="metric">
                    <span>ROC AUC:</span>
                    <strong>{(trainingResults.metrics.rocAuc * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="metric">
                    <span>Confusion Matrix Accuracy:</span>
                    <strong>{(trainingResults.metrics.confusion * 100).toFixed(2)}%</strong>
                  </div>
                </div>
              </div>
            )}

            {!trainingResults.error && (
              <button className="btn primary" disabled>
                <FiCheck size={18} /> Ready to Deploy
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isTraining && !trainingResults && (
          <div className="action-section">
            <button
              className="btn primary"
              onClick={handleStartTraining}
              disabled={!uploadedFile || isTraining}
            >
              <FiPlay size={18} /> Start Training
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h4>Training Guidelines</h4>
        <ul>
          <li>Upload CSV or JSON files with historical sensor data</li>
          <li>Ensure data includes: pressure, flow, temperature, conductivity, is_leak (label)</li>
          <li>Minimum 100 samples recommended for reliable training</li>
          <li>Training time varies based on dataset size and configuration</li>
          <li>Model will be evaluated on test set before deployment</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelRetrainingInterface;
