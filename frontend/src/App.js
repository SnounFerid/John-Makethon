import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DetectionContextProvider } from './context/DetectionContext';
import { WebSocketContextProvider } from './context/WebSocketContext';
import Dashboard from './components/Dashboard';
import HistoricalData from './components/HistoricalData';
import LeakAlertPanel from './components/LeakAlertPanel';
import ValveControl from './components/ValveControl';
import AIInsights from './components/AIInsights';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import ConnectionStatus from './components/ConnectionStatus';
import {
  FiBarChart2,
  FiTrendingUp,
  FiAlertTriangle,
  FiPower,
  FiCpu,
  FiTool,
} from 'react-icons/fi';
import './styles/App.css';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>💧 Water Leak Detection System</h1>
        </div>

        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={() => setIsOpen(false)}>
              <FiBarChart2 /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/historical" onClick={() => setIsOpen(false)}>
              <FiTrendingUp /> Historical Data
            </Link>
          </li>
          <li>
            <Link to="/alerts" onClick={() => setIsOpen(false)}>
              <FiAlertTriangle /> Alerts
            </Link>
          </li>
          <li>
            <Link to="/valve" onClick={() => setIsOpen(false)}>
              <FiPower /> Valve Control
            </Link>
          </li>
          <li>
            <Link to="/ai-insights" onClick={() => setIsOpen(false)}>
              <FiCpu /> AI Insights
            </Link>
          </li>
          <li>
            <Link to="/maintenance" onClick={() => setIsOpen(false)}>
              <FiTool /> Maintenance
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

const App = () => {
  console.log('[APP] React application mounted');

  return (
    <WebSocketContextProvider>
      <DetectionContextProvider>
        <Router>
          <div className="app">
            <Navigation />
            <ConnectionStatus />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/historical" element={<HistoricalData />} />
                <Route path="/alerts" element={<LeakAlertPanel />} />
                <Route path="/valve" element={<ValveControl />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/maintenance" element={<PredictiveMaintenance />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="app-footer">
              <p>
                Water Leak Detection System v1.0 | Real-time monitoring and anomaly detection |{' '}
                {new Date().getFullYear()}
              </p>
            </footer>
          </div>
        </Router>
      </DetectionContextProvider>
    </WebSocketContextProvider>
  );
};

const NotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>404 - Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/">Back to Dashboard</Link>
  </div>
);

export default App;
