/**
 * Simple ML model simulation for leak prediction
 * In production, this would integrate with TensorFlow.js, scikit-learn, or similar
 */

class LeakDetectionModel {
  constructor() {
    this.isTraining = false;
    this.accuracy = 0;
    this.modelVersion = '1.0.0';
    this.lastTrainingDate = null;
  }

  /**
   * Simulate model training
   * Trains on historical sensor data and calculates accuracy metrics
   */
  async train(sensorData) {
    this.isTraining = true;
    const trainingStartTime = Date.now();

    try {
      // Simulate training process (2-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Calculate mock accuracy based on number of training samples
      // More data = higher accuracy (up to 95%)
      const baseAccuracy = Math.min(70 + (sensorData.length * 0.1), 95);
      this.accuracy = Math.round(baseAccuracy * 100) / 100;

      // Update model version
      const versionParts = this.modelVersion.split('.');
      versionParts[1] = parseInt(versionParts[1]) + 1;
      this.modelVersion = versionParts.join('.');

      this.lastTrainingDate = Date.now();
      this.isTraining = false;

      return {
        success: true,
        message: `Model trained successfully in ${Date.now() - trainingStartTime}ms`,
        accuracy: this.accuracy,
        modelVersion: this.modelVersion,
        trainingTime: Date.now() - trainingStartTime,
        samplesUsed: sensorData.length
      };
    } catch (error) {
      this.isTraining = false;
      throw error;
    }
  }

  /**
   * Predict leak probability based on sensor readings
   * Returns probability between 0 and 1
   */
  predictLeak(pressure, flow, valve_state) {
    let leakProbability = 0;

    // Pressure factor (0-0.4)
    const pressureThreshold = 1.0; // bar
    if (pressure < pressureThreshold) {
      leakProbability += (1 - pressure / pressureThreshold) * 0.4;
    }

    // Flow factor (0-0.4)
    const flowThreshold = 50; // L/min
    if (flow > flowThreshold) {
      const normalizedFlow = Math.min(flow / (flowThreshold * 2), 1);
      leakProbability += normalizedFlow * 0.4;
    }

    // Valve state factor (0-0.2)
    if (valve_state === 'OPEN' && flow > 10) {
      leakProbability += 0.1;
    }

    // Apply model accuracy to final prediction
    if (this.accuracy > 0) {
      leakProbability = leakProbability * (this.accuracy / 100);
    }

    // Cap probability between 0 and 1
    return Math.min(Math.max(leakProbability, 0), 1);
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      version: this.modelVersion,
      accuracy: this.accuracy,
      isTraining: this.isTraining,
      lastTrainingDate: this.lastTrainingDate,
      status: this.isTraining ? 'TRAINING' : 'READY'
    };
  }
}

// Singleton instance
const model = new LeakDetectionModel();

module.exports = {
  LeakDetectionModel,
  model
};
